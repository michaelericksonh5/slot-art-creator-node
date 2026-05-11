# Win Banner Templates

Win banners are the celebration overlays for big wins. Tiers escalate in
drama: BIG WIN → MEGA WIN → EPIC WIN. The numeral is always the focal
point — actual win amounts get composited at runtime, so the banner
generates with empty space reserved for them.

## Surface rules

- **Numeral focus:** the win amount numeral (added at runtime) is the focal
  point. Generate the banner with a large empty space in the center reserved for it.
- **Tier separation:** tiers must differ in **at least 2 dimensions** —
  size, palette, frame complexity, burst density, intensity
- **Numeral treatment stack** (apply at runtime, but the banner art should
  visually accommodate it):
  gold gradient → spec band → dark outline → secondary outline →
  bevel highlight → drop shadow → outer glow
- **Background:** full-screen radial vignette + sunburst rays

## Tier labels

| Multiplier range | Label |
|---|---|
| 10–25× | `"BIG WIN"` |
| 25–50× | `"MEGA WIN"` |
| 50×+ | `"EPIC WIN"` |

(Some studios add `"SMALL"` and `"MEDIUM"` tiers below BIG. Use what
`brief.banners` specifies.)

## Prompt — win banner (parameterize per tier)

```
A <tier_label> win celebration overlay for a mobile slot, <style_lock>,
full-screen radial vignette with <palette_leads.primary> sunburst rays,
themed frame with large empty space in the center reserved for the win amount numeral,
"<TIER_LABEL>" text in the upper area in premium gold lettering with
dark outline and bevel from upper-left,
<theme_summary> palette accents around the frame edges,
no actual numerals (runtime overlays the live count),
professional slot game art.
```

## Tier escalation guide

When generating multiple tiers, vary at least 2 of these axes between tiers:

| Axis | Big | Mega | Epic |
|---|---|---|---|
| Frame complexity | simple ornate | sculptural | maximalist |
| Burst density | medium | dense | radiant explosion |
| Palette intensity | warm gold | gold + crimson accents | gold + crimson + electric accents |
| Vignette darkness | medium | strong | very strong |

The user (and player) should be able to tell at a glance which tier they
just hit without reading the label.

## Pre-gen quick checks

- [ ] Tier label is one of the brief's banner tier set
- [ ] Numeral focal point stated
- [ ] "No actual numerals" stated (runtime adds them)
- [ ] Sunburst rays + radial vignette stated
- [ ] Tier-specific intensity matches the position in the escalation

## Post-gen quick checks

- [ ] Center has a clear empty space for the runtime numeral
- [ ] Tier label text is in the upper area, not central
- [ ] Frame complexity / burst density visibly differs from sibling tiers
- [ ] Palette is theme-consistent

## Generating the full set

When asked for "all banner tiers," generate them in order (small → big →
mega → epic) and read each prior tier as a reference image so the
escalation reads consistently. Save as
`Banner_small_NNN.png`, `Banner_big_NNN.png`, `Banner_mega_NNN.png`,
`Banner_epic_NNN.png`.
