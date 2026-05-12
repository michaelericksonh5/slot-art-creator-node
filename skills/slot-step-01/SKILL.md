---
name: slot-step-01
description: STEP 1 — Lock the game brief (theme, palette, style, tier plan, symbol manifest) into project.json. This is the foundation every later skill reads. Run after /slot-step-00 (if you have a GDD) or as the first step if pitching a fresh concept. Always run before /slot-step-02.
---

# Step 1 — Game Brief

This is the foundation of every project. The brief locks theme, palette,
style, tier structure, and the full symbol manifest. Every other skill
(02 through 10) reads it as the source of truth — so getting it right
here is cheap, and getting it wrong here is expensive.

## Startup protocol

Follow the standard startup from `shared/project_memory.md`:

1. **Resolve project.** Did the user pass a GameID arg? Use it. Otherwise
   read `~/.h5g-slot-active-project.json`. If neither exists, ask the user
   for a GameID and create the project folder.
2. **Construct project root.** Resolve via the 3-tier logic in
   `shared/project_memory.md` (`SLOT_ART_PROJECT_BASE` env var → H5G Drive
   Stream → `~/slot-art-projects/`). Append `{GameID}_{username}` where
   `username` is the runtime OS username — never hardcode it.
3. **Load existing state.** If `project.json` exists, this is an iteration —
   show the user what's locked and ask what to change. If not, create from
   scratch (or seeded from `/slot-step-00` output).

## Workflow

### Step 1 — Determine inputs

Either the user has a GDD (run `/slot-step-00` first if so), or they
have a pitch. Ask once for whichever is missing.

### Step 2 — Lock the brief fields

Required fields (full schema in `GAME_BRIEF_TEMPLATE.md`):

- `game_name` — user-facing theme name, NEVER the internal codename
- `mood` — 1–2 words
- `theme_summary` — ≤ 2 sentences
- `style_lock` — exactly one phrase from `shared/nb2_prompting.md` §9.4
- `palette_leads` — `primary`, `accents`, `forbidden_on_lp` (named colors only, no hex)
- `grid` — e.g. `"5x4"`
- `tier_plan` — canonical: 3 specials + 2 HP + 2 MP + 5–6 LP. One LP family.
- `wild` — what it IS, how it BREAKS the theme
- `scatter` — label and shape
- `symbol_manifest` — `{id, tier, subject, role}` for every symbol
- `mode_list` — `["base", "free spins", "bonus pick-me", ...]`
- `rtp` — informational only

### Step 3 — Build the Style Anchor

Construct a single ~60–90-word block of game-wide discipline that will
be prepended verbatim to every future NB2 prompt (see
`shared/nb2_prompting.md` §9.2.1). Fill the template with this brief's
values:

```
You are generating art assets for a mobile slot machine game ("<game_name>"
— <theme_summary>). Every output must be optimized for small phone
screens — every element must be recognizable by silhouette alone when
small on a phone. Use bold, clean shapes — no intricate micro-textures,
no dense filigree that collapses at thumbnail size. High contrast between
foreground and the flat background. Warm saturated colors signal high
pay; cool muted colors signal low pay. Gold is reserved for premium and
special symbols only. Maintain a consistent <style_lock> rendering
technique across the entire set.
```

Save the filled-in string as:
- **`project.json.style_anchor`** — top-level key, NOT nested under `brief`.
  Every downstream skill (03, 05, 06, 07, 09) reads this exact path.
- **`game_brief.json.style_anchor`** — human-readable mirror only.

This distinction matters: `project.json.brief` is the brief fields object;
`project.json.style_anchor` is the prompt-ready string that lives alongside
it at the root level.

### Step 4 — Confirm with user

Show the brief AND the style anchor, ask for sign-off. Get explicit
"lock it" before writing.

### Step 5 — Persist

Atomic-write to BOTH:
- `{project_root}/game_brief.json` — human-readable mirror (all brief fields + style_anchor)
- `{project_root}/project.json`:
  - `brief` object — all brief fields (game_name, theme_summary, etc.)
  - `style_anchor` — top-level string (the 60–90-word anchor block from Step 3)

Update `project.json`:
- `current_step: "brief_locked"`
- `next_step: "/slot-step-02"`
- `updated_at: <ISO timestamp>`

Update `~/.h5g-slot-active-project.json` to point here.

### Step 6 — Next step nudge

```
✓ Step 1 — Game Brief locked.
  Game        : Phoenix of Ardashir
  Mood        : mystical regal
  Style lock  : stylized semi-realistic slot game art
  Palette     : deep midnight indigo with antique gold and burning crimson
  Symbols     : 13 (3 special, 2 HP, 2 MP, 6 LP card royals)
  Saved to    : H:\...\4470_merickson\game_brief.json
  Folder: <project_root>
  Open:   file:///<project_root with / separators>

Next: run `/slot-step-02` to generate the master key art.
The approved key art becomes the visual style anchor for every later asset.

Type `/slot-` to see the full numbered workflow.
```

## Hard rules

- **Never** put internal GDD codenames anywhere creative-facing
- **Never** describe palette in hex — named colors only
- **Never** mix LP families
- **Style lock must be exactly one phrase**, not a list
- If the GDD is silent on a field, mark it `null` and surface it as an open question

## References

- `shared/project_memory.md` (state schema, startup protocol)
- `shared/asset_naming.md` (file conventions)
- `shared/nb2_prompting.md` §9.4 (style library), §9.8 (brief fields)
- `shared/art_principles.md` §3 (tiers), §4 (palette construction)
- `GAME_BRIEF_TEMPLATE.md` (full schema and example)
