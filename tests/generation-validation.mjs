import { game } from '../js/game.js';
import { CONFIG } from '../js/config.js';
import { Random } from '../js/utils/Random.js';
import { Chunk, canReachPlatform } from '../js/world/Chunk.js';
import { PATTERNS } from '../js/world/Patterns.js';

const seedCount = Number.parseInt(process.argv[2] || '100', 10);
const chunkCount = Number.parseInt(process.argv[3] || '70', 10);
const patternsByName = new Map(Object.values(PATTERNS).map(pattern => [pattern.name, pattern]));
const failures = [];
const metrics = {
    seeds: seedCount,
    chunks: 0,
    patternedChunks: 0,
    bonusPlatforms: 0,
    coins: 0,
    enemies: 0,
    modifiers: 0,
    hats: 0
};

function fail(seed, chunkIndex, reason, details = {}) {
    failures.push({ seed, chunkIndex, reason, ...details });
}

function validatePatternIntegrity(seed, chunk) {
    const instances = new Map();

    for (const platform of chunk.platforms) {
        if (!platform.patternInstance) continue;
        if (!instances.has(platform.patternInstance)) instances.set(platform.patternInstance, []);
        instances.get(platform.patternInstance).push(platform);
    }

    for (const platforms of instances.values()) {
        const first = platforms.find(platform => platform.patternIndex === 0);
        const definition = first && patternsByName.get(first.patternName);
        if (!first || !definition || platforms.length !== definition.platforms.length) {
            fail(seed, chunk.index, 'incomplete-pattern', { pattern: first?.patternName });
            continue;
        }

        const firstDefinition = definition.platforms[0];
        const originX = first.x - firstDefinition.offsetX * CONFIG.TILE_SIZE;
        const originY = first.y - firstDefinition.offsetY * CONFIG.TILE_SIZE;

        for (const platform of platforms) {
            const platformDefinition = definition.platforms[platform.patternIndex];
            const expectedX = originX + platformDefinition.offsetX * CONFIG.TILE_SIZE;
            const expectedY = originY + platformDefinition.offsetY * CONFIG.TILE_SIZE;
            const expectedWidth = platformDefinition.width * CONFIG.TILE_SIZE;

            if (Math.abs(platform.x - expectedX) > 0.001 ||
                Math.abs(platform.y - expectedY) > 0.001 ||
                Math.abs(platform.width - expectedWidth) > 0.001) {
                fail(seed, chunk.index, 'mutated-pattern', {
                    pattern: first.patternName,
                    platform: platform.patternIndex
                });
            }
        }
    }
}

for (let seed = 1; seed <= seedCount; seed++) {
    game.chunkAnchors = new Map();
    let previousChunk = null;

    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex++) {
        const rng = new Random(seed + chunkIndex * 1000);
        const chunk = new Chunk(chunkIndex, rng, previousChunk);
        const mainRoute = chunk.platforms.filter(platform => platform.routeRole !== 'bonus');
        const bonusPlatforms = chunk.platforms.filter(platform => platform.routeRole === 'bonus');

        metrics.chunks++;
        metrics.bonusPlatforms += bonusPlatforms.length;
        metrics.coins += chunk.coins.length;
        metrics.enemies += chunk.enemies.length;
        metrics.modifiers += chunk.modifiers.length;
        metrics.hats += chunk.hats.length;
        if (mainRoute.some(platform => platform.patternInstance)) metrics.patternedChunks++;

        if (mainRoute.length === 0) {
            fail(seed, chunkIndex, 'empty-main-route');
            break;
        }

        const entry = previousChunk?.getExitAnchor();
        if (entry && !canReachPlatform(entry, mainRoute[0])) {
            fail(seed, chunkIndex, 'unreachable-entry');
            break;
        }

        for (let platformIndex = 1; platformIndex < mainRoute.length; platformIndex++) {
            if (!canReachPlatform(mainRoute[platformIndex - 1], mainRoute[platformIndex])) {
                fail(seed, chunkIndex, 'broken-main-route', { platform: platformIndex });
                break;
            }
        }

        const exit = chunk.getExitAnchor();
        if (!exit || exit.routeRole === 'bonus') {
            fail(seed, chunkIndex, 'invalid-exit-anchor');
            break;
        }

        validatePatternIntegrity(seed, chunk);
        previousChunk = chunk;
    }
}

const result = {
    passed: failures.length === 0,
    failureCount: failures.length,
    failures: failures.slice(0, 20),
    metrics
};

console.log(JSON.stringify(result, null, 2));
if (failures.length > 0) process.exitCode = 1;
