# App Store screenshots

`./make.sh <source-dir> [out-dir]` turns captures into the size App Store
Connect wants. Files are taken in filename order and numbered, so name
them in the order you want them seen.

## What Apple actually requires

**One set at 6.9" is enough for iPhone.** Apple scales it down for every
smaller device; the old 6.5" and 5.5" sets are no longer needed.

| Slot | Size | Required |
|---|---|---|
| iPhone 6.9" | 1290 × 2796 or 1320 × 2868 | **yes** |
| iPad 13" | 2064 × 2752 or 2048 × 2732 | only if the app ships for iPad |

The script targets **1290 × 2796** because its aspect matches what an
iPhone actually captures. 1320 × 2868 is 0.4% narrower in proportion, so
going there stretches the image very slightly for no gain.

Up to 10 per slot. Three to five is the working number, and **the first
two are what almost anyone sees** — in search results nobody scrolls.

## Capture from the real build, at full resolution

Apple requires screenshots to show the app as it is (guideline 2.3.3), so
these come from the device, not from the design files.

Two things that quietly ruin a set:

- **Screenshots that have been through a chat app or email are already
  downscaled.** Move the originals with AirDrop, a cable, or iCloud Photos.
  The script warns when a source is smaller than the target instead of
  silently upscaling, because a soft screenshot is the first thing a buyer
  sees and cannot be fixed after upload.
- **TestFlight leaves `◀ TestFlight` in the status bar.** Capture from a
  build launched from the home screen, not one opened through TestFlight,
  or the beta chrome ships to the store.

## Before capturing, check the screen is shippable

A screenshot freezes whatever copy is on screen that day. Worth a pass for
internal language — "MVP", "deferred", placeholder percentages, debug
counters — before the capture, not after the upload.
