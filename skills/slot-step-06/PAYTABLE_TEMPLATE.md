# Paytable Layout Template

The paytable is a static info screen showing each symbol's payout
ladder. It must use the **same symbol art as the reels** — alternate art
breaks player trust. This skill generates the layout with placeholder
slots; `/slot-step-03` produces the actual symbol art that gets
composited in.

## Surface rules

- **Symbol art:** placeholder squares only — DO NOT generate decorative
  symbol art here. Real symbols are pulled from the approved set.
- **Background:** dimmed dark themed panel (60–80% dark overlay or solid)
- **Body text:** light off-white, never pure white (pure white is harsh on dark BG)
- **Pay values:** warm gold tabular numerals
- **Section header:** "PAY TABLE" at the top
- **Row count:** 4–6 symbols per page in portrait

## Prompt — paytable layout

```
A mobile slot game paytable info screen, <theme_summary> themed, <style_lock>,
dimmed dark background panel with subtle <palette_leads.primary> themed border,
six rows of empty symbol slots paired with pay value text in
warm gold tabular numerals,
section header "PAY TABLE" at the top, generous padding,
body text light off-white never pure white,
no actual symbol art (placeholder squares only),
mobile-readable typography for a portrait paytable layout.
```

## Pre-gen quick checks

- [ ] "No actual symbol art (placeholder squares only)" stated
- [ ] "PAY TABLE" header text included
- [ ] Body text is "off-white, never pure white"
- [ ] Pay values are "warm gold tabular numerals"
- [ ] Row count specified (typically 6)

## Post-gen quick checks

- [ ] Symbol slots are clearly placeholder squares (nothing drawn inside them)
- [ ] Header reads "PAY TABLE"
- [ ] Pay value column is gold and feels like tabular numerals (consistent width)
- [ ] Background panel is dimmed (the game BG would show faintly through it)
- [ ] Generous padding — not crowded

## What happens after generation

This skill produces the **layout**. The paytable in the final game is a
composite:

1. `/slot-step-06` generates `Paytable_NNN.png` (the chrome layout)
2. `/slot-step-03` produces `HP1_NNN.png`, `MP1_NNN.png`, etc.
3. Production composites the approved symbol PNGs into the paytable
   slots — done outside this plugin in your asset pipeline

Do NOT try to generate the symbols inline as part of the paytable. They
won't match the approved reel art and will break player trust.
