# Upscale review rubric (8 axes)

After NB2 returns the upscale, Claude grades it on these eight axes. Any
**FAIL** sends the prompt back for a patch and a rerun.

| Axis | PASS looks like | FAIL looks like |
|---|---|---|
| **Identity match** | Subject is the same character/object, recognizable instantly. | Different character, different species, restyled toy. |
| **Pose / silhouette** | Same stance, outline within a few %. | Arms repositioned, head tilt changed, body reshaped. |
| **Rendering style** | Still stylized 3D / flat vector / painterly — whatever the source was. | Became photorealistic, became flatter, became painted when it was vector. |
| **Color palette** | Same named colors, same saturation band. | Lime → forest green; desaturated; warmer/cooler cast. |
| **Detail parity** | Same *amount* of detail — highlights/petals/bubbles roughly match. | Invented new highlights, added texture, multiplied decorative elements. |
| **Background** | Matches the prompt's background instruction exactly. | Transparent checkerboard leaked through; gradient appeared; scene added. |
| **Micro-quality** | Edges crisp, no aliasing, no jpeg artifacts, looks genuinely upscaled. | Blown up / pixelated, soft, or visibly re-rendered from text alone. |
| **Framing** | 1:1 square, subject at same scale and position. | Cropped, zoomed, re-framed, off-center. |

**Mental check:** *"Would I notice the swap if the two images were placed
next to each other in a slot symbol carousel?"* If yes — it failed.

---

## Diagnose → patch playbook

When an axis fails, here's the prompt patch.

| Failure | Patch |
|---|---|
| Photorealized | Strengthen the rendering-style bullet ("**stylized 3D illustration, NOT photorealistic, NOT a real-world photograph**"). Add to negative constraints. |
| Color drift | Restate named colors twice — once in preservation list, once in the material restatement. Avoid hex codes. |
| Background changed | Move background bullet earlier in the preservation list and add to closing deliverable framing. |
| Subject swap | Lengthen identity description (species, key visual signature). Add "preserve subject identity exactly" as bullet 1. |
| Detail multiplied | Add explicit count to preservation ("three petal clusters — exactly three") and to negative constraints. |
| Pose drift | Describe pose in two ways (verbal + spatial: "left arm raised at 45°"). |
| Soft / pixelated | Add a concrete enhance-only item ("crisp edge sharpness, no anti-alias halos"). |
| Framing changed | Restate the framing bullet in part 6 (deliverable framing) too. |

---

## When to stop iterating

- **2 retries max** (3 total attempts) for any single asset. If you can't
  get a passing upscale in 3 tries, the source is the problem (too low-res,
  too ambiguous, or stylistically incompatible with NB2's upscale mode).
  Tell the user honestly.
- **Generate variants on the winning prompt.** Once you have a prompt
  that passes once, run N parallel `nb2_upscale` calls and pick the best
  (see SKILL.md Step 4 — N=2 for standard HP/banner, N=3–4 for hero/key
  art). `nb2_upscale` is an MCP tool call, not a CLI command — there is
  no `--variants` flag. Issue each variant as a separate MCP call with a
  distinct `asset_name` suffix (`_v1`, `_v2`, etc.) in the same tool batch.
- **Human sanity check** for hero assets after the rubric passes. Eye
  placement, letter forms in logos, and very subtle silhouette changes
  can slip past the rubric.
