import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
    PLAYER_RUN_FRAME_COUNT,
    advanceRunCycleDistance,
    crossedFootfall,
    getRunBobOffset,
    getRunCycleFrame,
    getRunCyclePhase,
    smoothFacingScale
} from '../js/systems/PlayerMotionAnimation.js';

const stride = 80;
let distance = 0;
const visitedFrames = new Set();

for (const playerNumber of [1, 2]) {
    const assetUrl = new URL(`../assets/characters/player-${playerNumber}-run-cycle.png`, import.meta.url);
    const assetPath = fileURLToPath(assetUrl);
    const png = fs.readFileSync(assetPath);

    assert.equal(png.toString('ascii', 1, 4), 'PNG', `Player ${playerNumber} run cycle must be a PNG`);
    assert.equal(png.readUInt32BE(16), 2172, `Player ${playerNumber} run strip width changed unexpectedly`);
    assert.equal(png.readUInt32BE(20), 724, `Player ${playerNumber} run strip height changed unexpectedly`);
}

for (let step = 0; step < PLAYER_RUN_FRAME_COUNT; step++) {
    const phase = getRunCyclePhase(distance, stride);
    visitedFrames.add(getRunCycleFrame(phase));
    distance = advanceRunCycleDistance(distance, stride / PLAYER_RUN_FRAME_COUNT, stride);
}

assert.equal(visitedFrames.size, PLAYER_RUN_FRAME_COUNT, 'A full stride must visit all eight run poses');
assert.equal(distance, 0, 'The cycle must wrap cleanly after one stride');
assert.equal(getRunBobOffset(0), 0, 'The first contact pose must stay on the floor');
assert.ok(getRunBobOffset(0.25) > 1.7, 'The passing pose must lift the body');
assert.ok(getRunBobOffset(0.5) < 1e-10, 'The opposite foot contact must stay on the floor');
assert.equal(crossedFootfall(0.49, 0.51), true, 'The midpoint must trigger the second footfall');
assert.equal(crossedFootfall(0.98, 0.02), true, 'Cycle wrap must trigger the first footfall');
assert.equal(crossedFootfall(0.1, 0.2), false, 'Ordinary progress must not trigger a footfall');

let facingScale = 1;
for (let frame = 0; frame < 12; frame++) {
    facingScale = smoothFacingScale(facingScale, false, 1);
}
assert.ok(facingScale < -0.85, 'Visual facing should ease into a full turn');

console.log('Player animation validation passed', {
    frameCount: PLAYER_RUN_FRAME_COUNT,
    strideDistance: stride,
    finalFacingScale: facingScale.toFixed(3)
});
