---
name: slot-step-08
description: STEP 8 — Final production audit for a complete deliverable. Reviews the full symbol set, background suite, or UI collection as a unified whole. Each generation skill does inline checks per asset; this skill does cross-asset consistency review and produces a structured RED/YELLOW/GREEN sign-off report for handoff. Run when a set is done.
---

# Step 8 — Final Production Audit

Each generation skill (slot-03 through slot-07) runs pre-generation
validation and inline post-generation checks. Those gates catch blocking
issues per asset before moving on. This skill is for what those inline
checks cannot see: the full set read as a unified whole.

Run this at:
- End of a full symbol set
- End of a background suite
- Before client/stakeholder handoff
- After NB2 edit/upscale (slot-09) or smart-resize (slot-10), to confirm
  the change didn't break anything

## Startup protocol

1. Resolve active project
2. Load `project.json`, `game_brief.json`
3. Read all references:
   - `style_anchor.key_art_path` (the original locked anchor)
   - GDD source images from Drive if `gdd_source.file_id` is set and the
     brief's color direction feels uncertain
4. List all approved assets in scope

## Workflow

### Step 1 — Identify deliverable scope

Ask user:
- **Symbol set** — all approved per-symbol PNGs + the contact sheet
- **Background suite** — all variants
- **UI collection** — all UI surfaces
- **Full cross-asset review** — symbols + background + UI together
- **Final sign-off** — everything in the project, with a written report

### Step 2 — Read all assets in scope

Use the Read tool to visually inspect every image. Do not summarize from
filename — actually look at each one.

For symbol sets, read in tier order: Jackpot → Wild → Scatter → HP1 → HP2 →
MP1 → MP2 → LP1 → ... → LP6.

### Step 3 — Grade

#### Symbol set checks

**Tier gradient (the primary set-level test):**
Cover the labels and ask "which is higher value?" — the answer must be
obvious. Grade each transition:
- HP1 → HP2: HP2 perceptibly less saturated/warm
- HP2 → MP1: MP1 noticeably cooler, less glow, smaller
- MP → LP: LP clearly simplest, coolest, least ornamented
- Wild: clearly breaks category and palette
- Scatter: circular badge, identifiable as trigger

**LP discipline:**
- Zero gold/amber/warm trim on any LP
- LP family consistent (all card royals, or all gems, etc. — never mixed)

**Export background:**
- HP/Wild/Scatter/Jackpot: flat solid black
- LP: flat solid white
- No gradients or patterns

**Style consistency:**
- All symbols share `style_lock` — could belong to the same game
- Light direction consistent (upper-left ~10 o'clock)

**Readability:**
- Every symbol has clear silhouette at thumbnail size
- Edge contrast adequate

#### Background suite checks
- Bottom 30% dark on all variants
- Reel zone dimmed on all variants
- Three-layer depth on all variants
- Free-spins variant perceptibly more saturated/warm than base
- Bonus variant has noticeably more drama
- Background palette recedes behind symbol palette

#### UI collection checks
- Chrome ranks below symbols in brightness and visual weight
- Bezel has transparent/open center
- Banner tiers distinguishable (differ in size, palette, frame complexity)
- Touch targets visually generous
- Logo readable at thumbnail

#### Cross-asset checks
- Symbols, background, UI feel like one cohesive world
- No surface competes with another at wrong hierarchy level
  (BG never brighter than symbols; UI never busier than symbols)
- Palette family consistent across all assets

### Step 4 — Auto-RED escalations

Always RED regardless of other grades:
- Any LP shows gold/amber/warm trim
- HP uses same warmth/saturation as an LP
- Export background has gradient or pattern instead of flat solid
- Wild uses same primary palette as the rest of the set
- Any symbol unrecognizable at 64px thumbnail
- Style varies between two symbols in the same set
- LP family is mixed within one set

### Step 5 — Write the report

Save to `{project_root}/{nextFilename("QA", "md")}` — e.g. `QA_001.md`:

```markdown
# QA Audit — {game_name}

Date: {ISO date}
Project: {GameID}_{username}
Scope: {what was reviewed}
Overall: RED | YELLOW | GREEN

---

## RED — Blocks handoff
- [specific finding with asset name]

## YELLOW — Needs review before handoff
- [specific finding with asset name]

## GREEN — Confirmed
- [specific finding with asset name]

## Required human visual checks
- [items requiring a person to look at the file on screen]

## Recommended next action
[One sentence]
```

**Overall grade logic:**
- Any RED → overall RED
- No RED, any YELLOW → overall YELLOW
- All GREEN → overall GREEN

### Step 6 — Update state

- Append the QA report path to `project.json.assets.qa_reports`
- Set `current_step: "audit_complete"`
- Set `next_step` based on overall grade:
  - GREEN → `/slot-step-09`
  - YELLOW or RED → the specific design skill that owns the failing assets
    (e.g. `/slot-step-03` if LP gold contamination, `/slot-step-05` if BG too bright)
- Record the grade in the report itself, not in `current_step`

See `shared/project_memory.md` → "current_step and next_step vocabulary"
for the full canonical list.

### Step 7 — Next step nudge

```
✓ Step 8 — Production Audit: GREEN
  Report: QA_002.md
  All 13 symbols, 3 BG variants, 5 UI surfaces passed.
  Folder: <project_root>
  Open:   file:///<project_root with / separators>

Next: run `/slot-step-09` to upscale the approved assets to 4K
for production delivery.

Or `/slot-step-10` if you need multi-aspect crops of a hero asset.

Type `/slot-` to see the full numbered workflow.
```

## What this skill does NOT do

- **Does not generate or modify art.** Design skills (03–07) do that.
- **Does not catch per-asset blocking issues.** Inline gates in design skills do that.
- **Does not replace human art director review.** YELLOW items and "Required
  human visual checks" exist because some calls require a person's judgment.

## References

- `shared/project_memory.md`, `shared/qa_preflight.md`
- `shared/art_principles.md` §10 (full checklists), §8 (CVD and contrast)
- `QA_RUBRIC.md` (detailed per-surface tables)
