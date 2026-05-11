# Production Handoff — From Generated Art to Shipped Game

Generating great-looking 4K assets is only half the job. Real slot games
need those assets packed, compressed, profiled, and verified on target
hardware before they ship. This doc covers the discipline between
"upscaled and approved" (end of `/slot-step-09`) and "ready for the
engine team" — what the engineering side needs from you and how to
deliver it without forcing a re-bake later.

Imported from `MASTER_ART_REFERENCE.md §11` (technical delivery) plus
production lessons from the 4470 Tesla ship.

## Contents

- **Atlas packing** — MaxRects, padding rules, single-atlas targets
- **Image compression** — PNG → pngquant/oxipng, WebP, ASTC/ETC2 on device
- **Color authoring discipline** — sRGB, noise dither on gradients, banding
- **Performance budgets** — fullscreen alpha layer caps, fill-rate math
- **Naming + folder structure for handoff** — what engineers expect
- **Verification checklist** — what to test before sign-off

---

## Atlas packing

Mobile slot engines composite from sprite atlases — packed PNG/WebP
images containing every symbol, every UI element, every banner tier as
sub-regions of one bigger texture. Engineering provides the packer (often
TexturePacker or a custom MaxRects implementation); you provide the inputs.

### Per-symbol inputs

Each symbol exports as its own PNG with **transparent padding**:

- **1–2 px transparent padding** on every side at the native resolution.
  This is what prevents bleed between adjacent atlas regions when the GPU
  samples with bilinear filtering.
- **12 px transparent padding** if the engine uses bilinear filtering at
  significant scale (most modern engines do). Confirm with engineering
  which budget applies.
- **Power-of-two friendly dimensions** are NOT required for individual
  symbols — the atlas itself is power-of-two, but sub-regions are arbitrary.

### Atlas targets

Aim for **one 2048×2048 atlas per symbol set**. Common reasons it splits
into two:

- Bonus-game symbols don't share a sheet with base symbols (different
  loaded states)
- Banners/win celebrations are their own atlas (loaded later, kept out
  of the gameplay-loop atlas)
- UI chrome (bezel, HUD, buttons) is a separate atlas

If a single set blows past 2048², either downsize the largest symbols
(LP doesn't need to be the same size as HP) or split it. Two 2048²
atlases load faster on most mobile GPUs than one 4096².

### Margins for stacked / expanding symbols

If the brief calls for symbols that visually overflow their cell (stacked
wilds with crowns above the cell rect, expanding scatters with glow
spilling outward), reserve **30–50% extra transparent margin** in those
specific symbols. Engineering can mask the overflow at runtime; they
can't reconstruct it.

---

## Image compression

### PNG optimization

Run every PNG through optimization before handoff:

- **pngquant** for lossy 8-bit quantization (best for UI flat icons,
  card royals, LP symbols). 30–50% size reduction with no visible loss
  if you cap to 256 colors carefully.
- **oxipng** for lossless re-encoding (best for painterly HP symbols,
  key art, anything with subtle gradients). 10–20% size reduction.

Run these before delivery so the engineering team isn't re-optimizing
your output. Pre-optimized PNGs also make it obvious if a symbol was
modified after handoff (file hash changes).

### WebP

WebP is **20–30% smaller** than equivalent PNG for the same visual
quality. Use it when:

- Target engine has WebP support enabled (modern Unity/Unreal: yes)
- The platform's WebView/decoder is on a version that supports it
  (Android 4.0+, iOS 14+, all major browsers)

Provide PNG as the primary deliverable and WebP as an optional secondary
unless engineering specifies WebP-only.

### On-device formats (engineering decision, but know the constraints)

- **ASTC** (Adaptive Scalable Texture Compression) — modern mobile
  standard. iOS A8+, Android 6+. Variable bitrate, very high quality.
- **ETC2** — Android fallback. OpenGL ES 3.0+. Adequate quality, larger
  than ASTC.
- **PVRTC** — Legacy iOS. Avoid unless targeting very old devices.

Engineering converts from your authored PNG/WebP into ASTC/ETC2 at build
time. **Author at the resolution the final atlas will use**, not at 4K
"to be safe" — over-resolution wastes texture memory.

### A useful number to remember

A **2048×2048 RGBA uncompressed** texture is **16 MB** in VRAM. On a
phone with 2–4 GB total RAM and games budgeting ~200 MB for textures,
you can afford ~12 atlases like this. ASTC drops that to ~4 MB per
atlas (4× compression at high quality). This is why compression and
atlas-count discipline matter — visual quality is gated by VRAM, not
authoring resolution.

---

## Color authoring discipline

### Author in sRGB

All NB2 / fal.ai output is sRGB by default. Confirm your image-viewing
and asset-finalization tools (Photoshop, Affinity, anything you touch
the PNGs in) are also set to sRGB color space. Authoring in P3 or
ProPhoto and saving as sRGB blind-converts your colors — what you saw
in your editor is not what ships.

### Noise dither on gradients to prevent banding

Gradients that look smooth at 4K can develop visible **banding** when
compressed (especially ASTC/ETC2 at lower bitrates) and viewed on
8-bit-per-channel mobile displays. Two mitigations:

- Add **1–3% noise dither** to gradient regions during authoring.
  Imperceptible at the asset level, dramatically reduces banding after
  compression.
- Avoid pure-gradient backgrounds for hero assets. NB2's painterly
  output naturally avoids this — vector-style flat exports are the
  main risk.

### Pure-white pitfalls

`#FFFFFF` (pure white) on OLED panels causes **halation** — a faint
glow bleeding into adjacent pixels. For text on dark BG, prefer warm
white (`#FFF8E0`) or a slight off-white (`#FAFAFA`). The 7-layer numeral
stack in `slot-step-06/BANNERS_TEMPLATE.md` already avoids pure white in
its top gradient stop (`#FFE066`) — that's not an accident.

---

## Performance budgets

### Fullscreen alpha layer cap

Cap **simultaneous fullscreen alpha layers at 4–6** in any single frame.
Each fullscreen alpha layer = one full-screen fill-rate pass. Mobile
GPUs are fill-rate-bound, especially on older Android devices.

Practical implication: a win celebration banner with vignette + sunburst
rays + god rays + gradient overlay + frame is already 5 layers. Adding
ambient particles, a fullscreen flash, and a UI overlay on top would
push you to 8 — frame-rate drops visibly. Either reduce layer count or
discuss with engineering whether some layers can be baked into one
texture at runtime.

### Texture memory budget

- Symbol atlases (2048²): ~3–4 atlases for one game's symbol set + variants
- UI atlas (often 1024² or 2048²): ~1 atlas
- Banner / celebration atlas: ~1 atlas
- Background: 1920×1080 or 1080×1920 PNG, NOT atlased

Total target: under 100 MB of texture data on disk, under 200 MB in
VRAM after decompression. If your authoring outputs are pushing this,
the brief asked for too many symbols or too much resolution.

---

## Naming + folder structure for handoff

Engineering teams differ in their preferred structure, but a common pattern:

```
<GameID>_handoff/
├── 01_symbols/
│   ├── HP1.png
│   ├── HP2.png
│   ├── ... (every approved symbol)
│   └── _atlas_layout_notes.md   ← any overflow/expanding-symbol margin notes
├── 02_backgrounds/
│   ├── BG_base.png
│   ├── BG_freespins.png
│   └── ...
├── 03_ui/
│   ├── Bezel.png
│   ├── HUD.png
│   ├── Paytable.png
│   └── ...
├── 04_banners/
│   ├── Banner_big.png
│   ├── Banner_mega.png
│   └── Banner_epic.png
├── 05_logos/
│   ├── Logo_hero.png
│   └── Logo_compact.png
├── 06_lobby/
│   └── LobbyTile.png
├── 07_QA/
│   ├── QA_FINAL.md             ← the GREEN audit report
│   └── ...
├── 08_source/
│   ├── project.json            ← full project state for engineering reference
│   ├── game_brief.json
│   └── style_anchor.png        ← the locked key art (4K)
└── README.md                   ← per-game handoff notes for engineering
```

Engineering can re-pack into their own atlas structure from this layout.
The numbered folders make scan-and-grep work.

Filenames at handoff drop the `_NNN` iteration counter — only the
approved version goes through. `HP1_002.png` becomes `HP1.png` in the
handoff folder.

---

## Verification checklist

Before declaring handoff complete:

- [ ] Every approved symbol exported as its own PNG with transparent padding
- [ ] All PNGs run through pngquant or oxipng (file sizes verified shrunk)
- [ ] sRGB color space confirmed on every export (check file metadata)
- [ ] Largest single symbol < 1024×1024 at handoff resolution
- [ ] Banner tiers visibly differ on ≥2 axes (see `BANNERS_TEMPLATE.md`)
- [ ] Tested at lobby thumbnail size in a competitor-grid mockup (see `LOBBY_TILE_TEMPLATE.md`)
- [ ] CVD simulator run on the full symbol sheet (see `art_principles.md` §8)
- [ ] Banding check on gradients — viewed on an 8-bit display with brightness up
- [ ] Performance estimate stays under the texture budget (rough math, not exact)
- [ ] `QA_FINAL.md` is GREEN, signed off
- [ ] Per-game README explains anything non-obvious (overflow margins,
      mode-state palette shifts, runtime numeral sizing, etc.)

This is the final gate before code review on engineering's side. Catching
banding or sRGB drift here is 10× cheaper than catching it after the game
is in a build.
