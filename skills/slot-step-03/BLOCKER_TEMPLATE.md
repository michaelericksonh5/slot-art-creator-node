# Blocker / Dead / Obstacle Template (`BL`)

`BL` symbols **do not pay**. They block clusters or paylines and create
friction in cluster-pay and grid-clear games. They're meant to feel
like an obstacle the player wants to clear — not a reward.

Common in: cluster-pay slots, grid-clear / "remove blockers" mechanics,
match-3-style slots, certain bonus games where blockers must be cleared
to win.

## Universal rules

- **Background:** flat solid black, no gradients
- **Aesthetic:** **dead, dark, decorative** — broken stone, rusted gear,
  obsidian shard, ash pile, cracked artifact
- **Reads as "not a pay symbol":** must not look like an HP, MP, LP,
  or any special — visually clearly a non-paying obstacle
- **Sizing:** "fills the cell with normal padding, similar to LP/MP scale"
- **Color:** muted, desaturated — even if the theme is warm, the BL skews
  cool / gray / dark

## Common BL visual treatments

| Theme | BL subject |
|---|---|
| Egyptian | broken stone fragment, cracked sarcophagus shard |
| Fantasy | obsidian shard, cursed runestone, broken sword |
| Sci-fi | scrap metal, dead circuit board, ash pile |
| Pirate | broken barrel staves, rusted chain link |
| Ocean | barnacle-crusted debris, sunken cracked stone |
| Norse | broken Mjolnir fragment, cracked rune stone |
| Generic | rusted gear, weathered wood plank, ash heap |

## Prompt — Blocker

```
<blocker.subject> as a slot blocker symbol — does not pay,
dead, dark, weathered aesthetic — clearly an obstacle, not a reward,
muted desaturated palette skewing cool and gray,
<style_lock>,
centered on flat solid black background no gradients,
fills the cell with normal padding,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

Substitute `<blocker.subject>` from the brief.

## Pre-gen quick checks

- [ ] Subject is something dead / broken / weathered
- [ ] Palette is muted and desaturated (NOT the brief's saturated primary)
- [ ] "Does not pay" intent is in the prompt
- [ ] Subject is NOT something a player would want to land
- [ ] Background is `flat solid black background, no gradients`

## Post-gen quick checks

- [ ] Reads as an obstacle, NOT a reward
- [ ] Visibly less saturated and less ornamented than even the LP symbols
- [ ] Could not be confused with any HP, MP, LP, or special symbol
- [ ] Theme-appropriate but feels broken / dead within that theme

## Anti-patterns

- ❌ Making the BL pretty or ornamented — players might think it pays
- ❌ Using warm / gold / saturated colors
- ❌ Making it more interesting than the LP symbols
- ❌ Adding any text label like "BLOCKER" — players don't read text on
  the reels; the visual must do the work

## Multiple BL symbols

Some games have multiple blocker types (BL1 = clearable in 1 hit, BL2 =
clearable in 2 hits, etc.). When this is the case, escalate the
"damage / cracks" visual:

- BL1: lightly weathered / has surface cracks
- BL2: heavily weathered / partially shattered
- BL3: maximally damaged / barely holding together

Generate in escalation order so each can reference the prior; pass the
prior BL as `references`.
