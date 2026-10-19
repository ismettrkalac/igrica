# Reference notes — Fireboy & Watergirl in the Forest Temple

Source: officially licensed copy on Coolmath Games
(`coolmathgames.com/0-fireboy-and-water-girl-in-the-forest-temple`), captured 2026-10-19
in the built-in browser. Screenshots are 800×600 JPEG/PNG = **1.25× native**; divide by 1.25
for native coordinates. Only screenshots are stored; no original asset files were copied.

## Stage
- SWF header: **640 × 480**, **25 fps**, Flash 9. (The Coolmath wrapper's 500×374 is not the stage.)
- Physics engine named in credits: **Box2D**.
- The level frame has a ~16 px black margin; the stone border wall is about 10 px thick inside it.
- HUD: wooden timer plaque with vines at top centre (`00:03`), a speaker icon at top right,
  and a green orb at bottom centre that opens the pause menu.

## Controls (from Instructions screen)
- Watergirl: A, W, D. Fireboy: arrow keys (←, ↑, →).

## Movement (measured by tracking sprite pixels, native px)
- Run: speeds up for about 0.5 s; top speed is roughly 125–150 px/s. Stops almost immediately on key-up.
- Jump: feet rise about 52 px; about 1.0 s in the air → v0 ≈ 210 px/s, g ≈ 400 px/s².
  This is consistent with level 1, where a 65 px step needs the push box and a 33–39 px step does not.
- Character bounding box: about 22 × 36 px. Fireboy's flame hair adds height.

## Rules observed
- Fireboy walks through lava; on touching water, the character disappears in a white smoke
  puff and about 1 s later the **Game Over** panel appears (Retry Level / Back To Menu).
  There are no checkpoints.
- Gems are collected on touch. Pause panel: Main Menu, Retry Level, blue/red gem counts, Resume.

## Colours (displayed, sampled from screenshot)
| element | colour |
|---|---|
| background brick | #222205 (mortar darker #1b1b00, highlights #3c3b27) |
| stone platform | #6b6026 body, #5c5f38 top, dark outline, green moss #2d6d15 / #1a400e |
| red gem | #c52119 (light #e92f1f) |
| blue gem | #50cdff (light #97e5f3) |
| poison | #2d6d15 / #407131 |
| yellow (lever) platform | #a89b37, highlight #eec74f |
| purple plate / elevator stripe | #a745cd, #71119a |
| push box | #aeb8b1 grey with gold corner caps |
| Fireboy | #c6481f body, #8f0c00 dark |
| Watergirl | #3698c4 body, #195176 dark |
| menu/panel wood | ~#7a6b3c with dark #3a2f12 outline, gold text #e0c060 |

## Decisions not yet verified against the original
- **Collision body is 20 × 30 px.** The art is about 39 px tall. The 30 px body is inferred from the start-ledge jump cap (~17 px)
  and the 32 px gap above the push-box block.
- **Lever / yellow platform.** Walking into the handle flips it. Pushed left, the platform lowers to
  tier 3; pushed back, it rises at 20 px/s, slow enough to flip the lever and still catch the platform.
  I didn't see the original lever in motion, so its speed and direction are guesses chosen so the level is
  completable.
- **Purple elevator speed (30 px/s)** and the level-complete screen layout and rating rule
  (A = all gems within 60 s) are approximations; the original level-complete screen was not captured.
- **Fonts:** Cinzel for menus and hints, and Uncial Antiqua for the logo, as close free substitutes.

## Files
- 01 title, 02 credits, 03 main menu, 04 instructions, 05 level select
- 10 level 1 start (primary layout reference), 13 after gem pickup
- 11 run poses, 12 jump poses, 14 idle characters, 15 doors, 16 pools and gems, 17 box and plate
- 18 Fireboy in lava, 19 death smoke, 20 game over, 21 pause menu
