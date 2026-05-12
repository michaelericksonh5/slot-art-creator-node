---
name: slot-step-03
description: STEP 3 — Generate individual reel symbols for any H5G symbol family — high-pay (HP), mid-pay (MP), low-pay (LP), wilds and wild variants (sticky / stacked / expanding / walking / respin / transforming / multiplier / duplicating / scatter-wild hybrid), classic scatter (SC), WYS family (WY, WY1–WY10+, WYS, WYS1+ — coins, portals, spherical feature-tokens with eight brief-driven roles including hold-and-spin coin, WYSIWYG collector, scatter, random-wilds shooter, collector+multiplier, adder, HP-equivalent payout, Loot Link trigger), bonus trigger (BO), Loot Link / Hotspot family (COL, ACT, HOT_x*, HOT_ADD, HOT_COMB, HOT_COLLAPSE, HOT_PERSIST, BAG, BAG_BO, MOJ), SF family (SF, SF1–SF11+ — special-feature tokens with fourteen brief-driven roles including mystery transform, hotspot multiplier/adder/combiner/collapse/persist, four collector variants, path-formers, lock-and-respin, jackpot coin, bonus trigger), blocker / dead (BL, BL1, BL2+), jackpot tiers (JP1–JP6, with per-game numeric ordering read from brief.jackpot_tier_names), pay-multiplier variants (D2_, D3_, SPLIT_, MULT_, DHP), pachinko / Drop Zone pieces (BALL, PEG, BUCKET_x*), and compound prefixes (BWY, WJP, WDWY, WDSF, MUWD, MUWDBO, SFWY) that combine two roles into one symbol. Each symbol reads the locked key art as a style anchor, validates the prompt against the visual hierarchy before generating, does an inline QA check immediately after, and auto-iterates on blocking issues. Run after /slot-step-02 is locked. Use this skill whenever the user asks to generate, regenerate, or refine any individual reel symbol or a full symbol set — even when they just name the family or mechanic (e.g. "make the coin scatter", "redo the loot link collector", "generate the jackpot tiers", "regenerate BWY1") without explicitly saying "symbol". Forward-compatible: if a GDD introduces a prefix that isn't in the documented list, the skill routes by visual identity from the brief's subject and surfaces the new prefix as a vocabulary-extension request.
---

# Step 3 — Symbol Designer

Each symbol is one step in a value gradient. The full set must read as a
coherent hierarchy at a glance — warmest/richest at the top, coolest/simplest
at the bottom. This skill builds that gradient deliberately, one symbol at a
time, anchored to the locked key art.

## Startup protocol

Follow the standard protocol from `shared/project_memory.md` →
"Skill startup protocol", including the "no active project — guide
through setup" pattern. Symbol generation has a two-link prerequisite
chain: a locked brief AND a locked key art.

1. Resolve active project from `~/.h5g-slot-active-project.json` or
   GameID arg. **If no active project**, route to `/slot-step-01`
   → `/slot-step-02` → resume symbol generation in the same
   conversation. Don't ask the user to re-invoke `/slot-step-03`
   after setup.
2. Load `project.json` and `game_brief.json`. **If the brief isn't
   locked yet** (`project.json.brief` missing or incomplete), route
   to `/slot-step-01` first, then continue here.
3. **Read the locked key art image** —
   `project.json.style_anchor.key_art_path`. This image is the visual
   ground truth for every symbol. **If it's not set**, route to
   `/slot-step-02` to generate and lock it, then return here to
   generate the symbol the user originally asked for.
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
system (HP, MP, LP, WD, SC, SW, WY/WYS, BO, BAG, MOJ, SF, BL, JP,
COL, ACT, HOT_*, D2_/D3_/SPLIT_/MULT_, DHP, BALL/PEG/BUCKET, R, and
the compound prefixes BWY/WJP/WDWY/WDSF/MUWD/MUWDBO/SFWY) along with
the routing-by-role principle.

#### Route by family (and by mechanic when prefix is ambiguous)

H5G GDDs across the catalog of 26 shipped games use the same prefix
for **multiple mechanics** (e.g. `WY1` is a hold-and-spin coin in
some games, a WYSIWYG collector in others, a scatter in others).
The routing here picks a **family template** (visual identity), and
the brief's `mechanic` field on each symbol selects which role
overlay to apply from inside that template. The full principle is
documented in `shared/symbol_vocabulary.md` → "Routing by manifest
role, not literal prefix".

| Prefix being generated | Family | Read this file FIRST |
|---|---|---|
| `HP1`–`HP4` | High-pay | `HP_TEMPLATE.md` |
| `MP1`–`MP3` | Mid-pay | `MP_TEMPLATE.md` |
| `LP1`–`LP6` | Low-pay | `LP_TEMPLATE.md` |
| `WD` (basic) | Wild | `WILD_TEMPLATE.md` |
| `WD2`+ / variant wild | Wild variants (sticky / stacked / expanding / walking / respin / transforming / multiplier / duplicating) | `WILD_VARIANTS_TEMPLATE.md` |
| `SW` | Scatter-Wild hybrid (Book of Dead style) | `WILD_VARIANTS_TEMPLATE.md` (Scatter-Wild section) |
| `SC` (legacy prefix) | Scatter | `SCATTER_TEMPLATE.md` |
| `WY`, `WY1`–`WY10+`, `WYS`, `WYS1`+ | **WYS family** — coin / portal / spherical feature-tokens. Eight brief-driven roles: coin · WYSIWYG collector · **scatter (newer games)** · random-wilds shooter · collector+multiplier · adder · HP-equivalent payout · Loot Link trigger | `COIN_TEMPLATE.md` (WYS Family Template) |
| `BO`, `BO1`+ | Bonus trigger | `BONUS_TRIGGER_TEMPLATE.md` |
| `BAG`, `BAG_BO` | Money bag scatter / Bonus bag | `LOOTLINK_TEMPLATE.md` (Bag section) |
| `MOJ` | Money emoji trigger | `LOOTLINK_TEMPLATE.md` (Money emoji section) |
| `COL` | Loot Link Collector | `LOOTLINK_TEMPLATE.md` (Collector section) |
| `ACT` | Loot Link Activator | `LOOTLINK_TEMPLATE.md` (Activator section) |
| `HOT_x*` / `HOT_ADD` / `HOT_COMB` / `HOT_COLLAPSE` / `HOT_PERSIST` | Loot Link / Hotspot operators | `LOOTLINK_TEMPLATE.md` |
| `SF`, `SF1`–`SF11+` | **SF family** — special-feature symbols (coin / portal / spherical / closed-object). Fourteen brief-driven roles: mystery transform · hotspot multiplier · hotspot adder · hotspot combiner · hotspot collapse · persistent hotspot · upgradable collector · immediate-payout collector · bonus value collector · transforming collector · path-forming prize · lock-and-respin trigger · jackpot coin · bonus-game trigger | `MYSTERY_TEMPLATE.md` (SF Family Template) |
| `BL`, `BL1`, `BL2`+ | Blocker / Dead / Obstacle (numbered variants for mode-specific or damage-tier patterns) | `BLOCKER_TEMPLATE.md` |
| `JP1`–`JP6` | Jackpot tiers (4-tier OR 6-tier). **Numeric ordering varies per game** — always read `brief.jackpot_tier_names` | `JACKPOT_TEMPLATE.md` |
| `R1`+ | Replacement (clarify mechanic first) | confirm with user, then route by visual treatment |
| `D2_<base>` / `D3_<base>` / `SPLIT_<base>` | Double / Triple / Split (pay-multiplier overlays) | `SPECIAL_MECHANICS_TEMPLATE.md` |
| `DHP1`+ | Double HP (H5G alias for `D2_HP1`) | `SPECIAL_MECHANICS_TEMPLATE.md` |
| `MULT_x*` | Non-wild multiplier | `SPECIAL_MECHANICS_TEMPLATE.md` |
| `BALL` / `PEG` / `BUCKET_x*` | Pachinko-style game pieces | `PACHINKO_TEMPLATE.md` |

#### Compound prefixes — first-class symbols with combined roles

Compound prefixes combine two role/family signals in one symbol ID.
They follow the same `<PREFIX>_NNN.png` naming as primitives
(`BWY_001.png`, `WJP_001.png`, etc.) and route to a **dominant base
template + secondary overlay**.

| Compound prefix | Base template (dominant) | Secondary overlay from |
|---|---|---|
| `BWY`, `BWY1`+ | `COIN_TEMPLATE.md` (WYS family) | bonus-trigger cues from `BONUS_TRIGGER_TEMPLATE.md` |
| `WJP`, `WJP1`+ | `WILD_VARIANTS_TEMPLATE.md` | jackpot-contribution overlay from `JACKPOT_TEMPLATE.md` |
| `WDWY`, `WDWY1`+ | `WILD_VARIANTS_TEMPLATE.md` (scatter-wild hybrid section) | WYS coin/portal silhouette from `COIN_TEMPLATE.md` |
| `WDSF`, `WDSF1`+ | `WILD_VARIANTS_TEMPLATE.md` | SF sphere silhouette from `MYSTERY_TEMPLATE.md` |
| `MUWD`, `MUWD1`+ | `WILD_VARIANTS_TEMPLATE.md` (multiplier-wild section) | — (alias) |
| `MUWDBO`, `MUWDBO1`+ | `WILD_VARIANTS_TEMPLATE.md` (multiplier-wild section) | bonus burst from `BONUS_TRIGGER_TEMPLATE.md` |
| `SFWY`, `SFWY1`+ | `MYSTERY_TEMPLATE.md` (SF family) | WYS coin/portal cues from `COIN_TEMPLATE.md` |

#### Unknown prefix — fallback for future H5G symbols

If a brief uses a prefix not in either table above (a new H5G symbol
type that hasn't made it into the docs yet), match by **visual
identity from the brief's `subject` text** to the closest existing
family, route there, and surface the unknown prefix to the user in
the Step 7 next-step nudge so the vocabulary can be extended. See
`shared/symbol_vocabulary.md` → "Unknown / future prefix fallback".

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
| Jackpot | "fills entire cell, edge to edge" — and **read `brief.jackpot_tier_names`** to know which tier each `JP<N>` represents in this specific game; the catalog of 26 shipped H5G games shows 9 of 11 modern numeric-jackpot games use `JP1 = Grand`, not `JP1 = Mini` |
| Wild | "barely contained fills frame edge to edge, large and dominant" |
| Scatter | "prominent, circular badge-shaped, fills cell" |
| WYS family (`WY` / `WYS`) | "fills the cell, prominent, slightly larger than the LP/MP symbols" — coin / portal / spherical silhouette; role overlay cues come from the brief's `mechanic` field |
| SF family (`SF`) | "prominent, fills the cell, more visually weighted than MP/LP" — spherical token or closed-object silhouette; role overlay from the brief's `mechanic` field |
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
| `output_dir` | `path.join(project_root, "Symbol_Art")` — every reel symbol (HP, MP, LP, WD, SC, WY, BO, SF, BL, JP, COL, ACT, HOT_*, BAG, MOJ, D2_, D3_, SPLIT_, MULT_, BALL, PEG, BUCKET, …) lives in this single folder. Folder is created on first write. |
| `asset_name` | the symbol prefix from the manifest, e.g. `"HP1"`, `"WD1"`, `"WY2"`. The MCP server appends `_NNN.png` and auto-increments by scanning `Symbol_Art/` for existing files with that prefix. |
| `references` | absolute paths — resolve `style_anchor.key_art_path` against `project_root` first (e.g. `path.join(project_root, "Key_Art/Key_Art_003.png")`). Plus any prior approved symbols of adjacent tiers, resolved the same way (`path.join(project_root, "Symbol_Art/HP1_002.png")`). **Bare filenames will fail with ENOENT inside the MCP tool's `uploadLocalFile`.** |

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
- Append the relative path (`"Symbol_Art/HP1_NNN.png"`) to
  `project.json.assets.symbols.<SymbolID>.iterations`
- If user marked it approved, set `project.json.assets.symbols.<SymbolID>.approved`
  to that same relative path
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
  File   : Symbol_Art/HP1_001.png
  Folder : <project_root>/Symbol_Art/
  Open   : file:///<project_root>/Symbol_Art/
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

- `shared/symbol_vocabulary.md` — the master prefix-and-family reference. Read this when a brief uses an unfamiliar prefix, a compound prefix, or when the `mechanic` field of a `WY`/`SF` symbol is ambiguous.
- `shared/qa_preflight.md` (pre/post generation protocol)
- `shared/project_memory.md` (state schema)
- `shared/asset_naming.md` (per-symbol counter + compound-prefix label table)
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
