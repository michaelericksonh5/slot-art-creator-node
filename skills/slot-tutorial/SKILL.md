---
name: slot-tutorial
description: Hands-on beginner walkthrough for the slot-art-creator-node plugin. Generates a real working example from scratch — a complete mini-game brief, one symbol, one background — so the user can see the full pipeline in action before committing to a real project. Use whenever a new user wants to try the plugin, someone asks "how does this work", "show me an example", "walk me through it", "I'm new to this", "can you demo this", or "tutorial". Also run proactively after /slot-setup completes for first-time users.
---

# slot-tutorial — Interactive Walkthrough

Walks you through the full workflow from zero to a generated asset in one
session. By the end you'll have:
- A locked game brief for a simple demo game
- One generated symbol (HP1)
- One generated background
- A clear mental model of how every numbered step fits together

This tutorial creates real files in a sandbox project — nothing is
permanent and you can delete the folder when done.

---

## What you need before starting

- At least one API key configured (`GEMINI_API_KEY` or `FAL_KEY`).
  Run `/slot-setup` first if you haven't. The tutorial uses NB2 tools
  which don't require OpenAI.
- About 10–15 minutes.

---

## Orientation: the two-minute mental model

Before we generate anything, here's how the plugin is organized:

**The numbered steps (00–10)** are a linear pipeline for one game:

| Step | What it does |
|---|---|
| 00 | Pull a GDD from Google Drive (optional — skip if you don't have one) |
| 01 | Lock the brief: theme, palette, style, symbol manifest |
| 02 | Generate the master key art — this becomes the visual anchor |
| 03 | Generate individual symbols (HP, MP, LP, Wild, Scatter, etc.) |
| 04 | Generate a contact sheet (all symbols on one canvas) |
| 05 | Generate backgrounds (base, free-spins, bonus) |
| 06 | Generate UI chrome (bezel, HUD, paytable, win banners, logo) |
| 07 | Reskin an existing UI to the new theme (optional) |
| 08 | Final QA audit across all assets |
| 09 | Upscale approved assets from 2K to 4K |
| 10 | Generate multi-aspect-ratio delivery variants |

**The two non-numbered skills:**
- `/slot-setup` — configure your API keys (one-time, before anything else)
- `/slot-help` — orientation and cheatsheet
- `/slot-compare` — side-by-side NB2 vs gpt-image-2 comparison
- `/slot-tutorial` — this walkthrough

**Project memory:** every step reads and writes a `project.json` in the
project folder. This means sessions can be interrupted and resumed — the
state survives across conversations.

**The Style Anchor:** the most important concept. In Step 01 you write a
~70-word block describing the game's art direction. Every later step
prepends this block to every prompt. This is what makes all 20+ assets
look like they belong to the same game.

---

## Tutorial workflow

### Phase 1 — Brief lock (Step 01 in miniature)

We'll create a fictional game called **"Crystal Cove"** — an underwater
treasure hunt with stylized cartoon art.

Tell me if you'd like to use this demo game or substitute your own idea.
If you have your own: give me the game name, theme (1 sentence), and
one adjective for the art style. I'll adapt the tutorial.

**Using Crystal Cove:**

Here's the brief we'll lock:

```
game_name    : Crystal Cove
theme_summary: An underwater treasure hunt where divers discover an ancient
               sunken city filled with glowing crystals and colorful sea life.
style_lock   : stylized cartoon slot game art
palette_leads:
  primary      : deep ocean blue and aquamarine
  accents      : warm coral and gold
  forbidden_on_lp: gold, amber, coral (reserved for HP/special tiers)
grid         : 5x3
tier_plan    : 1 Wild + 1 Scatter + 2 HP + 2 MP + 5 LP (A K Q J 10 card suits)
```

**Style Anchor (auto-generated from this brief):**

```
You are generating art assets for a mobile slot machine game ("Crystal Cove"
— an underwater treasure hunt where divers discover an ancient sunken city
filled with glowing crystals and colorful sea life). Every output must be
optimized for small phone screens — every element must be recognizable by
silhouette alone when small on a phone. Use bold, clean shapes — no intricate
micro-textures, no dense filigree that collapses at thumbnail size. High
contrast between foreground and the flat background. Warm saturated colors
signal high pay; cool muted colors signal low pay. Gold is reserved for
premium and special symbols only. Maintain a consistent stylized cartoon
slot game art rendering technique across the entire set.
```

Now I'll create the sandbox project folder. Check what `SLOT_ART_PROJECT_BASE`
resolves to and create:
`<PROJECT_BASE>/9999_tutorial/`

Write `project.json` with:
- `brief` — the brief fields above
- `style_anchor` — the 70-word anchor above (top-level string)
- `current_step: "tutorial"`
- `next_step: "/slot-step-02"`

Set `~/.h5g-slot-active-project.json` to point here.

Confirm with the user before writing.

---

### Phase 2 — Generate one symbol (Step 03 in miniature)

Now we'll generate HP1 — the game's top-paying character symbol.

**Crystal Cove HP1: "The Crystal Diver"**

A deep-sea explorer in a stylized diving suit, faceplate glowing with
aquamarine crystal light, holding a glowing crystal shard aloft.

Here's the prompt I'll use (in the bracketed-block format):

```
[Style anchor prepended verbatim]

[RENDER STYLE]
Stylized cartoon slot game art, vibrant saturated colors, bold outlines,
smooth cell-shaded surfaces, no photorealism, no painterly texture

[PLAQUE SHAPE]
Square plaque with rounded corners, deep ocean blue background,
soft inner rim glow in aquamarine

[COLOR SYSTEM FOR THIS SYMBOL]
Warm gold and coral for the diving suit and crystal shard — these are
the HP tier's premium colors. Aquamarine glow on the helmet faceplate
and crystal. Deep blue background.

[SUBJECT INSIDE]
A stylized cartoon diver character in a retro diving suit, right arm raised
holding a large glowing crystal shard overhead, left hand pressed to the
helmet viewing port, facing slightly right-of-center at the viewer

[ANATOMY LOCK]
Full character from helmet to flippers, occupies 75% of the plaque height,
round helmet with a large circular faceplate glowing aquamarine, chunky
retro suit silhouette, single crystal shard extends above the helmet

[MOBILE CONSTRAINTS]
Must read as a clear silhouette at 64px. Bold shapes only. No fine detail
on suit surface. Crystal must be a clear triangular shape. Helmet must be
a clear circle.
```

Walk the user through it:

1. Show them the prompt above and explain each block's purpose
2. Ask: "Ready to generate?" — wait for confirmation
3. Call `mcp__nb2node__nb2_generate`:
   - `prompt`: (style_anchor + the bracketed prompt above)
   - `aspect_ratio`: `"1:1"`
   - `image_size`: `"2K"`
   - `output_dir`: `<project_root>`
   - `asset_name`: `"HP1"`
4. Show the result and run Gate 2 inline QA:
   - Is the diver the dominant subject?
   - Does gold/coral appear on the suit? (HP warmth check)
   - Is the silhouette readable as a diver shape?
   - Does the background stay dark?
5. If it FAILS any check, explain what failed and why, patch the prompt,
   and regenerate once. Talk through the patch out loud.
6. When it passes, write the approved path:
   - `project.json.assets.symbols.HP1.iterations`: [path]
   - `project.json.assets.symbols.HP1.approved`: path (ask user first)

---

### Phase 3 — Generate the base background (Step 05 in miniature)

Now we'll generate the background the symbols will sit on.

**Crystal Cove base background — what makes a good slot background:**

A good slot background does ONE thing: establish the world without competing
with the symbols. The reel zone (center column) must be dimmer than the
surroundings. The bottom 30% must stay dark for UI controls.

Here's the prompt:

```
[Style anchor prepended verbatim]

A mobile slot game background, underwater sunken city environment,
stylized cartoon slot game art,
three-layer composition with foreground coral framing, midground ancient
stone archways and scattered crystal clusters, and distant deep ocean haze
for atmospheric perspective,
upper-left key light at 10 o'clock casting aquamarine bioluminescent glow,
deep ocean blue palette with aquamarine bioluminescent accents,
bottom third of the canvas darkest for UI controls,
center column dimmed by roughly fifteen percent for the reel zone,
corners about thirty percent darker than center for a soft vignette,
no UI mockup, no reels, no paylines, no spin buttons, no HUD, no text,
professional slot game art, mobile slot background, 9:16 portrait.
```

1. Show the prompt and point out:
   - Where "bottom third darkest" appears (UI requirement)
   - Where "center column dimmed" appears (reel-zone requirement)
   - The three-layer composition
2. Ask: "Ready to generate?" — wait for confirmation
3. Call `mcp__nb2node__nb2_generate`:
   - `prompt`: (style_anchor + background prompt)
   - `aspect_ratio`: `"9:16"`
   - `image_size`: `"2K"`
   - `output_dir`: `<project_root>`
   - `asset_name`: `"BG_base"`
   - `references`: [resolved path to HP1's approved file, if available]
4. Show result and run Gate 2:
   - Is the bottom third darker than the top?
   - Is the center zone slightly dimmer than the sides?
   - Does it feel like an underwater environment?
   - Would the symbol we just generated look at home in front of this?
5. Write approved path to `project.json.assets.backgrounds.base`

---

### Phase 4 — What's next

Summarize what was accomplished:

```
✓ Tutorial complete!

  Project folder : <project_root>
  Brief          : locked (Crystal Cove)
  Style anchor   : set
  HP1 symbol     : generated (<HP1_NNN.png>)
  Base background: generated (<BG_base_NNN.png>)

What you just saw was the core loop:
  1. Lock a brief (Step 01) → style_anchor captures the game's DNA
  2. Generate a symbol (Step 03) → bracketed-block format, 2-gate review
  3. Generate a background (Step 05) → reel-zone and UI-zone discipline

The full workflow (Steps 00–10) extends this loop to:
  key art → all symbols → contact sheet → backgrounds →
  UI chrome → QA audit → 4K upscale → delivery variants

To start a real project:
  - Run /slot-step-01 with your real game brief (or /slot-step-00 if you
    have a GDD on Google Drive)
  - Run /slot-compare if you want to see NB2 vs gpt-image-2 side-by-side
  - Run /slot-help for the full cheatsheet

The tutorial project folder is at:
  <project_root>
Feel free to keep or delete it.
```

---

## If the user wants to diverge

The tutorial script above is a guide, not a rail. If the user says:
- "I want to use my own game" → use their theme/name in every step
- "Can we do an LP instead?" → substitute an LP symbol (simpler, cooler palette)
- "Skip the background" → stop after Phase 2
- "What if I use gpt-image-2?" → note it requires OpenAI key, offer to
  demo `/slot-compare` instead

Stay responsive to what they're interested in — the goal is understanding,
not completing the script.

---

## Hard rules

- **Always wait for user confirmation before generating** — this is a
  tutorial, not an auto-pilot. Let them read each prompt before it runs.
- **Explain every choice out loud** — why the bracketed-block format,
  why "bottom third darkest", why style_anchor prepends. The user should
  finish this tutorial understanding WHY, not just WHAT.
- **Don't rush** — if a generation fails, that's a teaching moment. Walk
  through the diagnosis and fix out loud.

---

## References

- `shared/nb2_prompting.md` (full prompting guide)
- `shared/project_memory.md` (state schema)
- `skills/slot-step-03/HP_TEMPLATE.md` (full HP template)
- `skills/slot-step-05/PROMPT_TEMPLATES.md` (background templates)
