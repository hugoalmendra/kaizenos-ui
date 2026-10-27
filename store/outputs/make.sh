#!/bin/sh
# One standalone HTML and one PDF per output, for sending to people who
# are not going to click through the prototype.
#
# Chrome does the PDFs because it is the only renderer on this machine
# that knows the print CSS these documents carry.
set -e
cd "$(dirname "$0")"
python3 make.py
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[ -x "$CHROME" ] || { echo "Chrome not found — HTML written, PDFs skipped"; exit 0; }
for f in *.html; do
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="${f%.html}.pdf" "file://$PWD/$f" >/dev/null 2>&1
  printf '%-26s %6s KB\n' "${f%.html}.pdf" "$(( $(wc -c < "${f%.html}.pdf") / 1024 ))"
done
