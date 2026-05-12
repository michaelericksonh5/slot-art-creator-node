---
name: slot-step-06
description: STEP 6 — Generate slot machine UI surfaces — reel frames/bezels, HUD chrome, paytable, win banners, bonus screens, multiplier badges, lobby tiles, logos, spin/bet buttons, and control panels. Reads the locked key art, symbol sheet, and background as references so chrome lives in the same world. UI must always rank below symbols in visual hierarchy. Run after /slot-step-05.
---

# Step 6 — UI Designer

UI chrome is infrastructure. It must reinforce the theme without stealing
attention from the symbols or the win moments. The reel is always the hero.
Every UI surface generated here is anchored to the locked key art, the
approved symbols, and the approved background.

## Startup protocol

1. Resolve active project
2. Load `project.json`, `game_brief.json`
3. Read references in priority order:
   - `style_anchor.key_art_path` (required)
   - Approved symbol sheet (if available)
   - Approved base background (if available)
4. If key art isn't locked, stop and tell user to run `/slot-step-02` first

## Workflow

### Step 1 — Pick the surface

Ask if not specified:

| Surface | Filename pattern |
|---|---|
| `bezel` (reel frame) | `Bezel_NNN.png` |
| `hud` (spin button + balance/bet) | `HUD_NNN.png` |
| `paytable` | `Paytable_NNN.png` |
| `banner_<tier>` (win banners by tier) | `Banner_small_NNN.png`, `Banner_big_NNN.png`, etc. |
| `bonus_screen` (free spins intro etc.) | `BonusScreen_NNN.png` |
| `multiplier_xN` | `Multiplier_x2_NNN.png`, `Multiplier_x10_NNN.png` |
| `lobby_tile` | `Tile_NNN.png` |
| `logo_<lockup>` | `Logo_hero_NNN.png`, `Logo_standard_NNN.png`, `Logo_compact_NNN.png` |

### Step 2 — Build the prompt (READ the right surface template)

This skill uses **progressive disclosure** — the per-surface prompt
formulas live in dedicated companion files. Read ONLY the file for the
surface you're generating. Don't read all of them.

| Surface being generated | Read this file FIRST |
|---|---|
| `bezel` (reel frame) | `BEZEL_TEMPLATE.md` |
| `hud` | `HUD_TEMPLATE.md` |
| `banner_<tier>` (any tier — small/big/mega/epic) | `BANNERS_TEMPLATE.md` |
| `bonus_screen` (free-spins / pick-me / wheel) | `BONUS_SCREEN_TEMPLATE.md` |
| `multiplier_xN` | `MULTIPLIER_TEMPLATE.md` |
| `lobby_tile` | `LOBBY_TILE_TEMPLATE.md` |
| `logo_<lockup>` (hero / standard / compact) | `LOGO_TEMPLATE.md` |
| `paytable` | `PAYTABLE_TEMPLATE.md` |

Each template file contains:
- Surface rules (palette, sizing, conventions)
- Prompt formula(s) with substitution markers
- Pre-gen quick checks specific to that surface
- Post-gen quick checks specific to that surface

If the user asks for "all UI surfaces" or "the full UI set," generate them
in this order so each can reference the prior approved chrome:

1. `bezel` — sets the metallic/palette baseline for chrome
2. `hud` — fits below the bezel
3. `banners` — escalation series (small → big → mega → epic)
4. `bonus_screen` variants — free-spins, pick-me, wheel
5. `multipliers` — denomination series
6. `paytable` — composes from approved symbols
7. `lobby_tile` — marketing surface (often last)
8. `logo` lockups — often a parallel track to gameplay UI

### Step 3 — Pre-generation validation (Gate 1)

**Universal:**
- [ ] `style_lock` in prompt verbatim
- [ ] No hex / resolution / aspect ratio strings in prompt body

**UI hierarchy:**
- [ ] Prompt does NOT instruct chrome to be the brightest/dominant element
- [ ] For bezel: "reel is the hero" stated
- [ ] For banners: numeral stated as focal point
- [ ] Palette drawn from brief but kept secondary to symbols

**Surface-specific:**
- [ ] Grid dimensions stated for bezel
- [ ] Touch target sizes stated for HUD/pick-me
- [ ] Tier count and tier differences stated for banners

### Step 4 — Generate

**Pick the right tool first.** UI chrome splits across two model families
— pick before composing the API args:

| Surface | Has visible required text? | Preferred tool (if `OPENAI_API_KEY` set) | Fallback (NB2-only) |
|---|---|---|---|
| `paytable` | yes (PAY TABLE header, pay values) | `gpt2_generate` | `nb2_generate` |
| `logo_<lockup>` | yes (the wordmark spelling matters) | `gpt2_generate` | `nb2_generate` |
| `banner_<tier>` if tier label baked in | usually no (composited at runtime) | `nb2_generate` (or `gpt2_edit` for runtime-baked labels) | `nb2_generate` |
| `bezel`, `hud`, `bonus_screen`, `multiplier_xN`, `lobby_tile` | no | `nb2_generate` | `nb2_generate` |

`gpt2_generate` accepts the same `output_dir` / `asset_name` shape as
`nb2_generate`. Keep `image_size: "2K"` for gpt2 even on hero lockups —
its 4K targets are experimental and unreliable for production; upscale
the approved 2K result with `nb2_upscale` if you need 4K marketing
output. See `shared/gpt_image2_prompting.md` for the full routing table.

**API args (NB2 path — most surfaces):**

| API arg | Value |
|---|---|
| `prompt` | composed prompt |
| `aspect_ratio` | match surface — bezel: game orientation, banner: portrait, tile: `1:1` or `4:3` |
| `image_size` | `"2K"` default |
| `output_dir` | `{project_root}` |
| `asset_name` | the surface label, e.g. `"Bezel"`, `"HUD"`, `"Banner_big"`, `"Logo_hero"` (the MCP server appends `_NNN.png` and auto-increments) |
| `references` | absolute paths — resolve `style_anchor.key_art_path`, `assets.sheet.approved`, and `assets.backgrounds.base.approved` against `project_root` first, then pass the resolved absolutes. Filter null/undefined entries. |

**API args (gpt2 path — paytable, logos, or anything text-heavy):**

| API arg | Value |
|---|---|
| `prompt` | composed prompt (gpt-image-2 reasons better when the structural intent — row count, label positions, wordmark spelling — is stated explicitly) |
| `aspect_ratio` | match surface |
| `image_size` | `"2K"` (the stable production ceiling) |
| `quality` | `"high"` for hero / marketing surfaces |
| `output_dir` | `{project_root}` |
| `asset_name` | same convention as NB2 |
| `extra_references` (gpt2_edit only) | absolute paths to approved symbol PNGs when composing them into a layout |

### Step 5 — Inline QA check (Gate 2)

**BLOCK** (auto-iterate):
- UI brighter/more dominant than symbols
- Bezel has opaque center (would cover reels)
- Banner numeral isn't the focal point
- Style doesn't match key art

**FLAG**:
- Chrome feels too busy
- Touch targets look small
- Palette slightly off from the symbol set

**PASS:** confirm and continue.

### Step 6 — Update state

For surfaces with a flat slot (`bezel`, `hud`, `paytable`, `bonus_screen`,
`lobby_tile`):
- Append output to `project.json.assets.ui.<surface>.iterations`
- If user approves, set `project.json.assets.ui.<surface>.approved`

For nested groups (`banners.<tier>`, `multipliers.<denom>`, `logos.<lockup>`):
- Append output to `project.json.assets.ui.banners.<tier>.iterations`
  (etc.)
- If user approves, set `.approved` on the nested record

Set `current_step: "ui_in_progress"`, `next_step: "/slot-step-06"`
(continue) or `"/slot-step-08"` (move to audit).

Schema for every UI slot follows the canonical asset record shape in
`shared/project_memory.md`.

### Step 7 — Next step nudge

```
✓ Step 6 — Bezel generated.
  File: Bezel_001.png
  Reel is the hero, frame transparent center ✓
  Folder: <project_root>
  Open:   file:///<project_root with / separators>

Next options:
  - Generate other UI surfaces (HUD, paytable, banners, logos) with /slot-06 again
  - Run `/slot-step-07` if reskinning an existing UI mock
  - Run `/slot-step-08` for full set audit

Type `/slot-` to see the full numbered workflow.
```

## Hard rules

- **Reel is always the hero.** Chrome ranks below symbols in brightness and weight.
- **No raw pixel counts** in prompts — semantic size terms only.
- **Win-banner tiers must differ in at least 2 dimensions.**
- **Three logo lockups** when generating a logo.

## References

- `shared/qa_preflight.md`, `shared/project_memory.md`, `shared/asset_naming.md`
- `shared/art_principles.md` §6 (typography), §7 (surfaces), §8 (contrast)
- `shared/nb2_prompting.md` §9.2 (formula), §9.6 (UI / edit ops)

### Per-surface templates (read on demand)

- `BEZEL_TEMPLATE.md` — reel frame / bezel + thickness vocabulary
- `HUD_TEMPLATE.md` — bottom HUD strip (spin button + balance/bet/win)
- `BANNERS_TEMPLATE.md` — win celebration overlays (BIG / MEGA / EPIC)
- `BONUS_SCREEN_TEMPLATE.md` — free-spins intro, pick-me, wheel
- `MULTIPLIER_TEMPLATE.md` — multiplier badges by denomination
- `LOBBY_TILE_TEMPLATE.md` — lobby thumbnail
- `LOGO_TEMPLATE.md` — game logo (hero / standard / compact lockups)
- `PAYTABLE_TEMPLATE.md` — paytable layout chrome
