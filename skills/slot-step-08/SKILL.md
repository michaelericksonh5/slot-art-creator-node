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

Follow `shared/project_memory.md` → "Skill startup protocol", including
the "no active project — guide through setup" pattern.

1. Resolve active project. **If none exists**, the user is asking to
   audit something that hasn't been built — route to `/slot-step-01`
   to set up a project, then explain that there's nothing to audit
   yet and surface the next reasonable step (`/slot-step-02` to
   generate key art). The audit can run once any assets are approved.
2. Load `project.json`, `game_brief.json`.
3. Read all references:
   - `style_anchor.key_art_path` (the original locked anchor — if
     unlocked, route to `/slot-step-02` first since the audit grades
     consistency against the anchor)
   - GDD source images from Drive if `gdd_source.file_id` is set and
     the brief's color direction feels uncertain
4. List all approved assets in scope. If literally nothing has been
   approved yet, tell the user honestly: there's nothing to grade.
   Suggest running the relevant design skill first.

## Workflow

### Step 1 — Identify deliverable scope

Ask user:
- **Symbol set** — all approved per-symbol PNGs + the contact sheet
- **Background suite** — all variants
- **Avatar cast** — every approved in-game animated character
  (`assets.avatars.Avatar1`–`Avatar5`). Games with zero avatars skip
  this scope.
- **UI collection** — all UI surfaces
- **Full cross-asset review** — symbols + background + avatars + UI together
- **Final sign-off** — everything in the project, with a written report

### Step 2 — Read all assets in scope

Use the Read tool to visually inspect every image. Do not summarize from
filename — actually look at each one.

For symbol sets, read in tier order: Jackpot → Wild → Scatter → HP1 → HP2 →
MP1 → MP2 → LP1 → ... → LP6.

For avatars (when present), read all of `Avatar1` through `Avatar5` in
numeric order — this is the order `/slot-step-06` generates them, and
it usually matches role hierarchy (lead → sidekick → supporting cast),
which is the most useful read order for cross-cast consistency grading.

### Step 3 — Grade

**Read `QA_RUBRIC.md` for the full per-surface tables and edge cases.**
The rubric is the canonical source. The summaries below are pointers for
quick reference at grading time — they intentionally don't repeat every
edge-case row from the rubric. If anything below feels under-specified
for an asset you're grading, fall through to `QA_RUBRIC.md`.

| Scope | What to check (summary — see QA_RUBRIC.md for full tables) |
|---|---|
| **Symbol set — tier gradient** | Cover the labels and ask "which is higher value?" — the answer must be obvious at HP1→HP2, HP2→MP1, MP→LP. Wild clearly breaks category + palette. Scatter is a circular badge identifiable as a trigger. |
| **Symbol set — LP discipline** | Zero gold/amber/warm trim on any LP. LP family consistent (all card royals, or all gems, etc. — never mixed). |
| **Symbol set — export BG** | HP/Wild/Scatter/Jackpot on flat solid black; LP on flat solid white; no gradients or patterns. |
| **Symbol set — style** | All symbols share `style_lock`. Light direction consistent (upper-left ~10 o'clock). |
| **Symbol set — readability** | Clear silhouette at thumbnail size on every symbol. |
| **Backgrounds** | Bottom 30% dark on all variants. Reel zone dimmed. Three-layer depth. Free-spins more saturated/warm than base. Bonus has more drama. BG palette recedes behind symbol palette. |
| **Avatars** (when present) | All on flat solid black, neutral idle pose, 1:1 aspect. Same `style_lock` and palette family as the symbol set — no photoreal avatars in a stylized game. Cast brightness/saturation sits between HP and MP intensity (not louder than the reel set). Multi-avatar games: same key light direction, same rendering technique, palette family shared but each avatar uses a different accent. Avatars must NOT replicate any symbol-set subject (symbol/environment exclusivity also applies here). |
| **UI** | Chrome ranks below symbols in brightness and visual weight. Bezel has transparent/open center. Banner tiers distinguishable across ≥2 axes (see BANNERS_TEMPLATE.md). Touch targets visually generous. Logo readable at thumbnail. |
| **Lobby tile — competitor-grid check** | Has the lobby tile been reviewed inside a 3×4 or 4×5 mockup of competitor tiles at thumbnail size (~200 px)? If not, this is an automatic YELLOW. See `slot-step-06/LOBBY_TILE_TEMPLATE.md` "Competitor-grid mockup discipline" for the procedure. The tile must draw the eye within 500 ms, look categorically different from neighbors, and have a readable title wordmark at thumbnail size. |
| **Production handoff readiness** | If the audit is for the final production sign-off (not a mid-project check), the production-handoff checklist in `shared/production_handoff.md` should be reviewable — atlas-friendly padding, pngquant/oxipng optimization, sRGB color space confirmed, banding check on gradients. These are technical-delivery prerequisites, not creative ones. |
| **Cross-asset** | Everything feels like one cohesive world. No surface competes at wrong hierarchy level. Palette family consistent. |
| **Symbol/environment exclusivity** | No symbol-set subject is repeated across BG/frame/UI as a recurring decorative motif. See `shared/qa_preflight.md` "Symbol/environment exclusivity" for the rule and why it matters. |

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

Save to `{project_root}/QA_Reports/QA_NNN.md`. Scan `QA_Reports/`
(create the folder if it doesn't exist) for existing `QA_*.md`,
increment past the max. The report file is markdown, not PNG, but
follows the same naming convention. Example: first audit →
`QA_Reports/QA_001.md`; re-audit after fixes → `QA_Reports/QA_002.md`.

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

- Append the relative path (`"QA_Reports/QA_NNN.md"`) to
  `project.json.assets.qa_reports`
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
  Report: QA_Reports/QA_002.md
  All 13 symbols, 3 BG variants, 5 UI surfaces passed.
  Folder: <project_root>/QA_Reports/
  Open:   file:///<project_root>/QA_Reports/

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
