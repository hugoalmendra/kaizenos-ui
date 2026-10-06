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

## The capture device decides whether this is easy

App Store sizes are bigger than most phones capture. What a device gives
you natively:

| Device | Capture | Reaches 6.9"? |
|---|---|---|
| iPhone 16 / 15 Pro Max | 1290 × 2796 | **yes, exactly** |
| iPhone 16 Pro Max | 1320 × 2868 | **yes, exactly** |
| iPhone 12 / 13 / 14 | 1170 × 2532 | no — needs a 1.10× upscale |
| iPhone 12 / 13 mini | 1080 × 2340 | no — 1.19× upscale |

**The clean answer is the Simulator.** Run the app on an iPhone 16 Pro Max
simulator and screenshot there: the capture is already 1320 × 2868, sharp,
and costs nothing. Xcode's Simulator produces the exact store sizes for
every device Apple asks for, which is why most teams never capture store
screenshots on real hardware.

**The acceptable fallback** is a 1170 × 2532 capture from an iPhone 12-class
device upscaled 1.10× to 1290 × 2796. Ten percent is mild and the aspect is
within 0.15%, so nothing is visibly stretched — but it is softer than a
native capture, on the one image that sells the app.

What is not acceptable is a screenshot that has been through a chat app
first. Those arrive around 924 × 2000, which is 0.79× of an iPhone 12
capture, and reaching 1290 from there is a 1.40× upscale that looks it.

## Capture from the real build

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
