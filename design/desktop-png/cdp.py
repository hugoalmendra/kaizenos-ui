"""A small Chrome DevTools Protocol client, stdlib only.

`--screenshot` decides for itself when the page is done, and it decides
wrong: it fires mid-paint and a panel comes back missing, differently on
every run. This talks to Chrome instead, so the shot is taken when the
page says it is ready and not a moment before.

Only what the renderer needs: one websocket, synchronous request/reply.
"""
import base64
import json
import os
import socket
import struct
import subprocess
import tempfile
import time
import urllib.request
from urllib.parse import urlparse

CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'


class WebSocket:
    """RFC 6455, client side, text frames, no extensions."""

    def __init__(self, url, timeout=120):
        u = urlparse(url)
        self.sock = socket.create_connection((u.hostname, u.port), timeout=timeout)
        self.sock.settimeout(timeout)
        key = base64.b64encode(os.urandom(16)).decode()
        path = u.path + ('?' + u.query if u.query else '')
        self.sock.sendall((
            f'GET {path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n'
            'Upgrade: websocket\r\nConnection: Upgrade\r\n'
            f'Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n'
        ).encode())
        self.buf = b''
        while b'\r\n\r\n' not in self.buf:
            chunk = self.sock.recv(4096)
            if not chunk:
                raise ConnectionError('handshake closed')
            self.buf += chunk
        head, self.buf = self.buf.split(b'\r\n\r\n', 1)
        if b'101' not in head.split(b'\r\n')[0]:
            raise ConnectionError('handshake refused: ' + head.decode(errors='replace')[:200])

    def _read(self, n):
        while len(self.buf) < n:
            chunk = self.sock.recv(1 << 20)
            if not chunk:
                raise ConnectionError('closed mid-frame')
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, text):
        payload = text.encode()
        n = len(payload)
        header = b'\x81'
        if n < 126:
            header += struct.pack('!B', 0x80 | n)
        elif n < 1 << 16:
            header += struct.pack('!BH', 0x80 | 126, n)
        else:
            header += struct.pack('!BQ', 0x80 | 127, n)
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(header + mask + masked)

    def recv(self):
        """One complete message, reassembling continuation frames."""
        parts = []
        while True:
            b0, b1 = self._read(2)
            fin, opcode = b0 & 0x80, b0 & 0x0F
            n = b1 & 0x7F
            if n == 126:
                n = struct.unpack('!H', self._read(2))[0]
            elif n == 127:
                n = struct.unpack('!Q', self._read(8))[0]
            data = self._read(n)
            if opcode == 0x8:
                raise ConnectionError('server closed')
            if opcode == 0x9:                       # ping
                self.sock.sendall(b'\x8a\x80' + os.urandom(4))
                continue
            if opcode == 0xA:
                continue
            parts.append(data)
            if fin:
                return b''.join(parts).decode()

    def close(self):
        try:
            self.sock.close()
        except OSError:
            pass


class Browser:
    """One headless Chrome, reused for every shot."""

    def __init__(self, extra_args=()):
        self.profile = tempfile.mkdtemp(prefix='kaiso-cdp-')
        # The GPU is left on its default, which on macOS is already ANGLE
        # over Metal. Measured over this protocol, --disable-gpu is the
        # slower of the two (19.2s against 12.8s for five screens) and its
        # blur rasterises differently, so the shots are not comparable
        # with the ones in the Figma file. It does not drop backdrop-filter
        # layers, which is what a parallel session and I both believed for
        # a while: that symptom was --screenshot firing mid-paint, and it
        # went away with the protocol, not with the flag.
        self.proc = subprocess.Popen(
            [CHROME, '--headless', '--hide-scrollbars',
             '--no-first-run', '--no-default-browser-check', '--mute-audio',
             '--remote-debugging-port=0', f'--user-data-dir={self.profile}',
             *extra_args, 'about:blank'],
            stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        port = self._await_port()
        targets = json.load(urllib.request.urlopen(f'http://127.0.0.1:{port}/json/list'))
        page = next(t for t in targets if t['type'] == 'page')
        self.ws = WebSocket(page['webSocketDebuggerUrl'])
        self.n = 0
        self.send('Page.enable')
        self.send('Runtime.enable')

    def _await_port(self, timeout=30):
        """Chrome writes the port it actually took into the profile."""
        f = os.path.join(self.profile, 'DevToolsActivePort')
        deadline = time.time() + timeout
        while time.time() < deadline:
            if os.path.exists(f):
                text = open(f).read().split('\n')
                if text and text[0].strip():
                    return int(text[0].strip())
            if self.proc.poll() is not None:
                raise RuntimeError('chrome exited: '
                                   + self.proc.stderr.read().decode(errors='replace')[-400:])
            time.sleep(0.05)
        raise TimeoutError('chrome never reported a debugging port')

    def send(self, method, **params):
        self.n += 1
        self.ws.send(json.dumps({'id': self.n, 'method': method, 'params': params}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get('id') != self.n:
                continue                     # an event, or a reply we are past
            if 'error' in msg:
                raise RuntimeError(f'{method}: {msg["error"]}')
            return msg.get('result', {})

    def evaluate(self, expression):
        r = self.send('Runtime.evaluate', expression=expression, returnByValue=True,
                      awaitPromise=True)
        if r.get('exceptionDetails'):
            raise RuntimeError('eval: ' + json.dumps(r['exceptionDetails'])[:300])
        return r['result'].get('value')

    def on_new_document(self, source):
        """Runs before any of the page's own scripts, on every navigation."""
        return self.send('Page.addScriptToEvaluateOnNewDocument', source=source)['identifier']

    def remove_on_new_document(self, ident):
        self.send('Page.removeScriptToEvaluateOnNewDocument', identifier=ident)

    def viewport(self, w, h, scale=2):
        self.send('Emulation.setDeviceMetricsOverride', width=w, height=h,
                  deviceScaleFactor=scale, mobile=False)

    def goto(self, url, ready, timeout=60):
        """Navigate, then wait for the page's own readiness signal."""
        self.send('Page.navigate', url=url)
        deadline = time.time() + timeout
        while time.time() < deadline:
            try:
                if self.evaluate(ready):
                    return True
            except RuntimeError:
                pass                         # mid-navigation; the context is gone
            time.sleep(0.05)
        return False

    def screenshot(self, path):
        r = self.send('Page.captureScreenshot', format='png',
                      captureBeyondViewport=False, optimizeForSpeed=False)
        path.write_bytes(base64.b64decode(r['data']))

    def close(self):
        self.ws.close()
        self.proc.terminate()
        try:
            self.proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            self.proc.kill()
