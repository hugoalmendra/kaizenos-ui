#!/usr/bin/env bash
# App Store screenshots → the sizes App Store Connect accepts.
#
#   ./make.sh <source-dir> [out-dir]
#
# Source files are taken in filename order and renamed 1_… 2_… so the
# listing shows them in that order. Put them in the order you want them
# seen, because the first two are what almost anyone looks at.
#
# Only sips is used, which is on every Mac — no Homebrew, no Python.
set -euo pipefail

SRC="${1:?usage: make.sh <source-dir> [out-dir]}"
OUT="${2:-./out}"

# One 6.9" set is all Apple requires for iPhone; it scales that set down
# for every smaller device. 1290x2796 is the 6.9" size whose aspect
# matches what iPhones actually capture, so nothing is stretched.
W=1290; H=2796

mkdir -p "$OUT"
i=0
for f in "$SRC"/*; do
  # lowercased with tr, because macOS still ships bash 3.2
  case "$(printf '%s' "$f" | tr '[:upper:]' '[:lower:]')" in
    *.png|*.jpg|*.jpeg|*.webp|*.heic) ;; *) continue ;;
  esac
  i=$((i+1))
  name=$(basename "${f%.*}")
  dst="$OUT/${i}_${name}.png"

  sw=$(sips -g pixelWidth  "$f" | awk '/pixelWidth/{print $2}')
  sh=$(sips -g pixelHeight "$f" | awk '/pixelHeight/{print $2}')

  # Warn rather than silently upscale: a soft screenshot is the first
  # thing a buyer sees, and it cannot be fixed after upload.
  if [ "$sw" -lt "$W" ]; then
    echo "  ! ${name}: ${sw}x${sh} is smaller than ${W}x${H} — this will be upscaled and soft."
  fi

  sips -s format png "$f" --out "$dst" >/dev/null
  sips -z "$H" "$W" "$dst" >/dev/null          # exact canvas; aspect differs by 0.1%
  echo "  ${name}: ${sw}x${sh} -> ${W}x${H}  $(basename "$dst")"
done

echo
echo "$i file(s) in $OUT — upload these to the 6.9\" slot."
