import { CONFIG } from '../config.js';
import { game } from '../game.js';
import { WalkerEnemy } from '../entities/enemies/WalkerEnemy.js';
import { FlyerEnemy } from '../entities/enemies/FlyerEnemy.js';
import { JumperEnemy } from '../entities/enemies/JumperEnemy.js';
import { ChaserEnemy } from '../entities/enemies/ChaserEnemy.js';
import { ShooterEnemy } from '../entities/enemies/ShooterEnemy.js';
import { Coin } from '../entities/Coin.js';
import { Modifier } from '../entities/Modifier.js';
import { Hat } from '../entities/Hat.js';
import { PATTERNS, PLATFORM_TYPES, getDifficultyConfig, selectPattern, getBiome } from './Patterns.js';

const ABSOLUTE_MAX_GAP = CONFIG.TILE_SIZE * 5.5;

// ============================================
// ENEMY TYPE SELECTION
// ============================================
function selectEnemyType(chunkIndex, platformType, rng) {
    // Todos os tipos disponíveis desde o início (chances iguais)
    const availableTypes = ['walker', 'flyer', 'jumper', 'chaser', 'shooter'];

    // Preferências baseadas no tipo de plataforma
    if (platformType === 'floating') {
        // Plataformas flutuantes preferem flyers
        const floatingPreferred = availableTypes.filter(t => t === 'flyer' || t === 'shooter');
        if (floatingPreferred.length > 0) {
            return floatingPreferred[rng.int(0, floatingPreferred.length - 1)];
        }
    }

    // Seleção aleatória com chances iguais
    return availableTypes[rng.int(0, availableTypes.length - 1)];
}

function createEnemyByType(type, x, y, platformWidth, platformY) {
    switch (type) {
        case 'walker':
            return new WalkerEnemy(x, y, platformWidth, platformY);
        case 'flyer':
            return new FlyerEnemy(x, y, platformWidth, platformY);
        case 'jumper':
            return new JumperEnemy(x, y, platformWidth, platformY);
        case 'chaser':
            return new ChaserEnemy(x, y, platformWidth, platformY);
        case 'shooter':
            return new ShooterEnemy(x, y, platformWidth, platformY);
        default:
            return new WalkerEnemy(x, y, platformWidth, platformY);
    }
}

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
            renderHeight: result.renderHeight,
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

        const biomeAllowedList = Array.isArray(this.biome.allowedTypes) && this.biome.allowedTypes.length > 0
            ? this.biome.allowedTypes
            : ['ground', 'floating'];
        const biomeAllowedSet = new Set(biomeAllowedList);

        const difficultyUnlocks = {
            moving: diffConfig.allowMoving,
            crumbling: diffConfig.allowCrumbling,
            ice: diffConfig.allowIce,
            bouncy: diffConfig.allowBouncy
        };

        const isDifficultyUnlocked = (type) => {
            if (Object.prototype.hasOwnProperty.call(difficultyUnlocks, type)) {
                return Boolean(difficultyUnlocks[type]);
            }
            return true;
        };

    // Ajusta o tipo da plataforma para respeitar o bioma e os desbloqueios de dificuldade
    const resolvePlatformType = (desiredType = 'ground') => {
            const order = [];
            const pushType = (candidate) => {
                if (candidate && !order.includes(candidate)) {
                    order.push(candidate);
                }
            };

            pushType(desiredType);
            if (desiredType !== 'floating') pushType('floating');
            if (desiredType !== 'ground') pushType('ground');
            pushType('bouncy');
            pushType('moving');
            pushType('ice');
            pushType('crumbling');

            for (const candidate of order) {
                if (!isDifficultyUnlocked(candidate)) continue;
                if (biomeAllowedSet.has(candidate)) {
                    return candidate;
                }
            }

            for (const candidate of order) {
                if (isDifficultyUnlocked(candidate)) {
                    return candidate;
                }
            }

            return 'ground';
        };

    // Aplica metadados (hitbox, render, atrito, movimento) conforme o tipo escolhido
    const applyTypeSettings = (platform, type) => {
            const settings = PLATFORM_TYPES[type] || PLATFORM_TYPES.ground;
            platform.type = type;
            platform.height = settings.hitboxHeight || tileSize * 3;
            platform.renderHeight = settings.renderHeight || platform.height;
            platform.friction = settings.friction ?? CONFIG.FRICTION;
            platform.solid = settings.solid !== false;

            if (settings.bounceForce !== undefined) {
                platform.bounceForce = settings.bounceForce;
            } else if (platform.bounceForce !== undefined) {
                delete platform.bounceForce;
            }

            if (settings.movement) {
                platform.movement = { ...settings.movement };
            } else if (platform.movement) {
                delete platform.movement;
            }

            return platform;
        };

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
            const spawnType = resolvePlatformType('ground');
            const spawnPlatform = applyTypeSettings({
                x: 0,
                y: game.height - 150,
                width: 400
            }, spawnType);
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
                    const platformType = resolvePlatformType(platDef.type || 'ground');
                    const platform = applyTypeSettings({
                        x: patternStartX + platDef.offsetX * tileSize,
                        y: clamp(patternStartY + platDef.offsetY * tileSize, minHeight, maxHeight),
                        width: platDef.width * tileSize
                    }, platformType);

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
                this.generateSimpleFallback(rng, diffConfig, lastHeight, x, startX, endX, computeGap, pickHeightNear, ensureReachable, resolvePlatformType, applyTypeSettings);
            }
        } else {
            this.generateSimpleFallback(rng, diffConfig, lastHeight, x, startX, endX, computeGap, pickHeightNear, ensureReachable, resolvePlatformType, applyTypeSettings);
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

                const floatingType = resolvePlatformType('floating');
                const newFloating = applyTypeSettings({
                    x: floatingX,
                    y: floatingY,
                    width: floatingWidth
                }, floatingType);

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

        // Adicionar chapéu com 30% de chance (apenas em chunks >= 1)
        if (this.index >= 1 && rng.next() < 0.30 && this.platforms.length > 0) {
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
                // Passar o bioma atual para o chapéu - mapeamento correto
                let biomeType = this.biome.name.toLowerCase().replace(/\s+/g, '_');

                // Validar e corrigir nomes de biomas conhecidos
                const biomeMapping = {
                    'plains': 'plains',
                    'cave': 'cave',
                    'underground_cave': 'cave',
                    'ice': 'ice',
                    'desert': 'desert',
                    'sky': 'sky',
                    'apocalypse': 'apocalypse',
                    'moon': 'moon',
                    'black_hole': 'black_hole'
                };

                biomeType = biomeMapping[biomeType] || 'plains';
                console.log(`Spawning hat in biome: ${this.biome.name} -> ${biomeType}`);
                this.hats.push(new Hat(hatX, hatY, 'collectable', biomeType));
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

            this.hats.forEach(hat => {
                allItems.push({
                    x: hat.x,
                    y: hat.y,
                    width: 20,
                    height: 20
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

    generateSimpleFallback(rng, diffConfig, seedHeight, currentX, startBoundary, endX, computeGap, pickHeightNear, ensureReachable, resolvePlatformType, applyTypeSettings) {
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

            const resolvedType = resolvePlatformType('ground');
            const platform = applyTypeSettings({
                x: platformX,
                y: platformY,
                width: platformWidth
            }, resolvedType);

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

                // Selecionar tipo de inimigo baseado na dificuldade e tipo de plataforma
                const enemyType = selectEnemyType(this.index, platform.type, rng);
                const enemy = createEnemyByType(enemyType, enemyX, enemyY, platform.width, platform.y);

                // Aplicar modificador de velocidade do bioma (se existir)
                if (this.biome.enemySpeedMultiplier && enemy.vx !== 0) {
                    enemy.vx *= this.biome.enemySpeedMultiplier;
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
                const fallbackType = resolvePlatformType('ground');
                const fallback = applyTypeSettings({
                    x: startBridge,
                    y: prevPlatform ? prevPlatform.y : clamp(seedHeight, minHeight, maxHeight),
                    width: Math.min(diffConfig.maxPlatformSize, availableWidth)
                }, fallbackType);

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
        const padding = 128;
        const viewportWidth = game.width;
        const viewportHeight = game.height;

        for (const platform of this.platforms) {
            const screenX = platform.x - game.camera.x;
            const screenY = platform.y - game.camera.y;
            const drawHeight = platform.renderHeight ?? platform.height;
            const collisionHeight = platform.height;

            if (screenX + platform.width < -padding || screenX - padding > viewportWidth) continue;
            if (screenY + drawHeight < -padding || screenY - padding > viewportHeight) continue;

            if (platform.type === 'floating') {
                this.drawFloatingPlatform(ctx, screenX, screenY, platform.width, drawHeight, collisionHeight);
            } else {
                this.drawGroundPlatform(ctx, screenX, screenY, platform.width, drawHeight);
            }
        }

        // Desenhar decorações
        for (const decor of this.decorations) {
            const screenX = decor.x - game.camera.x;
            const screenY = decor.y - game.camera.y;
            const baseSize = decor.size ?? (decor.radius ? decor.radius * 2 : CONFIG.TILE_SIZE * 4);
            const decorWidth = decor.width ?? baseSize;
            const decorHeight = decor.height ?? baseSize;

            if (screenX + decorWidth < -padding || screenX - padding > viewportWidth) continue;
            if (screenY + decorHeight < -padding || screenY - padding > viewportHeight) continue;

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
            } else if (decor.type === 'rainbow') {
                this.drawRainbow(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'light_ray') {
                this.drawLightRay(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'balloon') {
                this.drawBalloon(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'kite') {
                this.drawKite(ctx, screenX, screenY, decor.variant);
            } else if (decor.type === 'celestial_crystal') {
                this.drawCelestialCrystal(ctx, screenX, screenY, decor.variant);
            }
        }
    }

    drawGroundPlatform(ctx, x, y, width, height) {
        const tileSize = 16;
        const colors = this.biome.colors;

        // OUTLINE PRETO GROSSO (estilo cartoon) - com topo arredondado
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(x - 2, y + 8);
        ctx.lineTo(x - 2, y + height + 2);
        ctx.lineTo(x + width + 2, y + height + 2);
        ctx.lineTo(x + width + 2, y + 8);
        // Topo arredondado
        ctx.arcTo(x + width + 2, y - 2, x + width / 2, y - 2, 8);
        ctx.lineTo(x + width / 2, y - 2);
        ctx.arcTo(x - 2, y - 2, x - 2, y + 8, 8);
        ctx.closePath();
        ctx.fill();

        // Fundo base com gradiente (usar cores do bioma) - mais saturado
        const gradient = ctx.createLinearGradient(x, y, x, y + height);

        if (colors.ground && colors.groundDark) {
            gradient.addColorStop(0, colors.ground);
            gradient.addColorStop(0.5, colors.ground);
            gradient.addColorStop(1, colors.groundDark);
        } else {
            // Fallback para cores padrão (mais vibrantes)
            gradient.addColorStop(0, '#aa8800');
            gradient.addColorStop(0.5, '#885522');
            gradient.addColorStop(1, '#553311');
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Highlight sutil no lado esquerdo
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(x, y, 3, height);

        // Definir altura da camada de grama/topo
        const grassHeight = 8;

        // Camada de grama/topo (se bioma tiver) - com topo arredondado
        if (colors.grass || colors.cloud) {
            const topColor = colors.grass || colors.cloud;
            const topDark = colors.grassDark || colors.cloudDark;

            const grassGradient = ctx.createLinearGradient(x, y, x, y + grassHeight);
            grassGradient.addColorStop(0, topColor);
            grassGradient.addColorStop(1, topDark || topColor);
            ctx.fillStyle = grassGradient;

            // Desenhar retângulo com topo arredondado
            ctx.beginPath();
            ctx.moveTo(x, y + grassHeight);
            ctx.lineTo(x, y + 6);
            ctx.arcTo(x, y, x + 6, y, 6);
            ctx.lineTo(x + width - 6, y);
            ctx.arcTo(x + width, y, x + width, y + 6, 6);
            ctx.lineTo(x + width, y + grassHeight);
            ctx.closePath();
            ctx.fill();

            // Highlight no topo da grama
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(x + 4, y + 1, width - 8, 2);

            // Detalhes de grama/tufos (apenas em Plains) - mais visíveis
            if (this.biome.name === 'Plains') {
                ctx.fillStyle = topColor;
                for (let i = 0; i < width; i += 8) {
                    const tuftHeight = 4 + (i % 3);
                    // Tufinho com outline
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(x + i - 0.5, y - tuftHeight - 0.5, 4, tuftHeight + 1);

                    ctx.fillStyle = topColor;
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

    drawFloatingPlatform(ctx, x, y, width, height, collisionHeight = height) {
        // Plataformas flutuantes se adaptam ao bioma
        if (this.biome.name === 'Sky') {
            // NUVEM SÓLIDA para bioma Sky
            this.drawCloudPlatform(ctx, x, y, width, height, collisionHeight);
        } else {
            // Plataforma cristalina padrão para outros biomas
            this.drawCrystalPlatform(ctx, x, y, width, height);
        }
    }

    drawCloudPlatform(ctx, x, y, width, height, collisionHeight = height) {
        const time = Date.now() / 1000;
        const seed = Math.floor(x / 100);

        // Sombra suave embaixo da nuvem
        ctx.fillStyle = 'rgba(100, 120, 150, 0.15)';
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + height + 8, width/2 - 5, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hitbox visual para debug (outline da área real de colisão)
        // Desenhar retângulo sólido simplificado para colisão clara
        ctx.fillStyle = 'rgba(180, 200, 220, 0.3)';
    ctx.fillRect(x, y, width, collisionHeight);

        // Base da nuvem - formato orgânico com cores mais saturadas e distintas
        const cloudGradient = ctx.createLinearGradient(x, y - 5, x, y + height + 5);
        cloudGradient.addColorStop(0, '#e8f4f8');      // Azul claro suave
        cloudGradient.addColorStop(0.3, '#d4e8f0');    // Azul claro médio
        cloudGradient.addColorStop(0.7, '#c0dce8');    // Azul acinzentado
        cloudGradient.addColorStop(1, '#a8c8d8');      // Azul mais escuro
        ctx.fillStyle = cloudGradient;

        // Corpo principal (forma irregular de nuvem)
        const puffCount = Math.max(3, Math.floor(width / 40));
        for (let i = 0; i < puffCount; i++) {
            const puffX = x + (i * width / (puffCount - 1));
            const puffRadius = (width / puffCount) * (0.6 + (seed + i) % 10 / 20);
            const puffY = y + height/2 - 5 + Math.sin(time * 0.5 + i) * 2;

            ctx.beginPath();
            ctx.ellipse(puffX, puffY, puffRadius, height * 0.8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Topo da nuvem (camada extra para dar volume)
        const topGradient = ctx.createLinearGradient(x, y - 8, x, y + height * 0.4);
        topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = topGradient;

        for (let i = 0; i < puffCount; i++) {
            const puffX = x + (i * width / (puffCount - 1));
            const puffRadius = (width / puffCount) * 0.5;
            const puffY = y - 3;

            ctx.beginPath();
            ctx.ellipse(puffX, puffY, puffRadius, height * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Brilho suave no topo
        const highlightGradient = ctx.createRadialGradient(x + width/2, y, 0, x + width/2, y, width/2);
        highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
        highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlightGradient;
        ctx.beginPath();
        ctx.ellipse(x + width/2, y + 2, width/2.5, height * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Partículas de névoa ao redor
        const particleCount = Math.max(4, Math.floor(width / 25));
        for (let i = 0; i < particleCount; i++) {
            const angle = time * 0.8 + i * (Math.PI * 2 / particleCount);
            const radius = width/2 + 15 + Math.sin(time * 2 + i) * 8;
            const px = x + width/2 + Math.cos(angle) * radius;
            const py = y + height/2 + Math.sin(angle) * (height/2 + 10);
            const opacity = 0.3 + Math.sin(time * 3 + i) * 0.2;
            const size = 3 + Math.sin(time * 2.5 + i) * 2;

            ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }

        // Contorno sutil apenas
        ctx.strokeStyle = 'rgba(140, 170, 200, 0.3)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < puffCount; i++) {
            const puffX = x + (i * width / (puffCount - 1));
            const puffRadius = (width / puffCount) * (0.6 + (seed + i) % 10 / 20);
            const puffY = y + height/2 - 5;

            ctx.ellipse(puffX, puffY, puffRadius, height * 0.8, 0, 0, Math.PI * 2);
        }
        ctx.stroke();
    }

    drawCrystalPlatform(ctx, x, y, width, height) {
        // OUTLINE PRETO GROSSO (estilo cartoon) - arredondado
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.roundRect(x - 2, y - 2, width + 4, height + 4, 6);
        ctx.fill();

        // Base da plataforma com gradiente cristalino (cores mais vibrantes)
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#c4b5fd'); // Mais claro
        gradient.addColorStop(0.5, '#a78bfa'); // Roxo vibrante
        gradient.addColorStop(1, '#8b5cf6'); // Roxo médio
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, 4);
        ctx.fill();

        // Efeito de brilho/cristal (linhas diagonais mais visíveis)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        for (let i = 0; i < width; i += 15) {
            ctx.beginPath();
            ctx.moveTo(x + i, y);
            ctx.lineTo(x + i + 8, y + height);
            ctx.stroke();
        }

        // Highlight no topo (mais pronunciado)
        const topGradient = ctx.createLinearGradient(x, y, x, y + 8);
        topGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        topGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = topGradient;
        ctx.fillRect(x + 4, y, width - 8, 8);

        // Partículas brilhantes ao redor (efeito mágico) - maiores e mais vibrantes
        const time = Date.now() / 1000;
        const particleCount = Math.max(3, Math.floor(width / 30));

        for (let i = 0; i < particleCount; i++) {
            const angle = time * 1.5 + i * (Math.PI * 2 / particleCount);
            const radius = 18 + Math.sin(time * 3 + i) * 6;
            const px = x + width/2 + Math.cos(angle) * radius;
            const py = y + height/2 + Math.sin(angle) * radius;
            const opacity = 0.6 + Math.sin(time * 4 + i) * 0.3;

            // Outline preto na partícula
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();

            // Partícula colorida
            ctx.fillStyle = `rgba(196, 181, 253, ${opacity})`;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Brilho interno
            ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
            ctx.beginPath();
            ctx.arc(px - 0.5, py - 0.5, 1, 0, Math.PI * 2);
            ctx.fill();
        }

        // Borda brilhante interna
        ctx.strokeStyle = 'rgba(196, 181, 253, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, width - 2, height - 2, 3);
        ctx.stroke();
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

    // Novas decorações do bioma SKY
    drawRainbow(ctx, x, y, variant) {
        const width = 80 + variant * 20;
        const height = 40 + variant * 10;
        const colors = [
            'rgba(255, 0, 0, 0.5)',      // Vermelho
            'rgba(255, 127, 0, 0.5)',    // Laranja
            'rgba(255, 255, 0, 0.5)',    // Amarelo
            'rgba(0, 255, 0, 0.5)',      // Verde
            'rgba(0, 0, 255, 0.5)',      // Azul
            'rgba(75, 0, 130, 0.5)',     // Índigo
            'rgba(148, 0, 211, 0.5)'     // Violeta
        ];

        ctx.lineWidth = 4;
        for (let i = colors.length - 1; i >= 0; i--) {
            ctx.strokeStyle = colors[i];
            ctx.beginPath();
            ctx.arc(x + width/2, y + height, width/2 - (i * 5), height - (i * 5), Math.PI, 0, true);
            ctx.stroke();
        }

        // Brilho suave
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + width/2, y + height, width/2 + 2, height + 2, Math.PI, 0, true);
        ctx.stroke();
    }

    drawLightRay(ctx, x, y, variant) {
        const time = Date.now() / 1000;
        const opacity = 0.15 + Math.sin(time + variant) * 0.1;
        const rayWidth = 30 + variant * 15;
        const rayLength = 100 + variant * 40;

        // Raio de luz com gradiente
        const gradient = ctx.createLinearGradient(x, y - rayLength, x, y);
        gradient.addColorStop(0, `rgba(255, 255, 200, ${opacity * 0.5})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 220, ${opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(x - rayWidth/2, y - rayLength);
        ctx.lineTo(x + rayWidth/2, y - rayLength);
        ctx.lineTo(x + rayWidth * 1.5, y);
        ctx.lineTo(x - rayWidth * 1.5, y);
        ctx.closePath();
        ctx.fill();

        // Brilho central mais intenso
        const centerGradient = ctx.createLinearGradient(x, y - rayLength, x, y);
        centerGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.8})`);
        centerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = centerGradient;
        ctx.beginPath();
        ctx.moveTo(x - rayWidth/6, y - rayLength);
        ctx.lineTo(x + rayWidth/6, y - rayLength);
        ctx.lineTo(x + rayWidth/2, y);
        ctx.lineTo(x - rayWidth/2, y);
        ctx.closePath();
        ctx.fill();
    }

    drawBalloon(ctx, x, y, variant) {
        const time = Date.now() / 1000;
        const floatOffset = Math.sin(time * 2 + variant) * 4;
        const balloonY = y - 20 + floatOffset;
        const balloonColors = ['#ff6b9d', '#ffd93d', '#a78bfa'];
        const color = balloonColors[variant % 3];
        const size = 10 + variant * 2;

        // Linha (corda)
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, balloonY + size);
        ctx.stroke();

        // Balão (corpo oval)
        const balloonGradient = ctx.createRadialGradient(x - size/3, balloonY - size/3, 0, x, balloonY, size);
        balloonGradient.addColorStop(0, color);
        balloonGradient.addColorStop(0.7, color);
        balloonGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
        ctx.fillStyle = balloonGradient;

        ctx.beginPath();
        ctx.ellipse(x, balloonY, size * 0.8, size, 0, 0, Math.PI * 2);
        ctx.fill();

        // Brilho
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(x - size/3, balloonY - size/2, size/3, 0, Math.PI * 2);
        ctx.fill();

        // Nó do balão
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, balloonY + size, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawKite(ctx, x, y, variant) {
        const time = Date.now() / 1000;
        const kiteY = y - 25 + Math.sin(time * 1.5 + variant) * 5;
        const kiteX = x + Math.sin(time + variant) * 3;
        const size = 12 + variant * 3;
        const kiteColors = [
            { main: '#ff6b9d', accent: '#ff1744' },
            { main: '#ffd93d', accent: '#ffa726' },
            { main: '#4dd0e1', accent: '#0097a7' }
        ];
        const colors = kiteColors[variant % 3];

        // Linha (corda ondulante)
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        for (let i = 0; i <= 10; i++) {
            const segY = y - (i * (kiteY - y + size) / 10);
            const segX = x + Math.sin(time * 2 + i * 0.5) * 2;
            ctx.lineTo(segX, segY);
        }
        ctx.stroke();

        // Pipa (losango)
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.moveTo(kiteX, kiteY - size);              // Topo
        ctx.lineTo(kiteX + size * 0.7, kiteY);        // Direita
        ctx.lineTo(kiteX, kiteY + size);              // Baixo
        ctx.lineTo(kiteX - size * 0.7, kiteY);        // Esquerda
        ctx.closePath();
        ctx.fill();

        // Detalhes (cruz interna)
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(kiteX, kiteY - size);
        ctx.lineTo(kiteX, kiteY + size);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(kiteX - size * 0.7, kiteY);
        ctx.lineTo(kiteX + size * 0.7, kiteY);
        ctx.stroke();

        // Rabos da pipa
        const tailCount = 3;
        for (let i = 0; i < tailCount; i++) {
            const tailY = kiteY + size + 5 + i * 8;
            const tailX = kiteX + Math.sin(time * 3 + i) * 4;

            ctx.fillStyle = i % 2 === 0 ? colors.main : colors.accent;
            ctx.beginPath();
            ctx.moveTo(tailX - 3, tailY);
            ctx.lineTo(tailX, tailY + 5);
            ctx.lineTo(tailX + 3, tailY);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawCelestialCrystal(ctx, x, y, variant) {
        const time = Date.now() / 1000;
        const size = 10 + variant * 3;
        const pulse = 0.7 + Math.sin(time * 3 + variant) * 0.3;
        const crystalColors = [
            { main: '#a78bfa', glow: '#c4b5fd' },
            { main: '#4dd0e1', glow: '#80deea' },
            { main: '#ffd93d', glow: '#fff176' }
        ];
        const colors = crystalColors[variant % 3];

        // Brilho ao redor
        const glowGradient = ctx.createRadialGradient(x, y - size/2, 0, x, y - size/2, size * 1.5);
        glowGradient.addColorStop(0, `${colors.glow}${Math.floor(pulse * 0.4 * 255).toString(16).padStart(2, '0')}`);
        glowGradient.addColorStop(0.5, `${colors.glow}${Math.floor(pulse * 0.2 * 255).toString(16).padStart(2, '0')}`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(x, y - size/2, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Cristal (forma de diamante flutuante)
        const rotation = time * 0.5 + variant;
        ctx.save();
        ctx.translate(x, y - size);
        ctx.rotate(rotation);

        const crystalGradient = ctx.createLinearGradient(-size/2, -size, size/2, size);
        crystalGradient.addColorStop(0, colors.glow);
        crystalGradient.addColorStop(0.5, colors.main);
        crystalGradient.addColorStop(1, colors.glow);
        ctx.fillStyle = crystalGradient;

        ctx.beginPath();
        ctx.moveTo(0, -size);              // Topo
        ctx.lineTo(size * 0.5, 0);         // Direita
        ctx.lineTo(0, size * 0.7);         // Baixo
        ctx.lineTo(-size * 0.5, 0);        // Esquerda
        ctx.closePath();
        ctx.fill();

        // Facetas internas (detalhes)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(0, size * 0.7);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size * 0.5, 0);
        ctx.lineTo(size * 0.5, 0);
        ctx.stroke();

        // Brilho central
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(0, -size * 0.4, size * 0.15, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Partículas orbitando
        const particleCount = 3;
        for (let i = 0; i < particleCount; i++) {
            const angle = time * 2 + i * (Math.PI * 2 / particleCount);
            const radius = size * 1.2;
            const px = x + Math.cos(angle) * radius;
            const py = y - size + Math.sin(angle) * radius;
            const pOpacity = 0.5 + Math.sin(time * 4 + i) * 0.3;

            ctx.fillStyle = `rgba(255, 255, 255, ${pOpacity})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
