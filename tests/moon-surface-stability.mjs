import assert from 'node:assert/strict';
import { getStableMoonSurfacePoints } from '../js/rendering/BiomeBackgroundRenderer.js';

const width = 1280;
const horizon = 720 * 0.78;
const before = getStableMoonSurfacePoints(width, 1200, horizon);
const after = getStableMoonSurfacePoints(width, 1437, horizon);
const afterByWorldIndex = new Map(after.map(point => [point.worldIndex, point]));
const sharedPoints = before.filter(point => afterByWorldIndex.has(point.worldIndex));

assert.ok(sharedPoints.length >= 10, 'Expected enough overlapping lunar surface segments');
for (const point of sharedPoints) {
    assert.equal(
        point.y,
        afterByWorldIndex.get(point.worldIndex).y,
        `Moon segment ${point.worldIndex} changed height when the camera moved`
    );
}

console.log(JSON.stringify({ passed: true, sharedSegments: sharedPoints.length }, null, 2));
