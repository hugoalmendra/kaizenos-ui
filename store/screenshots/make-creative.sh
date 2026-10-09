#!/bin/sh
# Renders the creative assets to the PNGs App Store Connect accepts.
# Apple takes .png only for these placements, and rejects an alpha
# channel — every rasteriser here writes RGBA, so flatten-png.py drops it.
set -e
cd "$(dirname "$0")"
python3 make-frames.py
for f in creative-header creative-search creative-16x9; do
  rsvg-convert -o "$f.png" "$f.svg"
  python3 flatten-png.py "$f.png"
done
