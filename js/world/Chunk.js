import { CONFIG } from '../config.js';
import { game } from '../game.js';
import { Enemy } from '../entities/Enemy.js';
import { Coin } from '../entities/Coin.js';
import { Modifier } from '../entities/Modifier.js';
import { PATTERNS, getDifficultyConfig, selectPattern, getBiome, BIOMES } from './Patterns.js';

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

    // Distância horizontal máxima (considerando velocidade de movimento)
    // Com margem de 50% para dar mais liberdade ao jogador
    const maxHorizontalDist = CONFIG.MOVE_SPEED * timeToMaxHeight * 2 * 1.5;

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

    return dx <= adjustedMaxDist;
}

// ============================================
// CHUNK (Geração Procedural)
// ============================================
export class Chunk {
    constructor(index, random) {
        this.index = index;
        this.x = index * CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE;
        this.platforms = [];
        this.coins = [];
        this.enemies = [];
        this.modifiers = [];
        this.decorations = []; // Elementos decorativos

        // Determinar bioma deste chunk
        this.biome = getBiome(index);

        this.generate(random);
    }

    generate(rng) {
        const tileSize = CONFIG.TILE_SIZE;
        const chunkWidth = CONFIG.CHUNK_WIDTH * tileSize;
        const startX = this.x;

        // Obter configuração de dificuldade
        const diffConfig = getDifficultyConfig(this.index);
        const difficulty = Math.min(this.index / 10, 3);

        // Altura inicial
        let lastHeight = game.height - 150 - rng.range(-50, 50);
        let x = startX;

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

            const gap = rng.range(tileSize * 3, tileSize * 5);
            x = spawnPlatform.width + gap;
            lastHeight = spawnPlatform.y + rng.range(-tileSize * 2, tileSize * 2);
        }

        // Decidir se usar patterns ou geração simples
        const usePatterns = rng.next() < diffConfig.patternChance && this.index > 0;

        if (usePatterns) {
            // GERAÇÃO BASEADA EM PATTERNS
            let platformCount = 0;
            const maxPlatformsPerChunk = 15;

            while (x < startX + chunkWidth && platformCount < maxPlatformsPerChunk) {
                const pattern = selectPattern(rng, difficulty);
                const patternStartX = x;
                const patternStartY = lastHeight;

                // Aplicar pattern
                pattern.platforms.forEach((platDef, index) => {
                    // Limite de plataformas por chunk
                    if (platformCount >= maxPlatformsPerChunk) return;

                    const platform = {
                        x: patternStartX + platDef.offsetX * tileSize,
                        y: patternStartY + platDef.offsetY * tileSize,
                        width: platDef.width * tileSize,
                        height: platDef.type === 'floating' ? tileSize : tileSize * 3,
                        type: platDef.type
                    };

                    // Verificar se plataforma é alcançável (se não for a primeira do pattern)
                    if (index > 0 && this.platforms.length > 0) {
                        const prevPlatform = this.platforms[this.platforms.length - 1];
                        let attempts = 0;

                        // Tentar ajustar posição até ser alcançável (máx 5 tentativas)
                        while (!canReachPlatform(prevPlatform, platform) && attempts < 5) {
                            // Calcular distância atual
                            const dx = platform.x - (prevPlatform.x + prevPlatform.width);

                            // Reduzir distância horizontal OU altura vertical
                            if (attempts % 2 === 0 && dx > tileSize * 1.5) {
                                // Só aproximar se distância > 1.5 tiles
                                platform.x -= tileSize;
                            } else {
                                // Ajustar altura (alternar entre subir e descer)
                                const direction = Math.floor(attempts / 2) % 2 === 0 ? -1 : 1;
                                platform.y += direction * tileSize;
                            }
                            attempts++;
                        }

                        // Se ainda não alcançável após ajustes, descartar esta plataforma
                        if (!canReachPlatform(prevPlatform, platform)) {
                            return; // Pular esta plataforma
                        }
                    }

                    // Verificar colisão com plataformas existentes
                    let collides = false;
                    for (let existingPlatform of this.platforms) {
                        if (checkOverlap(
                            platform.x, platform.y, platform.width, platform.height,
                            existingPlatform.x, existingPlatform.y, existingPlatform.width, existingPlatform.height,
                            48 // Margem de segurança de 1.5 tiles
                        )) {
                            collides = true;
                            break;
                        }
                    }

                    // Só adicionar se não colidir
                    if (!collides) {
                        this.platforms.push(platform);
                        platformCount++;
                    }

                    // Se este pattern tem recompensa, adicionar
                    if (pattern.reward === 'modifier' && pattern.rewardPlatform === index) {
                        const modX = platform.x + platform.width / 2 - 10;
                        const modY = platform.y - 40;
                        this.modifiers.push(new Modifier(modX, modY));
                    }
                });

                // Atualizar posição e altura
                // Espaçamento forçado: próximo pattern começa 1.5x a largura do anterior
                x = patternStartX + (pattern.width * tileSize * 1.5);

                if (this.platforms.length > 0) {
                    lastHeight = this.platforms[this.platforms.length - 1].y;
                }

                // Gap adicional após pattern
                const gap = rng.range(diffConfig.minGap, diffConfig.maxGap);
                x += gap;
            }
        } else {
            // GERAÇÃO SIMPLES (MELHORADA)
            let platformCount = 0;
            const maxPlatformsPerChunk = 15;

            while (x < startX + chunkWidth && platformCount < maxPlatformsPerChunk) {
                const plateauWidth = Math.max(
                    diffConfig.minPlatformSize,
                    rng.range(diffConfig.minPlatformSize, diffConfig.maxPlatformSize)
                );

                const platform = {
                    x: x,
                    y: lastHeight,
                    width: plateauWidth,
                    height: tileSize * 3,
                    type: 'ground'
                };

                // Verificar overlap com plataforma anterior (com margem de segurança)
                let shouldSkip = false;
                if (this.platforms.length > 0) {
                    const lastPlatform = this.platforms[this.platforms.length - 1];

                    if (checkOverlap(
                        platform.x, platform.y, platform.width, platform.height,
                        lastPlatform.x, lastPlatform.y, lastPlatform.width, lastPlatform.height,
                        48 // Margem de 1.5 tiles
                    )) {
                        // Tentar ajustar altura
                        if (lastHeight < lastPlatform.y) {
                            lastHeight = lastPlatform.y - tileSize * 4;
                        } else {
                            lastHeight = lastPlatform.y + lastPlatform.height + tileSize;
                        }
                        platform.y = lastHeight;

                        // Verificar novamente se ainda há overlap após ajuste
                        if (checkOverlap(
                            platform.x, platform.y, platform.width, platform.height,
                            lastPlatform.x, lastPlatform.y, lastPlatform.width, lastPlatform.height,
                            48
                        )) {
                            // Se ainda sobrepõe, pular esta posição
                            x += tileSize * 3;
                            shouldSkip = true;
                        }
                    }
                }

                // Só adicionar se não deve pular
                if (!shouldSkip) {
                    this.platforms.push(platform);
                    platformCount++;

                // Array para rastrear itens nesta plataforma (evitar colisões)
                const platformItems = [];

                // Adicionar inimigo com chance baseada em dificuldade
                let hasEnemy = false;
                if (rng.next() < diffConfig.enemyChance && this.index >= 1 && plateauWidth > CONFIG.ENEMY_SIZE * 2) {
                    const enemyX = x + plateauWidth / 2 - CONFIG.ENEMY_SIZE / 2;
                    const enemyY = lastHeight - CONFIG.ENEMY_SIZE;
                    const enemy = new Enemy(enemyX, enemyY, plateauWidth, lastHeight);

                    // Aplicar multiplicador de velocidade do bioma (se existir)
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

                // Adicionar moedas com chance baseada em dificuldade
                if (rng.next() < diffConfig.coinChance) {
                    const numCoins = rng.int(2, 5);
                    let coinsPlaced = 0;

                    for (let i = 0; i < numCoins && coinsPlaced < numCoins; i++) {
                        let coinX;
                        if (hasEnemy) {
                            const zone = i % 2;
                            if (zone === 0) {
                                coinX = x + rng.range(CONFIG.COIN_SIZE, plateauWidth * 0.4);
                            } else {
                                coinX = x + rng.range(plateauWidth * 0.6, plateauWidth - CONFIG.COIN_SIZE);
                            }
                        } else {
                            coinX = x + (i + 1) * (plateauWidth / (numCoins + 1));
                        }

                        const coinY = lastHeight - tileSize * 2;

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

                    x += plateauWidth;

                    // Gap entre plataformas (baseado em config de dificuldade)
                    const gap = rng.range(diffConfig.minGap, diffConfig.maxGap);
                    x += gap;

                    // Próxima altura (com variação aumentada)
                    const heightVariation = diffConfig.heightVariation + (this.biome.heightBias || 0) * tileSize;
                    lastHeight += rng.range(-heightVariation, heightVariation);

                    // Limites de altura
                    lastHeight = Math.max(game.height / 3, Math.min(game.height - 100, lastHeight));
                }
            }
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
