import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const renderer = await readFile(new URL('../js/rendering/EnemyRenderer.js', import.meta.url), 'utf8');
const config = await readFile(new URL('../js/config.js', import.meta.url), 'utf8');
const types = ['walker', 'flyer', 'jumper', 'chaser', 'shooter'];

assert.match(config, /ENEMY_SIZE:\s*40/, 'enemy hitbox should match the larger visual scale');
assert.match(renderer, /export function drawCoverEnemy/, 'shared enemy renderer must be exported');
assert.match(renderer, /export function drawCoverProjectile/, 'shooter projectile renderer must be exported');

for (const type of types) {
    assert.ok(renderer.includes(`'${type}'`), `renderer is missing the ${type} archetype`);
}

const enemySources = await Promise.all(types.map((type) => {
    const className = `${type[0].toUpperCase()}${type.slice(1)}Enemy.js`;
    return readFile(new URL(`../js/entities/enemies/${className}`, import.meta.url), 'utf8');
}));

for (const [index, source] of enemySources.entries()) {
    assert.match(source, /drawCoverEnemy\(ctx, this, game\.camera\)/, `${types[index]} is not using the shared renderer`);
}

console.log(JSON.stringify({
    passed: true,
    archetypes: types,
    enemySize: 40,
    projectileReworked: true
}, null, 2));
