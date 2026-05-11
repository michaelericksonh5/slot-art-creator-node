# Asset Naming Convention

Every generated file in a project folder follows the same flat naming
pattern: `{AssetLabel}_{NNN}.png`. Three-digit zero-padded counter,
per-label, monotonically increasing, never overwritten.

The goal: any team member can scan a project folder and instantly know
what each file is and which version they're looking at.

---

## Naming rules

1. **Format:** `{Label}_{NNN}.{ext}` — three-digit zero-padded counter
2. **Per-label counter:** `Key_001`, `Key_002`, `HP1_001`, `HP1_002` —
   each label has its own counter
3. **No overwrites, ever:** before saving, scan the folder for files
   matching `{Label}_*.{ext}`, find the max number, increment by 1
4. **No metadata in the filename:** no resolution, no aspect ratio, no
   timestamp, no prompt slug. Just the label and the number.
5. **PNG only** for image assets (use `.md` for QA reports, `.json` for
   manifests)
6. **Every PNG gets a sidecar.** `HP1_001.png` is paired with
   `HP1_001.meta.json` containing the prompt, model, provider, references,
   timestamps. Written automatically by the MCP server. Never deleted.

---

## Sidecar metadata files

Every generated PNG produces a paired `.meta.json`:

```
HP1_001.png         ← the image
HP1_001.meta.json   ← what produced it
```

Schema (`h5g_asset.meta.v1`):

```json
{
  "schema": "h5g_asset.meta.v1",
  "filename": "HP1_001.png",
  "full_path": "H:\\...\\4470_merickson\\HP1_001.png",
  "generated_at": "2026-05-06T16:30:12.345Z",
  "tool": "nb2_generate",
  "provider": "fal.ai",
  "model": "fal-ai/nano-banana-2",
  "prompt": "Phoenix character bust facing front, wings spread, ...",
  "image_size": "2K",
  "aspect_ratio": "1:1",
  "reference_images": ["H:\\...\\Key_003.png"],
  "source_image": null,
  "duration_seconds": 12.4
}
```

Why sidecars matter:
- **Provenance.** Anyone can see exactly what prompt + references produced
  any PNG. Critical for QA, iteration, and audit.
- **Repro.** A user can re-run a generation by reading the sidecar and
  passing the same prompt/refs back to `nb2_generate`.
- **Survives copying.** When a user shares the project folder with a
  partner, the sidecars come along.
- **Independent of `project.json`.** If `project.json` is corrupted or
  deleted, the sidecars still tell you what each image is.

The sidecar is written automatically — design skills don't need to do
anything extra. Failure to write the sidecar never blocks the generation
result; it's logged and ignored.

---

## Label table

| Asset | Label | Examples |
|---|---|---|
| Key art | `Key` | `Key_001.png`, `Key_002.png` |
| Symbol contact sheet | `Sheet` | `Sheet_001.png` |
| HP1–HP4 symbols | `HP1`–`HP4` | `HP1_001.png`, `HP4_002.png` |
| MP1–MP3 symbols | `MP1`–`MP3` | `MP1_001.png` |
| LP1–LP6 symbols | `LP1`–`LP6` | `LP3_001.png` |
| Wild — standard | `WD` or `WD1` | `WD1_001.png` |
| Wild — variants (sticky / stacked / etc.) | `WD2`, `WD3`, ... | `WD2_001.png` |
| Scatter (classic) | `SC` | `SC_001.png` |
| Coin / Hold-and-Spin family | `WY1`–`WY4` | `WY1_001.png`, `WY2_001.png` |
| Bonus trigger | `BO` | `BO_001.png` |
| Mystery / Special Feature | `SF` | `SF_001.png` |
| Blocker / Dead | `BL` | `BL_001.png` |
| Jackpot tiers | `JP1`–`JP4` | `JP1_001.png`, `JP3_001.png` |
| Replacement | `R1`+ | `R1_001.png` |
| Scatter-Wild hybrid | `SW` | `SW_001.png` |
| Money bag scatter | `BAG`, `BAG_BO` | `BAG_001.png`, `BAG_BO_001.png` |
| Money emoji trigger | `MOJ` | `MOJ_001.png` |
| Loot Link Collector | `COL` | `COL_001.png` |
| Loot Link Activator | `ACT` | `ACT_001.png` |
| Hotspot multiplier | `HOT_x<N>` | `HOT_x2_001.png`, `HOT_x10_001.png` |
| Hotspot operators | `HOT_ADD`, `HOT_COMB`, `HOT_COLLAPSE`, `HOT_PERSIST` | `HOT_ADD_001.png` |
| Double / Triple symbols (pay-multiplier overlay) | `D2_<base>`, `D3_<base>` | `D2_HP1_001.png`, `D3_HP1_001.png` |
| Split symbol | `SPLIT_<base>` | `SPLIT_HP1_001.png` |
| Non-wild multiplier | `MULT_x<N>` | `MULT_x10_001.png` |
| Pachinko ball | `BALL` (or tier-named: `BALL_gold`) | `BALL_001.png`, `BALL_gold_001.png` |
| Pachinko peg | `PEG` | `PEG_001.png` |
| Pachinko bucket | `BUCKET_x<N>` | `BUCKET_x100_001.png`, `BUCKET_x1000_001.png` |
| Background — base | `BG_base` | `BG_base_001.png` |
| Background — free spins | `BG_freespins` | `BG_freespins_001.png` |
| Background — bonus | `BG_bonus` | `BG_bonus_001.png` |
| Background — pick-me | `BG_pickme` | `BG_pickme_001.png` |
| Background — wheel | `BG_wheel` | `BG_wheel_001.png` |
| Reel frame / bezel | `Bezel` | `Bezel_001.png` |
| HUD chrome | `HUD` | `HUD_001.png` |
| Paytable | `Paytable` | `Paytable_001.png` |
| Win banner — small | `Banner_small` | `Banner_small_001.png` |
| Win banner — medium | `Banner_medium` | `Banner_medium_001.png` |
| Win banner — big | `Banner_big` | `Banner_big_001.png` |
| Win banner — mega | `Banner_mega` | `Banner_mega_001.png` |
| Win banner — epic | `Banner_epic` | `Banner_epic_001.png` |
| Multiplier badges | `Multiplier_xN` | `Multiplier_x2_001.png`, `Multiplier_x10_001.png` |
| Logo — hero | `Logo_hero` | `Logo_hero_001.png` |
| Logo — standard | `Logo_standard` | `Logo_standard_001.png` |
| Logo — compact | `Logo_compact` | `Logo_compact_001.png` |
| Lobby tile | `Tile` | `Tile_001.png` |
| QA report | `QA` | `QA_001.md` |
| Upscaled / final | `{OriginalLabel}_4K` | `HP1_001_4K.png` |
| Smart-resized variant | `{OriginalLabel}_resized` | `BG_base_001_resized.png` |

---

## How to compute the next filename

Pseudocode every skill uses:

```
function nextFilename(projectRoot, label, ext = "png"):
    pattern = `{label}_*.{ext}`
    existing = glob(projectRoot, pattern)
    
    if existing is empty:
        return `{label}_001.{ext}`
    
    highest = max number across all matched files
    next = highest + 1
    
    return `{label}_{next:03d}.{ext}`
```

Examples:
- Folder is empty → `Key_001.png`
- Folder has `Key_001.png` and `Key_002.png` → next is `Key_003.png`
- Folder has `HP1_001.png`, `HP1_002.png`, `HP1_005.png` (gap) → next is `HP1_006.png`
  (we always go past the max, never fill gaps)

---

## What about iterations of the same conceptual asset?

When a user says "iterate on HP1 — make it darker," generate `HP1_002.png`
without touching `HP1_001.png`. The user reviews both and tells you which
to mark as approved.

The approved version is recorded in `project.json.assets.symbols.HP1` as
the **last entry** by convention, OR explicitly in a separate
`approved` field if the user picks a non-latest version. Example:

```json
"symbols": {
  "HP1": {
    "iterations": ["HP1_001.png", "HP1_002.png", "HP1_003.png"],
    "approved": "HP1_002.png"
  }
}
```

This means iteration 002 is the one downstream skills should reference,
even though 003 came later (e.g. user preferred 002 after seeing 003).

---

## What about full-set "approved" snapshots?

After all symbols are individually approved, the symbol-sheet skill
assembles them into a contact sheet → `Sheet_001.png`. If the set is
later refined (one symbol replaced), the new sheet is `Sheet_002.png`.
Old sheets stay on disk for historical reference.

---

## Anti-patterns (do not do these)

- ❌ `HP1_2K.png` — no resolution in the filename
- ❌ `HP1_v2.png` — use the counter, not "v2"
- ❌ `HP1_phoenix.png` — no subject in the filename (it's already in
  the brief and project.json)
- ❌ `HP1_final.png` — "final" gets stale; use the `approved` field in
  project.json
- ❌ `HP1.png` — no counter; how would you iterate?
- ❌ `2026-05-06_HP1.png` — no timestamps; project.json carries the
  timestamps
- ❌ Overwriting an existing file — always increment, even if you think
  the old one was bad
- ❌ Spelling out long names like `WILD.png`, `SCATTER.png`, `BONUS.png` —
  use the canonical short prefixes from `shared/symbol_vocabulary.md`
  (`WD1`, `SC`, `BO`)

---

## When does the suffix `_4K` apply?

When `slot-step-09` produces a 4K version of an existing 2K asset,
the upscaled file gets the suffix `_4K`. Example:
`HP1_002.png` → upscale → `HP1_002_4K.png`

The original 2K file stays. Both live side-by-side. The upscaled version
is referenced in `project.json.assets[...].upscaled` field.

---

## When does the suffix `_resized` apply?

When `slot-step-10` produces alternate aspect ratios for a
deliverable (e.g., a `9:16` portrait BG also needed at `1:1` for a
lobby tile preview), the resized output uses `_resized` plus a tag:

`BG_base_001.png` → smart-resize to 1:1 → `BG_base_001_resized_1x1.png`

If the user just wants one alternate size, the simpler form
`BG_base_001_resized.png` works. The MCP tool returns the actual
output paths regardless of naming choice.
