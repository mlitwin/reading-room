# App icon source

The app icon is the silver reverse of a Ptolemy II tetradrachm, edge-enhanced and inset on a charcoal field.

## Source

| | |
|---|---|
| File | `ans-1944.100.76124.rev.jpg` |
| Object | Silver tetradrachm of Ptolemy II Philadelphus |
| Date | 255–254 BCE |
| Mint | Alexandria |
| Collection | American Numismatic Society, accession **1944.100.76124** |
| Catalog URL | https://numismatics.org/collection/1944.100.76124 |
| Source URL | https://numismatics.org/collectionimages/19001949/1944/1944.100.76124.rev.noscale.jpg |
| Original size | 2648 × 2436 px |
| License | Public Domain (ANS marks pre-1925-object images as PD; the coin itself is ~2,280 years old) |

The reverse shows the standard Ptolemaic eagle on a thunderbolt with the inscription **ΠΤΟΛΕΜΑΙΟΥ ΣΩΤΗΡΟΣ** — "of Ptolemy Soter," honoring the founder of the dynasty rather than the more common ΒΑΣΙΛΕΩΣ ("of the King") legend. Both are authentic Ptolemaic; at icon scale the difference reads as texture, not text.

## Why a coin

The Ptolemaic dynasty ruled Alexandria, home to the ancient world's most famous library — a fitting symbol for a personal reading room.

## How the icon is built

The committed icon at `app/ReadingRoom/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` is generated from this source by:

```sh
# 1. Flood-fill the studio background to transparent. Operate on the
#    FULL source (no pre-crop) so we don't slice into the coin — its
#    extent isn't perfectly centered in the original photo.
magick ans-1944.100.76124.rev.jpg \
  -alpha set -bordercolor white -border 1 \
  -fuzz 12% -fill none -floodfill +0+0 white \
  -shave 1x1 \
  cutout.png

# 2. Auto-trim to the coin's natural bounding box, then pad to a square
#    so the inset is centered on both axes.
magick cutout.png -trim +repage trimmed.png
magick trimmed.png \
  -background none -gravity center -extent 2596x2596 \
  squared.png

# 3. Edge-enhance the relief and gently stretch contrast.
magick squared.png \
  -unsharp 0x2.5+1.2+0.04 \
  -modulate 100,110,100 \
  -level 3%,97% \
  enhanced.png

# 4. Inset onto a charcoal field at 1024 × 1024.
magick \
  -size 1024x1024 xc:'#1a1b1f' \
  \( enhanced.png -resize 880x880 \) \
  -gravity center -compose over -composite \
  -define png:color-type=2 -depth 8 -strip \
  PNG24:../../app/ReadingRoom/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png
```

Why each step matters:
- **Flood-fill on the full source** — earlier versions pre-cropped to 2400 × 2400, which clipped the coin's left/right extents into hard vertical edges. The coin isn't centered in the original photo; operating on the full image and letting `-trim` find the silhouette avoids that.
- **Pad to square** — the trimmed bounding box is 2596 × 2384 (wider than tall). Centering it on a transparent square keeps the coin centered horizontally and vertically in the final icon instead of off to one side.
- **Unsharp mask** — lifts the eagle's relief out of the silver. At home-screen size the detail would mush together without it.
- **880 × 880 inside 1024 × 1024** — gives ~70 px margin per side, which sits comfortably inside the iOS squircle mask without the coin's irregular edge touching it.
- **PNG24, no alpha, sRGB** — Apple's icon requirements.

The irregular outer edge of the coin is intentional and authentic — ancient hand-struck coinage isn't a perfect circle, and the irregularity is part of what reads as "ancient artifact" rather than "logo."

## Attribution

Public-domain source, so no attribution is strictly required, but it's polite to credit. The line, if/when an Acknowledgements screen exists:

> App icon adapted from a coin in the American Numismatic Society collection (1944.100.76124), public domain.
