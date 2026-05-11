# Lobby Tile Template

The lobby tile is the thumbnail in a grid of competing games. It must
communicate the game in **one visual idea** at small size. The title
wordmark is part of the tile.

## Surface rules

- **One visual idea.** No ensemble. The hero theme element + the title.
- **Hero element:** center-frame, the most recognizable thing about the game
- **Title:** prominent, occupies roughly the center band, 40–60% of tile width
- **Aspect ratio:** typically `1:1` square or `4:3`, passed via API arg
- **Silhouette:** must survive a 5-pixel blur test (be still recognizable when blurred)

## Prompt — lobby tile

```
A lobby tile thumbnail for the slot game "<game_name>", <style_lock>,
one strong visual idea readable at small size,
hero theme element center-frame,
title wordmark "<game_name>" prominent across roughly the center band,
<palette_leads.primary> palette,
strong silhouette that survives a 5-pixel blur test.
```

## Pre-gen quick checks

- [ ] One single hero element (not an ensemble)
- [ ] Title wordmark text included verbatim
- [ ] "Strong silhouette" / "5-pixel blur test" language present
- [ ] Palette pulled from `brief.palette_leads.primary`

## Post-gen quick checks

- [ ] Recognizable at small size (mentally shrink to 200×200 px)
- [ ] Title wordmark is readable
- [ ] One clear focal point — eyes don't wander
- [ ] Silhouette test: blur the image mentally; can you still tell what game this is?
- [ ] Title doesn't fight the hero element for attention (one is dominant, the other supports)

## Variations

Some lobbies need both `1:1` (grid tile) and `4:3` (featured tile) versions.
Generate the `1:1` first, then use it as a reference image when generating
the `4:3` variant — pass it via the API's `references` arg, not in
the prompt body. Save as `Tile_NNN.png` and `Tile_4x3_NNN.png`.
