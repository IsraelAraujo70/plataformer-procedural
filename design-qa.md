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

---

## Cover-faithful terrain and first scenario pass

- Replaced the active rectangular/tile platform renderer with a shared cover-inspired terrain renderer.
- Ground and floating platforms now use irregular silhouettes, thick navy outlines, luminous top caps, painted rock facets, tapered undersides, and biome-specific material palettes.
- Platform collision boxes, procedural placement, reachability, and platform type behavior remain unchanged.
- Rebuilt the Plains scenario around the key art's deep cosmic blue, cyan atmospheric depth, cool ice peaks, warm golden cliffs, stardust, glow motes, and edge vignette.
- Replaced the flat cloud-heavy Plains parallax with sparse energy wisps so the player and traversable surfaces remain the visual priority.
- Added cache-version updates so browsers load the new renderer immediately.

### Terrain validation

- Test viewport: 1280 × 720.
- Gameplay evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-cover-terrain-pass.png`.
- JavaScript syntax checks: passed.
- Procedural generation validation: passed (100 seeds, 7,000 chunks).
- Browser console errors during gameplay: none.
- Git whitespace/error check: passed.

terrain result: passed

---

## Cover-faithful biome background pass

- Added a shared production background renderer for all eight biomes while preserving each biome's original theme.
- Plains is now the lightest and most welcoming biome, with a bright cyan sky, soft clouds, warm daylight, green valleys, and airy atmospheric depth.
- Cave retains dark stone, stalactites, cyan/purple crystals, and underground mist without collapsing into pure black.
- Ice retains snow, aurora ribbons, cold stars, and layered frozen peaks.
- Desert retains a hot sun, turquoise-to-gold sky, mesas, heat streaks, and painted dunes.
- Sky retains clouds, celestial light rays, and distant floating islands.
- Apocalypse retains smoke, embers, a red sun, ruined silhouettes, and scorched mountains.
- Moon retains a star field, distant blue planet, lunar horizon, and craters.
- Black Hole retains a deep-space palette, bright accretion rings, a black core, and floating debris.
- Fixed terrain-facet flicker by anchoring every procedural visual seed to stable world coordinates instead of camera-relative screen coordinates.

### Biome validation

- Production-renderer comparison page: `tests/biome-visual-preview.html`.
- Preview evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-biomes-top.png`.
- Preview evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-biomes-middle.png`.
- Preview evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-biomes-bottom.png`.
- All eight biome renderers loaded with no browser console errors.
- Plains gameplay integration verified at 1280 × 720.
- Moon surface stability regression test passed across 20 shared world segments.
- Procedural generation validation: passed (100 seeds, 7,000 chunks).

biome background result: passed

---

## New-character scale and collision calibration

- Measured the active character art at approximately 70 × 78 rendered pixels against the legacy 24 × 32 physical box.
- Replaced the legacy player box with a 40 × 56 body hitbox, bottom-aligned with the sprite and intentionally excluding arms and hats.
- Added a separate 64 × 76 pickup area so visible hand/head contact collects items without making those extremities vulnerable to platforms or enemies.
- Increased coins from 16 × 16 to 26 × 26 pixels.
- Increased modifiers from 20 × 20 to 28 × 28 pixels.
- Increased collectable hats from 20 × 16 to 28 × 22 pixels.
- Repositioned collectables using player height, item size, and a fixed clearance so the larger body does not collect elevated items while standing still.
- Tiny-player pickup bounds scale proportionally with the physical character size.

### Scale validation

- Gameplay evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-player-scale.png`.
- Hitbox evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-player-hitbox.png`.
- Physical hitbox: 40 × 56.
- Pickup bounds: 64 × 76.
- Rendered player height: 78.
- Dedicated player-scale regression test: passed.
- Browser console errors: none.
- Procedural generation validation: passed (100 seeds, 7,000 chunks).

scale and collision result: passed

---

## Cover-faithful enemy visual rework

- Reworked all five enemy archetypes with the key art's thick navy outline, painted volume, bright highlights, expressive eyes, and saturated cosmic palette.
- Walker is now an orange cratered meteor brute with grounded feet and a readable patrol direction.
- Flyer is now a purple/cyan cosmic moth with a broad wing silhouette and a single luminous eye.
- Jumper is now a lime/teal elastic blob whose squash and charge arc communicate the next jump.
- Chaser is now a red/magenta spiked comet whose tail, lean, aura, and face communicate its dash state.
- Shooter is now a blue/purple armored cyclops with an aiming cannon, charge ring, muzzle glow, and matching energy projectile.
- Increased enemy body and collision size from 28 × 28 to 40 × 40 so enemies remain proportionate to the new 70 × 78 rendered player.
- Preserved every enemy's movement, detection, attack cadence, score value, stomp behavior, and biome availability.
- Procedural texture details are fixed in local enemy space; only intentional state animations move, avoiding visual flicker.

### Enemy validation

- Production-renderer lineup page: `tests/enemy-visual-preview.html`.
- Lineup evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-enemy-lineup.png`.
- Gameplay evidence: `C:\Users\gusta\AppData\Local\Temp\stack-or-splat-enemies-gameplay.png`.
- Walker and flyer integration verified in active gameplay.
- Enemy hitboxes verified with the built-in debug overlay.
- Dedicated enemy visual wiring regression test: passed.
- JavaScript syntax checks: passed.
- Procedural generation validation: passed (100 seeds, 7,000 chunks).

enemy visual result: passed
