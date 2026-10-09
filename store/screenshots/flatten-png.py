#!/usr/bin/env python3
"""Strip the alpha channel from a PNG, in place.

Apple rejects creative assets that carry an alpha channel, and every PNG
rasteriser on this machine writes RGBA whether or not anything is
transparent. This machine has no PIL and no ImageMagick, so: decode,
drop the channel, re-encode. Composites over black, which is the
background these frames already use.

    python3 flatten-png.py file.png [more.png ...]
"""
import struct, sys, zlib, pathlib

def chunks(data):
    i = 8
    while i < len(data):
        n, = struct.unpack('>I', data[i:i+4])
        yield data[i+4:i+8], data[i+8:i+8+n]
        i += 12 + n

def paeth(a, b, c):
    p = a + b - c
    pa, pb, pc = abs(p-a), abs(p-b), abs(p-c)
    return a if pa <= pb and pa <= pc else (b if pb <= pc else c)

def flatten(path):
    raw = pathlib.Path(path).read_bytes()
    hdr, idat = None, bytearray()
    for kind, body in chunks(raw):
        if kind == b'IHDR': hdr = body
        elif kind == b'IDAT': idat += body
    w, h, depth, ctype, _, _, interlace = struct.unpack('>IIBBBBB', hdr)
    if ctype == 2:
        return f'{path}: already RGB'
    if (depth, ctype, interlace) != (8, 6, 0):
        raise SystemExit(f'{path}: expected 8-bit RGBA non-interlaced, got '
                         f'depth={depth} colour={ctype} interlace={interlace}')

    data = zlib.decompress(bytes(idat))
    stride, bpp = w * 4, 4
    prev = bytearray(stride)
    out = bytearray()
    pos = 0
    for _ in range(h):
        ft = data[pos]; pos += 1
        line = bytearray(data[pos:pos+stride]); pos += stride
        if ft == 1:
            for i in range(bpp, stride): line[i] = (line[i] + line[i-bpp]) & 255
        elif ft == 2:
            for i in range(stride): line[i] = (line[i] + prev[i]) & 255
        elif ft == 3:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif ft == 4:
            for i in range(stride):
                a = line[i-bpp] if i >= bpp else 0
                c = prev[i-bpp] if i >= bpp else 0
                line[i] = (line[i] + paeth(a, prev[i], c)) & 255
        elif ft != 0:
            raise SystemExit(f'{path}: unknown filter {ft}')
        prev = line
        # composite over black, then drop the channel
        rgb = bytearray(w * 3)
        for x in range(w):
            s, d = x * 4, x * 3
            a = line[s+3]
            if a == 255:
                rgb[d:d+3] = line[s:s+3]
            else:
                for k in range(3):
                    rgb[d+k] = (line[s+k] * a + 127) // 255
        out += b'\x00' + rgb

    def chunk(kind, body):
        return (struct.pack('>I', len(body)) + kind + body
                + struct.pack('>I', zlib.crc32(kind + body) & 0xffffffff))

    new = (b'\x89PNG\r\n\x1a\n'
           + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(bytes(out), 9))
           + chunk(b'IEND', b''))
    pathlib.Path(path).write_bytes(new)
    return f'{path}: {w} × {h} RGB, {len(new)/1_048_576:.1f} MB'

if __name__ == '__main__':
    for p in sys.argv[1:]:
        print(flatten(p))
