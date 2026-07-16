# Design QA — Cover-faithful player characters

## Visual truth

- Source reference: `C:\dev\projetos\plataformer-procedural\assets\stack-or-splat-key-art.png`
- Player 1 final animation asset: `C:\dev\projetos\plataformer-procedural\assets\characters\player-1-animation.png`
- Player 2 final animation asset: `C:\dev\projetos\plataformer-procedural\assets\characters\player-2-animation.png`
- Test viewport: 1280 × 720
- Tested state: two-player gameplay, idle and airborne animation states

## Evidence

- Full gameplay view: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-cover-characters-idle.png`
- Airborne pose: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-cover-character-jump.png`
- Focused source/implementation comparison: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-cover-character-comparison.png`

## Comparison history

1. Previous implementation used geometric canvas primitives. It preserved game logic but did not reproduce the cover character's silhouette, facial construction, painterly volume, or limb design.
2. Replaced the primitive renderer with high-resolution raster character art derived directly from the cover. Both players now use six authored poses: two idle, two run, jump, and fall.
3. Removed the extra procedural body, face, arms, and legs from the active render path. Collision dimensions and movement logic remain unchanged.
4. Measured and trimmed each atlas frame independently so the feet remain grounded and the body size stays consistent across poses.
5. Final comparison confirms the cover silhouette, eye construction, joyful mouth, glossy rounded body, thick navy outline, small hands, chunky feet, and red-orange hat are preserved in gameplay. Player 2 uses the same species and rendering language with a coral body and purple hat.

## Interaction and state checks

- Two-player mode launches correctly.
- Player 1 and Player 2 both render with distinct authored art.
- Idle animation alternates between two poses.
- Running alternates between contact and passing poses.
- Rising jump and falling states use dedicated poses.
- Existing squash/stretch, lean, death rotation, suction, power-up auras, collision, and controls remain wired to the new art.
- The first hat is integrated into the character art; collected hats continue stacking above it.
- No biome or scenario theme was changed.

## Severity review

- P0: none
- P1: none
- P2: none
- P3: extra collected hats still use the existing biome-specific renderer, so a future graphics pass can replace those hats with painterly assets matching the new characters.

## Validation

- JavaScript syntax checks: passed
- Procedural generation validation: passed (100 seeds, 7,000 chunks)
- Git whitespace/error check: passed

final result: passed
