# Jackpot Symbol Template

Jackpot tiers are special prize indicators — usually 4 levels: Mini,
Minor, Major, Grand. Each tier has its own metallic finish to communicate
value at a glance. The shape is a circular medallion with a label.

## Tier rules

- **Background:** flat solid black, no gradients
- **Shape:** circular medallion, fills the cell edge to edge
- **Metallic finish per tier:**
  - Mini: bronze
  - Minor: silver
  - Major: gold
  - Grand: platinum or diamond
- **Label:** the tier name in capitals (e.g., `"MINI"`, `"GRAND"`)
- **Size phrase:** "fills entire cell edge to edge, ornate metallic medallion"

## Prompt — Jackpot tier

```
"<JACKPOT_LABEL>" label on a circular medallion,
jackpot tier symbol, fills entire cell edge to edge,
<tier_metallic> metallic finish
(bronze for mini, silver for minor, gold for major, platinum or diamond for grand),
thick outlined badge with sunburst behind the label,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art.
```

Substitution per tier:

| Tier | Label | Metallic |
|---|---|---|
| Mini | `"MINI"` | `bronze` |
| Minor | `"MINOR"` | `silver` |
| Major | `"MAJOR"` | `gold` |
| Grand | `"GRAND"` | `platinum or diamond` |

## Pre-gen quick checks

- [ ] Tier label is in caps and matches the standard set (MINI/MINOR/MAJOR/GRAND)
- [ ] Metallic finish matches the tier rule
- [ ] "Fills entire cell edge to edge" stated
- [ ] Background is `flat solid black background, no gradients`

## Post-gen quick checks

- [ ] Medallion is circular and fills the cell
- [ ] Tier label is clearly readable
- [ ] Metallic finish reads as distinctly bronze/silver/gold/platinum (not generic warm)
- [ ] Differentiable from scatter (scatter has burst rays; jackpot has the medallion outline)
