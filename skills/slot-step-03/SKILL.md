---
name: slot-step-03
description: STEP 3 — Generate individual reel symbols for any H5G symbol family — high-pay (HP), mid-pay (MP), low-pay (LP), wilds and wild variants (sticky / stacked / expanding / walking / respin / transforming / multiplier / duplicating / scatter-wild hybrid), classic scatter (SC), coin / hold-and-spin (WY), bonus trigger (BO), Loot Link / Hotspot family (COL, ACT, HOT_x*, HOT_ADD, HOT_COMB, HOT_COLLAPSE, HOT_PERSIST, BAG, BAG_BO, MOJ), mystery / special feature (SF), blocker / dead (BL), jackpot tiers (JP1–JP6), pay-multiplier variants (D2_, D3_, SPLIT_, MULT_), and pachinko / Drop Zone pieces (BALL, PEG, BUCKET_x*). Each symbol reads the locked key art as a style anchor, validates the prompt against the visual hierarchy before generating, does an inline QA check immediately after, and auto-iterates on blocking issues. Run after /slot-step-02 is locked. Use this skill whenever the user asks to generate, regenerate, or refine any individual reel symbol or a full symbol set — even when they just name the family or mechanic (e.g. "make the coin scatter", "redo the loot link collector", "generate the jackpot tiers") without explicitly saying "symbol".
---

# Step 3 — Symbol Designer

Each symbol is one step in a value gradient. The full set must read as a
coherent hierarchy at a glance — warmest/richest at the top, coolest/simplest
at the bottom. This skill builds that gradient deliberately, one symbol at a
time, anchored to the locked key art.

## Startup protocol

1. Resolve active project from `~/.h5g-slot-active-project.json` or arg
2. Load `project.json` and `game_brief.json`
3. **Read the locked key art image** — `project.json.style_anchor.key_art_path`.
   This image is the visual ground truth for every symbol. If it's not set,
   stop and tell the user to run `/slot-step-02` first.
4. **Read the latest symbol sheet if present** —
   `project.json.assets.sheet[last]`. If `/slot-step-04` ran in
   ideation mode and proposed a set, that sheet is the strongest reference
   you have for what each individual symbol should look like. Pass it to
   NB2 as a reference for every symbol generation.
5. If prior individual symbols already exist, read one HP image and one LP
   image to anchor the high and low water marks of the current set.

## Workflow

### Step 1 — Identify the symbol

Either user-specified ID, or take the next un-generated entry from
`game_brief.json.symbol_manifest`. Use the manifest's `subject` field
verbatim — never the internal ID as a subject.

### Step 2 — Build the prompt (READ the right tier template)

This skill uses **progressive disclosure** — the per-tier prompt formulas
live in dedicated companion files. Read ONLY the file(s) for the symbol
type you're generating. Don't read all of them.

If you're not sure what prefix the brief is using, read
`shared/symbol_vocabulary.md` first — it documents the full H5G prefix
system (HP / MP / LP / WD / SC / WY / BO / SF / BL / JP / R).

| Prefix being generated | Symbol type | Read this file FIRST |
|---|---|---|
| `HP1`–`HP4` | High-pay (character / iconic object) | `HP_TEMPLATE.md` |
| `MP1`–`MP3` | Mid-pay (themed object) | `MP_TEMPLATE.md` |
| `LP1`–`LP6` | Low-pay (cards / suits / gems / themed) | `LP_TEMPLATE.md` |
| `WD` (basic) | Standard wild | `WILD_TEMPLATE.md` |
| `WD2`+ / variant wild | Sticky / Stacked / Expanding / Walking / Respin / Transforming / Multiplier / Duplicating | `WILD_VARIANTS_TEMPLATE.md` |
| `SW` | Scatter-Wild hybrid (Book of Dead style) | `WILD_VARIANTS_TEMPLATE.md` (Scatter-Wild section) |
| `SC` | Classic scatter | `SCATTER_TEMPLATE.md` |
| `WY1`–`WY4` | Coin / Hold-and-Spin family | `COIN_TEMPLATE.md` |
| `BO` | Bonus trigger (non-scatter) | `BONUS_TRIGGER_TEMPLATE.md` |
| `BAG`, `BAG_BO` | Money bag scatter / Bonus bag | `LOOTLINK_TEMPLATE.md` (Bag section) |
| `MOJ` | Money emoji trigger | `LOOTLINK_TEMPLATE.md` (Money emoji section) |
| `COL` | Collector | `LOOTLINK_TEMPLATE.md` (Collector section) |
| `ACT` | Activator | `LOOTLINK_TEMPLATE.md` (Activator section) |
| `HOT_x*` / `HOT_ADD` / `HOT_COMB` / `HOT_COLLAPSE` / `HOT_PERSIST` | Loot Link / Hotspot operators | `LOOTLINK_TEMPLATE.md` |
| `SF` | Mystery / Special Feature | `MYSTERY_TEMPLATE.md` |
| `BL` | Blocker / Dead / Obstacle | `BLOCKER_TEMPLATE.md` |
| `JP1`–`JP6` | Jackpot tiers (4-tier or 6-tier) | `JACKPOT_TEMPLATE.md` |
| `R1`+ | Replacement (clarify mechanic first) | confirm with user, then route by visual treatment |
| `D2_<base>` / `D3_<base>` / `SPLIT_<base>` | Double / Triple / Split (pay-multiplier overlays) | `SPECIAL_MECHANICS_TEMPLATE.md` |
| `MULT_x*` | Non-wild multiplier | `SPECIAL_MECHANICS_TEMPLATE.md` |
| `BALL` / `PEG` / `BUCKET_x*` | Pachinko-style game pieces | `PACHINKO_TEMPLATE.md` |

Each template file contains:
- Tier rules (background color, palette, lighting)
- Prompt formula(s) with substitution markers
- Pre-gen quick checks specific to that tier
- Post-gen quick checks specific to that tier

The general §9.2 master formula in `shared/nb2_prompting.md` is the
underlying structure all templates follow:
```
[SUBJECT] + [TIER PHRASE] + [temperature-matched palette] + [style_lock]
+ [mobile constraints] + [quality tag block] + [semantic avoids]
```

**Tier phrase quick reference** (full versions in each template file):

| Symbol | Tier phrase |
|---|---|
| Jackpot | "fills entire cell, edge to edge" |
| Wild | "barely contained fills frame edge to edge, large and dominant" |
| Scatter | "prominent, circular badge-shaped, fills cell" |
| HP | "large and prominent, more valuable than all mid and low tier symbols" |
| MP | "generous size, visible padding, one tier below the high-pay characters" |
| LP | "small and understated, generous empty space" |

**If prior symbols exist in the set:** describe the relationship in the prompt.
"One tier below the phoenix HP1 already generated, noticeably cooler and
less saturated than the HP characters."

### Step 3 — Pre-generation validation (Gate 1)

Run the symbol-specific checks from `shared/qa_preflight.md`. Key fast-checks:

- [ ] `style_lock` in prompt verbatim
- [ ] No hex / percentages / codenames / resolution / aspect ratio in prompt body
- [ ] LP prompt: zero instances of `gold`, `amber`, `warm`, `detailed`, `ornate`, `rich`, `glowing`
- [ ] Background color matches the tier rule
- [ ] Wild subject is a different category than the rest of the set
- [ ] LP family is consistent with brief
- [ ] If second-or-later symbol: this one is clearly cooler/less saturated than tiers above

Do not generate until clean.

### Step 4 — Generate

Call `mcp__nb2node__nb2_generate`:

| API arg | Value |
|---|---|
| `prompt` | composed prompt (no resolution / aspect ratio strings) |
| `aspect_ratio` | `"1:1"` (always for symbols) |
| `image_size` | `"2K"` (default; project minimum) |
| `output_dir` | `{project_root}` (the active project folder) |
| `asset_name` | the symbol prefix from the manifest, e.g. `"HP1"`, `"WD1"`, `"WY2"`. The MCP server appends `_NNN.png` and auto-increments if a file already exists. |
| `references` | absolute paths — resolve `style_anchor.key_art_path` against `project_root` first (e.g. `path.join(project_root, "Key_003.png")`). Plus any prior approved symbols of adjacent tiers, also resolved. **Bare filenames like `"Key_003.png"` will fail with ENOENT inside the MCP tool's `uploadLocalFile`.** |

The reference images lock the style without re-specifying it in text.
Always pass at least the key art as a reference.

### Step 5 — Inline QA check (Gate 2)

Read the output image immediately:

**BLOCK** (fix and auto-regenerate, max 2 retries):
- Wrong background color for tier
- LP shows gold/amber/warm trim
- Wild uses same palette as the set
- Style clearly doesn't match `style_lock` or the key art
- Silhouette unrecognizable

**FLAG** (surface and ask):
- Tier hierarchy is very close to the symbol above
- Light direction differs from prior symbols
- Style is close but slightly off

**PASS:** confirm and offer to continue to the next symbol.

### Step 6 — Update state

After every generation:
- Append output filename to `project.json.assets.symbols.<SymbolID>.iterations`
- If user marked it approved, set `project.json.assets.symbols.<SymbolID>.approved`
- Set `current_step: "symbols_in_progress"` (or `"sheet_locked"` if you're
  done with all manifest entries — check the manifest)
- Set `next_step: "/slot-step-03"` (continue) or
  `"/slot-step-04"` (assemble) depending on remaining work
- Update `updated_at`
- Atomic-write `project.json`

Schema for each symbol slot follows the canonical asset record shape in
`shared/project_memory.md`: `{iterations, approved, upscaled, resized}`.

### Step 7 — Next step nudge

```
✓ HP1 [subject] — generated and inline-checked.
  File   : HP1_001.png
  Folder : <project_root>  (e.g. H:\Shared drives\...\Asset_Creation_Suite\{GameID}_{username})
  Open   : file:///<project_root with / separators>
  Tier   : warmest, dominant ✓
  BG     : flat black ✓
  Style  : matches key art ✓

Continue with HP2? Or run `/slot-step-04` once all symbols are done
to assemble the contact sheet.

Type `/slot-` to see the full numbered workflow.
```

## Generating a full set in one session

When the user asks for "all symbols":

1. Show the manifest. Confirm order: specials → HP → MP → LP, or HP → MP → LP → specials.
2. Generate in order so each symbol can reference tiers above it.
3. Every 3–4 symbols, do a quick cross-symbol check by reading two prior
   images side-by-side and confirming the gradient still reads correctly.
4. After the full set, suggest `/slot-step-04` to assemble the
   contact sheet for review.

## Hard rules

- **Never** use internal codenames, project numbers, or car names as subjects
- **Never** put `gold`, `amber`, `warm`, or `detailed` in an LP prompt
- **Never** mix LP families within one set
- **Wild must break the theme** in both category and color
- **Auto-iterate on BLOCKs** — don't present a broken image and ask what to do
- **Always pass key art as a reference** to lock style continuity

## References

- `shared/qa_preflight.md` (pre/post generation protocol)
- `shared/project_memory.md` (state schema)
- `shared/asset_naming.md` (per-symbol counter)
- `shared/nb2_prompting.md` §9.2 (master formula), §9.5 (export BG), §9.7 (anti-patterns)
- `shared/art_principles.md` §3 (symbols), §3.5 (cell-fill table)
- `shared/chat_image_staging.md` — required when the user pastes/attaches
  a reference image in chat (e.g. "use this image as a style reference
  for HP1"). Chat-attached paths are outside the allowed-roots envelope
  and would otherwise be rejected by `nb2_generate` / `nb2_edit`. Stage
  with `nb2_stage_image` first, then pass the staged path in `references`
  or `source`.

### Tier-specific templates (read on demand)

- `HP_TEMPLATE.md` — high-pay characters and iconic objects
- `MP_TEMPLATE.md` — mid-pay themed objects
- `LP_TEMPLATE.md` — low-pay (card royals, suits, themed objects, gems)
- `WILD_TEMPLATE.md` — standard wild + how to break the theme
- `WILD_VARIANTS_TEMPLATE.md` — sticky / stacked / expanding / walking / respin / transforming / multiplier / duplicating / scatter-wild hybrid
- `SCATTER_TEMPLATE.md` — classic scatter / `SC`
- `COIN_TEMPLATE.md` — `WY` coin and hold-and-spin family (gold / red / green / blue variants)
- `BONUS_TRIGGER_TEMPLATE.md` — `BO` bonus-game launcher (distinct from scatter)
- `LOOTLINK_TEMPLATE.md` — Loot Link / Hotspot family (collector, activator, hotspot operators, bag scatters, money emoji)
- `MYSTERY_TEMPLATE.md` — `SF` mystery / transform symbols
- `BLOCKER_TEMPLATE.md` — `BL` blocker / dead / obstacle symbols
- `JACKPOT_TEMPLATE.md` — `JP1`–`JP6` metallic medallions (4-tier or 6-tier)
- `PACHINKO_TEMPLATE.md` — Drop Zone family (`BALL`, `PEG`, `BUCKET_x*`)
- `SPECIAL_MECHANICS_TEMPLATE.md` — split / double / triple / non-wild multiplier / persistent / Megaways / cluster / cascade

### Master vocabulary

- `shared/symbol_vocabulary.md` — the full H5G prefix system (every
  symbol prefix and what it means). Read this when the brief uses a
  prefix you don't recognize.
