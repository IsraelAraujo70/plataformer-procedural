import { CONFIG } from '../config.js';
import { game } from '../game.js';
import { Enemy } from '../entities/Enemy.js';
import { Coin } from '../entities/Coin.js';
import { Modifier } from '../entities/Modifier.js';
import { Hat } from '../entities/Hat.js';
import { PATTERNS, getDifficultyConfig, selectPattern, getBiome, BIOMES } from './Patterns.js';

const ABSOLUTE_MAX_GAP = CONFIG.TILE_SIZE * 5.5;

// ============================================
// HELPERS DE COLISÃO (para geração de itens)
// ============================================

// Verifica se dois retângulos se sobrepõem (AABB collision)
function checkOverlap(x1, y1, w1, h1, x2, y2, w2, h2, margin = 10) {
    return !(x1 + w1 + margin < x2 ||
             x2 + w2 + margin < x1 ||
             y1 + h1 + margin < y2 ||
             y2 + h2 + margin < y1);
}

// Verifica se um item pode ser colocado sem colidir com existentes
function canPlaceItem(newX, newY, newW, newH, existingItems) {
    for (let item of existingItems) {
        const itemW = item.width || item.size || CONFIG.COIN_SIZE;
        const itemH = item.height || item.size || CONFIG.COIN_SIZE;

        if (checkOverlap(newX, newY, newW, newH, item.x, item.y, itemW, itemH)) {
            return false;
        }
    }
    return true;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// Verifica se uma plataforma é alcançável a partir de outra
function canReachPlatform(fromPlatform, toPlatform) {
    // Distância horizontal (do final da plataforma origem até início da destino)
    const dx = toPlatform.x - (fromPlatform.x + fromPlatform.width);

    // Se plataformas se sobrepõem horizontalmente, sempre alcançável
    if (dx < 0) return true;

    // Diferença de altura (positivo = subir, negativo = descer)
    const dy = fromPlatform.y - toPlatform.y;

    // Física do pulo (baseada nas constantes do jogo)
    // Altura máxima do pulo: v² = 2 * g * h  =>  h = v² / (2 * g)
    const jumpSpeed = Math.abs(CONFIG.JUMP_STRENGTH);
    const maxJumpHeight = (jumpSpeed * jumpSpeed) / (2 * CONFIG.GRAVITY);

    // Tempo para atingir altura máxima: t = v / g
    const timeToMaxHeight = jumpSpeed / CONFIG.GRAVITY;

    const runway = Math.max(0, fromPlatform.width - CONFIG.PLAYER_WIDTH);
    const runwayFactor = clamp(runway / (CONFIG.TILE_SIZE * 3), 0, 1);
    const horizontalSpeed = CONFIG.MOVE_SPEED * (0.55 + 0.45 * runwayFactor);

    // Distância horizontal máxima (considerando velocidade efetiva com margem de segurança)
    const rawHorizontalDist = horizontalSpeed * timeToMaxHeight * 2 * 0.9;
    const maxHorizontalDist = Math.min(rawHorizontalDist, ABSOLUTE_MAX_GAP);

    // Verificar se está dentro do alcance horizontal
    if (dx > maxHorizontalDist) return false;

    // Se está descendo (dy < 0), é sempre mais fácil
    if (dy <= 0) {
        return dx <= maxHorizontalDist;
    }

    // Se está subindo (dy > 0), verificar se consegue alcançar a altura
    // Margem de 80% da altura máxima para ser mais permissivo
    if (dy > maxJumpHeight * 0.8) {
        return false;
    }

    // Calcular se consegue alcançar tanto horizontal quanto verticalmente
    // Quanto mais alto, menos distância horizontal alcança
    const heightRatio = dy / maxJumpHeight;
    const adjustedMaxDist = maxHorizontalDist * (1 - heightRatio * 0.3);

    return dx <= Math.min(adjustedMaxDist, ABSOLUTE_MAX_GAP);
}

function getRightEdge(platform) {
    return platform.x + platform.width;
}

// ============================================
// CHUNK (Geração Procedural)
// ============================================
export class Chunk {
    constructor(index, random, previousChunk = null) {
        this.index = index;
        this.x = index * CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.modifiers = [];
        this.hats = []; // Chapéus coletáveis
        this.decorations = []; // Elementos decorativos
        this.previousChunk = previousChunk;
        this.entryPlatform = this.getEntryPlatform();

        // Determinar bioma deste chunk
        this.biome = getBiome(index);

        this.generate(random);

        this.cacheExitAnchor();
    }

    getEntryPlatform() {
        let sourcePlatforms = null;

        if (this.previousChunk && this.previousChunk.platforms && this.previousChunk.platforms.length > 0) {
            sourcePlatforms = this.previousChunk.platforms;
        } else {
            const cachedAnchor = game.chunkAnchors.get(this.index - 1);
            if (cachedAnchor) {
                return { ...cachedAnchor };
            }
        }

        if (!sourcePlatforms || sourcePlatforms.length === 0) {
            return null;
        }

        const candidates = sourcePlatforms.filter(p => p.type === 'ground');
        const source = candidates.length > 0 ? candidates : sourcePlatforms;

        return source.reduce((best, platform) => {
            if (!best) return { ...platform };

            const bestRight = getRightEdge(best);
            const currentRight = getRightEdge(platform);

            if (currentRight > bestRight) return { ...platform };
            if (currentRight === bestRight && platform.type === 'ground' && best.type !== 'ground') {
                return { ...platform };
            }

            return best;
        }, null);
    }

    cacheExitAnchor() {
        const anchor = this.getExitAnchor();
        if (anchor) {
            game.chunkAnchors.set(this.index, anchor);
        }
    }

    getExitAnchor() {
        if (!this.platforms || this.platforms.length === 0) {
            if (this.index === 0 && this.entryPlatform) {
                return { ...this.entryPlatform };
            }
            return null;
        }

        const groundPlatforms = this.platforms.filter(p => p.type === 'ground');
        const source = groundPlatforms.length > 0 ? groundPlatforms : this.platforms;

        const result = source.reduce((best, platform) => {
            if (!best) return platform;

            const bestRight = getRightEdge(best);
            const currentRight = getRightEdge(platform);

            if (currentRight > bestRight) return platform;
            if (currentRight === bestRight) {
                if (platform.type === 'ground' && best.type !== 'ground') return platform;
                if (platform.y < best.y) return platform;
            }

            return best;
        }, null);

        if (!result) return null;

        return {
            x: result.x,
            y: result.y,
            width: result.width,
            height: result.height,
            type: result.type
        };
    }

    generate(rng) {
        const tileSize = CONFIG.TILE_SIZE;
        const chunkWidth = CONFIG.CHUNK_WIDTH * tileSize;
        const startX = this.x;

        // Obter configuração de dificuldade
        const diffConfig = getDifficultyConfig(this.index);
        const difficulty = Math.min(this.index / 10, 3);

        const endX = startX + chunkWidth;
        const jumpSpeed = Math.abs(CONFIG.JUMP_STRENGTH);
        const maxJumpHeight = (jumpSpeed * jumpSpeed) / (2 * CONFIG.GRAVITY);
        const maxClimb = maxJumpHeight * 0.65;
        const maxDrop = tileSize * 6;
        const totalAirTime = (jumpSpeed / CONFIG.GRAVITY) * 2;
        const maxHorizontalReachFull = Math.min(CONFIG.MOVE_SPEED * totalAirTime * 0.9, ABSOLUTE_MAX_GAP);

        const minHeight = game.height / 3;
        const maxHeight = game.height - 100;
        const heightVariationBase = diffConfig.heightVariation + (this.biome.heightBias || 0) * tileSize;

        const computeMaxReach = (prevPlatform) => {
            if (!prevPlatform) {
                return maxHorizontalReachFull;
            }

            const runway = Math.max(0, prevPlatform.width - CONFIG.PLAYER_WIDTH);
            const runwayFactor = clamp(runway / (CONFIG.TILE_SIZE * 3), 0, 1);
            const horizontalSpeed = CONFIG.MOVE_SPEED * (0.55 + 0.45 * runwayFactor);

            return Math.min(horizontalSpeed * totalAirTime * 0.9, ABSOLUTE_MAX_GAP);
        };

        const computeGap = (prevPlatform) => {
            if (!prevPlatform) {
                const maxGapValue = Math.max(diffConfig.minGap, Math.min(diffConfig.maxGap, maxHorizontalReachFull));
                const minGapValue = Math.min(diffConfig.minGap, maxGapValue);
                return rng.range(minGapValue, maxGapValue);
            }

            const safeReach = computeMaxReach(prevPlatform);
            let minGapValue = diffConfig.minGap;
            let maxGapValue = Math.min(diffConfig.maxGap, safeReach);

            if (minGapValue > maxGapValue) {
                const adjusted = Math.max(safeReach * 0.75, diffConfig.minGap * 0.6);
                minGapValue = Math.min(diffConfig.minGap, adjusted);
                maxGapValue = Math.max(minGapValue, safeReach * 0.85);
            }

            const gap = rng.range(minGapValue, maxGapValue);
            return clamp(gap, minGapValue, maxGapValue);
        };

        const pickHeightNear = (prevPlatform) => {
            if (!prevPlatform) {
                return clamp(game.height - 150 - rng.range(-50, 50), minHeight, maxHeight);
            }

            const variation = rng.range(-heightVariationBase, heightVariationBase);
            let candidate = prevPlatform.y + variation;
            const climb = prevPlatform.y - candidate;
            if (climb > maxClimb) {
                candidate = prevPlatform.y - maxClimb;
            }
            if (climb < -maxDrop) {
                candidate = prevPlatform.y + maxDrop;
            }
            return clamp(candidate, minHeight, maxHeight);
        };

        const ensureReachable = (prevPlatform, platform) => {
            if (!prevPlatform) return true;

            const safeReach = computeMaxReach(prevPlatform);
            if (safeReach <= CONFIG.TILE_SIZE * 1.5) {
                return false;
            }

            const minXGap = Math.min(diffConfig.minGap, safeReach * 0.85);
            const minX = getRightEdge(prevPlatform) + minXGap;
            const maxXGap = Math.min(diffConfig.maxGap, safeReach);
            const maxX = Math.min(endX - diffConfig.minPlatformSize, getRightEdge(prevPlatform) + maxXGap);

            if (minX > maxX) {
                return false;
            }

            platform.x = clamp(platform.x, minX, maxX);

            let candidateY = platform.y;
            const climb = prevPlatform.y - candidateY;
            if (climb > maxClimb) {
                candidateY = prevPlatform.y - maxClimb;
            } else if (climb < -maxDrop) {
                candidateY = prevPlatform.y + maxDrop;
            }

            platform.y = clamp(candidateY, minHeight, maxHeight);

            return canReachPlatform(prevPlatform, platform);
        };

        // Altura e posição iniciais
        let lastHeight = pickHeightNear(this.entryPlatform);
        let x = this.entryPlatform ? Math.max(startX, getRightEdge(this.entryPlatform)) : startX;

        // CHUNK 0: Criar plataforma inicial garantida para spawn dos jogadores
        if (this.index === 0) {
            const spawnPlatform = {
                x: 0,
                y: game.height - 150,
                width: 400,
                height: tileSize * 3,
                type: 'ground'
            };
            this.platforms.push(spawnPlatform);

            x = spawnPlatform.x + spawnPlatform.width;
            lastHeight = spawnPlatform.y;
        }

        // Decidir se usar patterns ou geração simples
        const usePatterns = rng.next() < diffConfig.patternChance && this.index > 0;

        if (usePatterns) {
            // GERAÇÃO BASEADA EM PATTERNS
            let platformCount = 0;
            const maxPlatformsPerChunk = 15;

            while (x < endX && platformCount < maxPlatformsPerChunk) {
                const prevPlatform = this.platforms.length > 0 ? this.platforms[this.platforms.length - 1] : this.entryPlatform;
                const pattern = selectPattern(rng, difficulty);
                const firstDef = pattern.platforms[0];

                let patternStartX = x;
                let patternStartY = lastHeight;

                if (prevPlatform && firstDef) {
                    const gap = computeGap(prevPlatform);
                    const targetFirstX = getRightEdge(prevPlatform) + gap;
                    const targetFirstY = pickHeightNear(prevPlatform);
                    patternStartX = targetFirstX - firstDef.offsetX * tileSize;
                    patternStartY = targetFirstY - firstDef.offsetY * tileSize;
                }

                let placed = 0;
                let patternMaxRight = patternStartX;

                for (let index = 0; index < pattern.platforms.length && platformCount < maxPlatformsPerChunk; index++) {
                    const platDef = pattern.platforms[index];
                    const platform = {
                        x: patternStartX + platDef.offsetX * tileSize,
                        y: clamp(patternStartY + platDef.offsetY * tileSize, minHeight, maxHeight),
                        width: platDef.width * tileSize,
                        height: platDef.type === 'floating' ? tileSize : tileSize * 3,
                        type: platDef.type
                    };

                    const reachBase = placed > 0 ? this.platforms[this.platforms.length - 1] : prevPlatform;
                    if (!ensureReachable(reachBase, platform)) {
                        continue;
                    }

                    if (platform.x + platform.width > endX) {
                        platform.width = Math.max(diffConfig.minPlatformSize, endX - platform.x - tileSize);
                        if (platform.width < diffConfig.minPlatformSize) {
                            continue;
                        }
                    }

                    let collides = false;
                    for (let existingPlatform of this.platforms) {
                        if (checkOverlap(
                            platform.x, platform.y, platform.width, platform.height,
                            existingPlatform.x, existingPlatform.y, existingPlatform.width, existingPlatform.height,
                            48
                        )) {
                            collides = true;
                            break;
                        }
                    }

                    if (collides) {
                        continue;
                    }

                    this.platforms.push(platform);
                    platformCount++;
                    placed++;
                    patternMaxRight = Math.max(patternMaxRight, getRightEdge(platform));

                    if (pattern.reward === 'modifier' && pattern.rewardPlatform === index) {
                        const modX = platform.x + platform.width / 2 - 10;
                        const modY = platform.y - 40;
                        this.modifiers.push(new Modifier(modX, modY));
                    }
                }

                if (placed === 0) {
                    x += tileSize * 2;
                } else {
                    x = patternMaxRight;
                    lastHeight = this.platforms[this.platforms.length - 1].y;
                }
            }

            if (platformCount === 0) {
                this.generateSimpleFallback(rng, diffConfig, lastHeight, x, startX, endX, computeGap, pickHeightNear, ensureReachable);
            }
        } else {
            this.generateSimpleFallback(rng, diffConfig, lastHeight, x, startX, endX, computeGap, pickHeightNear, ensureReachable);
        }

        // Adicionar plataformas flutuantes (com verificação de alcançabilidade)
        if (rng.next() < diffConfig.floatingChance) {
            const numFloating = diffConfig.floatingCount;
            let floatingAttempts = 0;
            let floatingPlaced = 0;

            while (floatingPlaced < numFloating && floatingAttempts < numFloating * 10) {
                const floatingX = startX + rng.range(tileSize * 5, chunkWidth - tileSize * 5);
                const floatingY = game.height * 0.3 + rng.range(0, game.height * 0.3);
                const floatingWidth = tileSize * rng.int(2, 5);

                const newFloating = {
                    x: floatingX,
                    y: floatingY,
                    width: floatingWidth,
                    height: tileSize,
                    type: 'floating'
                };

                // Verificar se não colide com outras plataformas (margem aumentada)
                let collides = false;
                for (let platform of this.platforms) {
                    if (checkOverlap(
                        newFloating.x, newFloating.y, newFloating.width, newFloating.height,
                        platform.x, platform.y, platform.width, platform.height,
                        48 // Margem de 1.5 tiles
                    )) {
                        collides = true;
                        break;
                    }
                }

                // Verificar se é alcançável de ALGUMA plataforma
                let reachable = false;
                if (!collides && this.platforms.length > 0) {
                    // Verificar as últimas 5 plataformas (mais eficiente)
                    const platformsToCheck = this.platforms.slice(-5);

                    for (let platform of platformsToCheck) {
                        if (canReachPlatform(platform, newFloating)) {
                            reachable = true;
                            break;
                        }
                    }

                    // Se não alcançável das últimas, tentar alcançável PARA alguma plataforma futura
                    if (!reachable) {
                        for (let platform of platformsToCheck) {
                            if (canReachPlatform(newFloating, platform)) {
                                reachable = true;
                                break;
                            }
                        }
                    }
                }

                if (!collides && reachable) {
                    this.platforms.push(newFloating);
                    floatingPlaced++;

                    // 60% de chance de ter moeda/modificador
                    if (rng.next() < 0.6) {
                        const itemX = floatingX + floatingWidth / 2 - CONFIG.COIN_SIZE / 2;
                        const itemY = floatingY - tileSize * 1.5;

                        // 20% chance de modificador, senão moeda
                        if (rng.next() < 0.2 && this.modifiers.length < 2) {
                            this.modifiers.push(new Modifier(itemX, itemY));
                        } else {
                            this.coins.push(new Coin(itemX, itemY));
                        }
                    }
                }

                floatingAttempts++;
            }
        }

        // Adicionar decorações nas plataformas baseadas no bioma
        this.platforms.forEach(platform => {
            if (platform.type === 'ground' && this.biome.decorations && this.biome.decorations.length > 0) {
                const numDecorations = rng.int(1, 4);
                for (let i = 0; i < numDecorations; i++) {
                    // Escolher tipo de decoração do bioma
                    const decorationType = rng.choice(this.biome.decorations);
                    const decorX = platform.x + rng.range(10, Math.max(10, platform.width - 10));
                    const decorY = platform.y;

                    this.decorations.push({
                        x: decorX,
                        y: decorY,
                        type: decorationType,
                        variant: rng.int(0, 2)
                    });
                }
            }
        });

        // Adicionar chapéu com 15% de chance (apenas em chunks >= 1)
        if (this.index >= 1 && rng.next() < 0.15 && this.platforms.length > 0) {
            // Escolher plataforma aleatória para spawnar o chapéu
            const platform = this.platforms[rng.int(0, this.platforms.length - 1)];
            const hatX = platform.x + platform.width / 2 - 10;
            const hatY = platform.y - 40; // Um pouco acima da plataforma

            // Verificar se não colide com outros itens
            const allItems = [];

            this.coins.forEach(coin => {
                allItems.push({
                    x: coin.x,
                    y: coin.y,
                    width: CONFIG.COIN_SIZE,
                    height: CONFIG.COIN_SIZE
                });
            });

            this.enemies.forEach(enemy => {
                allItems.push({
                    x: enemy.x,
                    y: enemy.y,
                    width: CONFIG.ENEMY_SIZE,
                    height: CONFIG.ENEMY_SIZE
                });
            });

            this.modifiers.forEach(modifier => {
                allItems.push({
                    x: modifier.x,
                    y: modifier.y,
                    width: 20,
                    height: 20
                });
            });

            // Só adicionar se não colidir com outros itens
            if (canPlaceItem(hatX, hatY, 20, 20, allItems)) {
                this.hats.push(new Hat(hatX, hatY, 'collectable'));
            }
        }

        // Adicionar modificador adicional se não veio de pattern
        if (this.index >= 1 && this.modifiers.length === 0) {
            const allItems = [];

            this.coins.forEach(coin => {
                allItems.push({
                    x: coin.x,
                    y: coin.y,
                    width: CONFIG.COIN_SIZE,
                    height: CONFIG.COIN_SIZE
                });
            });

            this.enemies.forEach(enemy => {
                allItems.push({
                    x: enemy.x,
                    y: enemy.y,
                    width: CONFIG.ENEMY_SIZE,
                    height: CONFIG.ENEMY_SIZE
                });
            });

            if (this.platforms.length > 0) {
                let attempts = 0;
                let placed = false;

                while (attempts < 10 && !placed) {
                    const platform = this.platforms[rng.int(0, this.platforms.length - 1)];
                    const modifierX = platform.x + platform.width / 2 - 10;
                    const modifierY = platform.y - 40;

                    if (canPlaceItem(modifierX, modifierY, 20, 20, allItems)) {
                        this.modifiers.push(new Modifier(modifierX, modifierY));
                        placed = true;
                    }

                    attempts++;
                }
            }
        }
    }

    generateSimpleFallback(rng, diffConfig, seedHeight, currentX, startBoundary, endX, computeGap, pickHeightNear, ensureReachable) {
        const tileSize = CONFIG.TILE_SIZE;
        const maxPlatformsPerChunk = 15;
        const minHeight = game.height / 3;
        const maxHeight = game.height - 100;

        let platformCount = 0;
        let x = currentX;
        let lastHeight = seedHeight;

        while (x < endX && platformCount < maxPlatformsPerChunk) {
            const prevPlatform = this.platforms.length > 0 ? this.platforms[this.platforms.length - 1] : this.entryPlatform;

            const gap = computeGap(prevPlatform);
            let platformX = prevPlatform ? getRightEdge(prevPlatform) + gap : x;
            platformX = Math.max(platformX, startBoundary);
            if (!prevPlatform) {
                platformX = Math.max(platformX, x);
            }

            if (platformX + diffConfig.minPlatformSize >= endX) {
                break;
            }

            let platformY = prevPlatform ? pickHeightNear(prevPlatform) : clamp(lastHeight, minHeight, maxHeight);

            let platformWidth = Math.max(diffConfig.minPlatformSize, rng.range(diffConfig.minPlatformSize, diffConfig.maxPlatformSize));
            if (platformX + platformWidth > endX) {
                platformWidth = Math.max(diffConfig.minPlatformSize, endX - platformX - tileSize);
            }

            if (platformWidth < diffConfig.minPlatformSize) {
                break;
            }

            const platform = {
                x: platformX,
                y: platformY,
                width: platformWidth,
                height: tileSize * 3,
                type: 'ground'
            };

            if (!ensureReachable(prevPlatform, platform)) {
                x = platformX + tileSize;
                lastHeight = platformY;
                continue;
            }

            let collides = false;
            for (let existingPlatform of this.platforms) {
                if (checkOverlap(
                    platform.x, platform.y, platform.width, platform.height,
                    existingPlatform.x, existingPlatform.y, existingPlatform.width, existingPlatform.height,
                    48
                )) {
                    collides = true;
                    break;
                }
            }

            if (collides) {
                x = platformX + tileSize;
                lastHeight = platformY;
                continue;
            }

            this.platforms.push(platform);
            platformCount++;

            const platformItems = [];
            let hasEnemy = false;

            if (rng.next() < diffConfig.enemyChance && this.index >= 1 && platform.width > CONFIG.ENEMY_SIZE * 2) {
                const enemyX = platform.x + platform.width / 2 - CONFIG.ENEMY_SIZE / 2;
                const enemyY = platform.y - CONFIG.ENEMY_SIZE;
                const enemy = new Enemy(enemyX, enemyY, platform.width, platform.y);

                if (this.biome.enemySpeedMultiplier) {
                    enemy.speed *= this.biome.enemySpeedMultiplier;
                }

                this.enemies.push(enemy);
                platformItems.push({
                    x: enemyX,
                    y: enemyY,
                    width: CONFIG.ENEMY_SIZE,
                    height: CONFIG.ENEMY_SIZE
                });
                hasEnemy = true;
            }

            if (rng.next() < diffConfig.coinChance) {
                const numCoins = rng.int(2, 5);
                let coinsPlaced = 0;

                for (let i = 0; i < numCoins && coinsPlaced < numCoins; i++) {
                    let coinX;
                    if (hasEnemy) {
                        const zone = i % 2;
                        if (zone === 0) {
                            coinX = platform.x + rng.range(CONFIG.COIN_SIZE, platform.width * 0.4);
                        } else {
                            coinX = platform.x + rng.range(platform.width * 0.6, platform.width - CONFIG.COIN_SIZE);
                        }
                    } else {
                        coinX = platform.x + (i + 1) * (platform.width / (numCoins + 1));
                    }

                    const coinY = platform.y - tileSize * 2;

                    if (canPlaceItem(coinX, coinY, CONFIG.COIN_SIZE, CONFIG.COIN_SIZE, platformItems)) {
                        const coin = new Coin(coinX, coinY);
                        this.coins.push(coin);
                        platformItems.push({
                            x: coinX,
                            y: coinY,
                            width: CONFIG.COIN_SIZE,
                            height: CONFIG.COIN_SIZE
                        });
                        coinsPlaced++;
                    }
                }
            }

            x = getRightEdge(platform);
            lastHeight = platform.y;
        }

        if (platformCount === 0) {
            const prevPlatform = this.platforms.length > 0 ? this.platforms[this.platforms.length - 1] : this.entryPlatform;
            const startBridge = Math.max(prevPlatform ? getRightEdge(prevPlatform) + diffConfig.minGap : currentX, startBoundary);
            const availableWidth = endX - startBridge - tileSize;

            if (availableWidth >= diffConfig.minPlatformSize) {
                const fallback = {
                    x: startBridge,
                    y: prevPlatform ? prevPlatform.y : clamp(seedHeight, minHeight, maxHeight),
                    width: Math.min(diffConfig.maxPlatformSize, availableWidth),
                    height: tileSize * 3,
                    type: 'ground'
                };

                if (ensureReachable(prevPlatform, fallback)) {
                    let collides = false;
                    for (let existingPlatform of this.platforms) {
                        if (checkOverlap(
                            fallback.x, fallback.y, fallback.width, fallback.height,
                            existingPlatform.x, existingPlatform.y, existingPlatform.width, existingPlatform.height,
                            48
                        )) {
                            collides = true;
                            break;
                        }
                    }

                    if (!collides) {
                        this.platforms.push(fallback);
                    }
                }
            }
        }
    }

    draw(ctx) {
        this.platforms.forEach(platform => {
            const screenX = platform.x - game.camera.x;
            const screenY = platform.y - game.camera.y;

            if (platform.type === 'floating') {
                this.drawFloatingPlatform(ctx, screenX, screenY, platform.width, platform.height);
            } else {
                this.drawGroundPlatform(ctx, screenX, screenY, platform.width, platform.height);
            }
        });

        // Desenhar decorações
        this.decorations.forEach(decor => {
            const screenX = decor.x - game.camera.x;
            const screenY = decor.y - game.camera.y;

            if (decor.type === 'flower') {
                this.drawFlower(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'rock') {
                this.drawRock(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'bush') {
                this.drawBush(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'stalactite') {
                this.drawStalactite(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'crystal') {
                this.drawCrystal(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'mushroom') {
                this.drawMushroom(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'snowflake') {
                this.drawSnowflake(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'icicle') {
                this.drawIcicle(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'cloud') {
                this.drawCloud(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'snowpile') {
                this.drawSnowpile(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'bird') {
                this.drawBird(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'star') {
                this.drawStar(ctx, screenX, screenY, decor.variant);
            }
        });
    }

    drawGroundPlatform(ctx, x, y, width, height) {
        const tileSize = 16;
        const colors = this.biome.colors;

        // Fundo base com gradiente (usar cores do bioma)
        const gradient = ctx.createLinearGradient(x, y, x, y + height);

        if (colors.ground && colors.groundDark) {
            gradient.addColorStop(0, colors.ground);
            gradient.addColorStop(0.5, colors.ground);
            gradient.addColorStop(1, colors.groundDark);
        } else {
            // Fallback para cores padrão
            gradient.addColorStop(0, '#8b6914');
            gradient.addColorStop(0.5, '#654321');
            gradient.addColorStop(1, '#3d2812');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Definir altura da camada de grama/topo
        const grassHeight = 8;

        // Camada de grama/topo (se bioma tiver)
        if (colors.grass || colors.cloud) {
            const topColor = colors.grass || colors.cloud;
            const topDark = colors.grassDark || colors.cloudDark;

            const grassGradient = ctx.createLinearGradient(x, y, x, y + grassHeight);
            grassGradient.addColorStop(0, topColor);
            grassGradient.addColorStop(1, topDark || topColor);
            ctx.fillStyle = grassGradient;
            ctx.fillRect(x, y, width, grassHeight);

            // Detalhes de grama/tufos (apenas em Plains)
            if (this.biome.name === 'Plains') {
                ctx.fillStyle = topColor;
                for (let i = 0; i < width; i += 8) {
                    const tuftHeight = 3 + (i % 3);
                    ctx.fillRect(x + i, y - tuftHeight, 3, tuftHeight);
                }
            }
        }

        // Textura de blocos na lateral (padrão de tijolos)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;

        // Linhas horizontais
        for (let row = grassHeight; row < height; row += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, y + row);
            ctx.lineTo(x + width, y + row);
            ctx.stroke();
        }

        // Linhas verticais (padrão tijolo alternado)
        for (let row = 0; row < Math.ceil(height / tileSize); row++) {
            const offset = (row % 2) * (tileSize / 2);
            for (let col = offset; col < width; col += tileSize) {
                ctx.beginPath();
                ctx.moveTo(x + col, y + grassHeight + row * tileSize);
                ctx.lineTo(x + col, y + grassHeight + Math.min((row + 1) * tileSize, height));
                ctx.stroke();
            }
        }

        // Pontos de luz aleatórios (pequenas pedras/minerais brilhantes)
        ctx.fillStyle = 'rgba(255, 215, 0, 0.4)';
        const seed = Math.floor(x / 100);
        for (let i = 0; i < 3; i++) {
            const px = x + ((seed * 73 + i * 137) % width);
            const py = y + grassHeight + ((seed * 97 + i * 211) % (height - grassHeight));
            ctx.fillRect(px, py, 2, 2);
        }

        // Sombra na borda inferior
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x, y + height - 2, width, 2);
    }

    drawFloatingPlatform(ctx, x, y, width, height) {
        // Base da plataforma com gradiente cristalino
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#a78bfa');
        gradient.addColorStop(0.5, '#8b5cf6');
        gradient.addColorStop(1, '#7c3aed');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Efeito de brilho/cristal (linhas diagonais)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        for (let i = 0; i < width; i += 20) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i + 10, y + height);
            ctx.stroke();
        }

        // Highlight no topo
        const topGradient = ctx.createLinearGradient(x, y, x, y + 6);
        topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = topGradient;
        ctx.fillRect(x, y, width, 6);

        // Partículas brilhantes ao redor (efeito mágico)
        const time = Date.now() / 1000;
        const particleCount = Math.floor(width / 40);
        ctx.fillStyle = '#c4b5fd';

        for (let i = 0; i < particleCount; i++) {
            const angle = time + i * (Math.PI * 2 / particleCount);
            const radius = 15 + Math.sin(time * 2 + i) * 5;
            const px = x + width/2 + Math.cos(angle) * radius;
            const py = y + height/2 + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Borda brilhante
        ctx.strokeStyle = '#c4b5fd';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, width, height);
    }

    drawFlower(ctx, x, y, variant) {
        // Haste
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - 8);
        ctx.stroke();

        // Flor (cores diferentes por variante)
        const colors = [
            ['#ff6b9d', '#ff1744'], // Rosa
            ['#ffd93d', '#ffa726'], // Amarela
            ['#a78bfa', '#8b5cf6']  // Roxa
        ];
        const [color1, color2] = colors[variant];

        // Pétalas
        ctx.fillStyle = color1;
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2 / 5) - Math.PI / 2;
            const px = x + Math.cos(angle) * 3;
            const py = y - 8 + Math.sin(angle) * 3;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Centro
        ctx.fillStyle = color2;
        ctx.beginPath();
        ctx.arc(x, y - 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawRock(ctx, x, y, variant) {
        // Pedras de diferentes tamanhos
        const sizes = [
            { w: 8, h: 6 },
            { w: 10, h: 7 },
            { w: 6, h: 5 }
        ];
        const size = sizes[variant];

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x - size.w/2 + 1, y + 1, size.w, 2);

        // Pedra com gradiente
        const gradient = ctx.createLinearGradient(x - size.w/2, y - size.h, x + size.w/2, y);
        gradient.addColorStop(0, '#95a5a6');
        gradient.addColorStop(1, '#7f8c8d');
        ctx.fillStyle = gradient;

        // Forma irregular da pedra
        ctx.beginPath();
        ctx.moveTo(x - size.w/2, y - 2);
        ctx.lineTo(x - 1, y - size.h);
        ctx.lineTo(x + size.w/2, y - 3);
        ctx.lineTo(x + size.w/2 - 1, y);
        ctx.lineTo(x - size.w/2, y);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(x - 1, y - size.h + 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBush(ctx, x, y, variant) {
        // Arbustos de diferentes tamanhos
        const sizes = [12, 14, 10];
        const size = sizes[variant];

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, size/2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Arbusto (3 círculos para dar volume)
        const colors = ['#1e7d45', '#27ae60', '#2ecc71'];

        ctx.fillStyle = colors[0];
        ctx.beginPath();
        ctx.arc(x - 3, y - 6, size/2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors[1];
        ctx.beginPath();
        ctx.arc(x + 3, y - 6, size/2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors[2];
        ctx.beginPath();
        ctx.arc(x, y - 8, size/2.2, 0, Math.PI * 2);
        ctx.fill();
    }

    // Decorações do bioma CAVE
    drawStalactite(ctx, x, y, variant) {
        const heights = [12, 16, 10];
        const height = heights[variant];

        // Sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();

        // Estalactite com gradiente
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#7f8c8d');
        gradient.addColorStop(1, '#34495e');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 2);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x - 1, y + 2);
        ctx.closePath();
        ctx.fill();
    }

    drawCrystal(ctx, x, y, variant) {
        const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd'];
        const sizes = [8, 10, 6];
        const size = sizes[variant];

        // Brilho ao redor
        ctx.fillStyle = `${colors[variant]}40`;
        ctx.beginPath();
        ctx.arc(x, y - size/2, size * 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Cristal
        ctx.fillStyle = colors[variant];
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x, y - size/4);
        ctx.lineTo(x - size/2, y);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.moveTo(x - 1, y - size * 0.7);
        ctx.lineTo(x + 1, y - size * 0.7);
        ctx.lineTo(x, y - size * 0.5);
        ctx.closePath();
        ctx.fill();
    }

    drawMushroom(ctx, x, y, variant) {
        const colors = ['#e74c3c', '#e67e22', '#9b59b6'];
        const sizes = [8, 10, 7];
        const size = sizes[variant];

        // Caule
        ctx.fillStyle = '#ecf0f1';
        ctx.fillRect(x - 2, y - size, 4, size);

        // Chapéu
        ctx.fillStyle = colors[variant];
        ctx.beginPath();
        ctx.ellipse(x, y - size, size/2, size/3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pontos brancos no chapéu
        ctx.fillStyle = '#ecf0f1';
        for (let i = 0; i < 3; i++) {
            const px = x + (i - 1) * 3;
            const py = y - size - 1;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // Decorações do bioma ICE
    drawSnowflake(ctx, x, y, variant) {
        const sizes = [6, 8, 5];
        const size = sizes[variant];

        ctx.strokeStyle = '#ecf0f1';
        ctx.lineWidth = 1.5;

        // 6 raios do floco
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI / 3);
            ctx.beginPath();
            ctx.moveTo(x, y - size);
            ctx.lineTo(x + Math.cos(angle) * size, y - size + Math.sin(angle) * size);
            ctx.stroke();
        }

        // Centro brilhante
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y - size, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawIcicle(ctx, x, y, variant) {
        const heights = [10, 14, 8];
        const height = heights[variant];

        // Gelo com gradiente
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#ecf0f1');
        gradient.addColorStop(1, '#3498db');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(x - 3, y);
        ctx.lineTo(x + 3, y);
        ctx.lineTo(x, y + height);
        ctx.closePath();
        ctx.fill();

        // Brilho
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 2);
        ctx.lineTo(x, y + 8);
        ctx.lineTo(x - 1, y + 2);
        ctx.closePath();
        ctx.fill();
    }

    // Decorações do bioma SKY
    drawCloud(ctx, x, y, variant) {
        const sizes = [12, 16, 10];
        const size = sizes[variant];

        ctx.fillStyle = 'rgba(236, 240, 241, 0.8)';

        // 3 círculos formando nuvem
        ctx.beginPath();
        ctx.arc(x - size/3, y - 5, size/2.5, 0, Math.PI * 2);
        ctx.arc(x, y - 7, size/2, 0, Math.PI * 2);
        ctx.arc(x + size/3, y - 5, size/2.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSnowpile(ctx, x, y, variant) {
        const sizes = [10, 14, 8];
        const size = sizes[variant];

        // Pilha de neve (semi-círculo)
        ctx.fillStyle = '#ecf0f1';
        ctx.beginPath();
        ctx.arc(x, y, size/2, 0, Math.PI, true);
        ctx.fill();

        // Brilho no topo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, size/4, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBird(ctx, x, y, variant) {
        const time = Date.now() / 500;
        const wingFlap = Math.sin(time + variant) * 2;

        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;

        // Asa esquerda
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.quadraticCurveTo(x - 4, y - 8 + wingFlap, x - 6, y - 6);
        ctx.stroke();

        // Asa direita
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.quadraticCurveTo(x + 4, y - 8 + wingFlap, x + 6, y - 6);
        ctx.stroke();

        // Corpo (ponto)
        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.arc(x, y - 6, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawStar(ctx, x, y, variant) {
        const sizes = [4, 6, 5];
        const size = sizes[variant];
        const time = Date.now() / 1000;
        const twinkle = 0.5 + Math.sin(time * 3 + variant) * 0.5;

        ctx.fillStyle = `rgba(255, 215, 0, ${twinkle})`;

        // Estrela de 5 pontas
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            const px = x + Math.cos(angle) * size;
            const py = y - 8 + Math.sin(angle) * size;

            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }

            // Ponto interno (para formar estrela)
            const innerAngle = angle + Math.PI / 5;
            const innerPx = x + Math.cos(innerAngle) * (size / 2);
            const innerPy = y - 8 + Math.sin(innerAngle) * (size / 2);
            ctx.lineTo(innerPx, innerPy);
        }
        ctx.closePath();
        ctx.fill();

        // Brilho central
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y - 8, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}
