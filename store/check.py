#!/usr/bin/env python3
"""Character counts against Apple's limits. Run after editing the copy."""
import re, sys, pathlib

LIMITS = {'Subtitle': 30, 'Promotional text': 170, 'Description': 4000, 'Keywords': 100}
src = pathlib.Path(__file__).with_name('app-store-connect.md').read_text()

fails = 0
for name, limit in LIMITS.items():
    m = re.search(r'^## ' + re.escape(name) + r'[^\n]*\n(.*?)^```\n(.*?)^```', src, re.S | re.M)
    if not m:
        print(f'{name:<18} NOT FOUND'); fails += 1; continue
    body = m.group(2).rstrip('\n')
    n = len(body)
    ok = n <= limit
    fails += not ok
    print(f'{name:<18} {n:>5} / {limit:<5} {"ok" if ok else "OVER BY %d" % (n - limit)}')

sys.exit(1 if fails else 0)
