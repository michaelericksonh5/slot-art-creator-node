# Coin / Hold-and-Spin Template (`WY` family)

The "WY" family is H5G's coin / hold-and-spin / collect-feature symbol
group. They appear as **circular coins** with a currency space (the
runtime overlays the actual numeric value — DO NOT paint a number into
the art unless the brief specifically calls for a static label).

A game can ship with one coin (`WY1`) or several variants (`WY1`, `WY2`,
`WY3`, `WY4`) distinguished by **color** and **mechanic**.

## Universal rules

- **Shape:** circular coin / medallion
- **Background:** flat solid black, no gradients
- **Currency space:** clean blank center reserved for the runtime value
- **Edge:** thick metallic outline / coin rim
- **Sizing:** "fills the cell, prominent, slightly larger than the LP/MP symbols"
- **Differentiation:** when multiple variants exist, hue families must be
  strongly distinct (not subtle shifts) so players read the difference at a glance

## Color convention (default — override if the brief specifies)

| ID | Default color | Typical mechanic |
|---|---|---|
| `WY1` | gold | standard coin — currency value |
| `WY2` | red | random-wilds variant — shoots wilds onto the matrix |
| `WY3` | green | special collector — pins to position, fills a side meter |
| `WY4` | blue / silver | combined trigger / special bonus launcher |

These are convention defaults. The brief may specify different colors
or mechanics — always check `brief.coins[]` first.

---

## Prompt — `WY1` (standard gold coin)

```
A circular gold coin slot symbol — hold-and-spin coin, special bonus,
fills the cell prominently, thick metallic gold rim with sunburst pattern,
clean center reserved for currency value (no number painted in),
<theme_summary> themed engraving on the coin face,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

---

## Prompt — `WY2` (red — random-wilds variant)

```
A circular red coin slot symbol — hold-and-spin coin variant,
fills the cell prominently, thick crimson red rim with energy crackle,
electric / wild-spawning aesthetic distinct from the standard gold coin,
clean center reserved for currency value (no number painted in),
<theme_summary> themed engraving with red-shifted palette,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

---

## Prompt — `WY3` (green — collector variant)

```
A circular green coin slot symbol — hold-and-spin collector coin,
fills the cell prominently, thick emerald green rim with collector aesthetic,
distinct from the gold and red coins — has a collected / accumulated feel,
clean center reserved for currency value (no number painted in),
<theme_summary> themed engraving with green-shifted palette,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

---

## Prompt — `WY4` (blue / silver — combined trigger)

```
A circular silver-blue coin slot symbol — hold-and-spin trigger coin,
fills the cell prominently, thick silvery blue rim with mystical aesthetic,
distinct from the gold, red, and green coins — feels like a combined / power coin,
clean center reserved for currency value (no number painted in),
<theme_summary> themed engraving with cool-shifted palette,
<style_lock>,
centered on flat solid black background no gradients,
clear silhouette, sharp clean edges, professional slot game art,
only one symbol in the frame.
```

---

## Pre-gen quick checks

- [ ] Shape is "circular coin / medallion" stated explicitly
- [ ] Currency space is reserved (no static number in the art)
- [ ] Color matches the variant convention or the brief override
- [ ] Each variant prompt explicitly states it's distinct from sibling variants
- [ ] Background is `flat solid black background, no gradients`
- [ ] Theme engraving is described (otherwise NB2 makes generic coins)

## Post-gen quick checks

- [ ] Center has clean space for the runtime currency overlay
- [ ] Hue family is unmistakable (gold ≠ red ≠ green ≠ blue at a glance)
- [ ] Reads as a coin (circular metallic rim, not a flat shape)
- [ ] Theme engraving is visible but doesn't crowd the currency space
- [ ] When multiple variants exist, side-by-side they look like a coin family — same coin grammar, different colors / mechanics

## Generating multiple WY variants

Generate `WY1` first as the gold standard, then use it as a reference
image for `WY2`, `WY3`, `WY4`. Pass `WY1`'s file as `references`
in subsequent generations and state explicitly:

> "Same coin grammar as the WY1 gold coin already generated — same
> rim treatment, same engraving complexity, same overall composition.
> Differs only in [hue family] and [variant aesthetic cue]."

After all variants are generated, lay them out side by side and confirm
they read as a coordinated family at thumbnail size.

## Currency overlay

The actual currency amount (e.g., "$10", "x100") is added at runtime by
the game engine, not painted into the art. The art always renders with
a CLEAN center space — usually a recessed area where the engine drops
the dynamic text.

If the brief explicitly calls for a static label (e.g., "TRIGGER" written
on the coin), include it. Otherwise, leave the center clean.
