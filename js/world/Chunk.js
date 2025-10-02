import { CONFIG } from '../config.js';
import { game } from '../game.js';
import { Enemy } from '../entities/Enemy.js';
import { Coin } from '../entities/Coin.js';
import { Modifier } from '../entities/Modifier.js';

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

        this.generate(random);
    }

    generate(rng) {
        const tileSize = CONFIG.TILE_SIZE;
        const chunkWidth = CONFIG.CHUNK_WIDTH * tileSize;
        const startX = this.x;

        // Dificuldade baseada no índice do chunk
        const difficulty = Math.min(this.index / 10, 3);

        // Dificuldade progressiva para tamanho das plataformas
        // Reduz de 8 tiles até 1.5x o tamanho do jogador ao longo de 20 chunks
        const minPlatformSize = CONFIG.PLAYER_WIDTH * 1.5; // 36 pixels (1.5x jogador)
        const maxPlatformSize = tileSize * 8; // 256 pixels
        const progressionRate = Math.min(this.index / 20, 1); // 0 a 1 ao longo de 20 chunks (mais rápido!)

        // Interpolar entre max e min baseado na progressão
        const currentMaxSize = maxPlatformSize - (maxPlatformSize - minPlatformSize) * progressionRate;
        const currentMinSize = Math.max(minPlatformSize, tileSize * 3 - (tileSize * 1.5 * progressionRate));

        // Gerar terreno base
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

            // Adicionar gap após a plataforma inicial antes de gerar próximas
            const gap = rng.range(tileSize * 3, tileSize * 5);
            x = spawnPlatform.width + gap; // Próxima plataforma começa após gap
            lastHeight = spawnPlatform.y + rng.range(-tileSize * 2, tileSize * 2); // Variar altura
        }

        while (x < startX + chunkWidth) {
            // Tamanho do próximo platô (progressivamente menor)
            const plateauWidth = Math.max(
                minPlatformSize,
                rng.range(currentMinSize, currentMaxSize)
            );

            // Criar plataforma
            const platform = {
                x: x,
                y: lastHeight,
                width: plateauWidth,
                height: tileSize * 3,
                type: 'ground'
            };

            // Verificar se não colide com a plataforma anterior (casos extremos de altura)
            let canPlace = true;
            if (this.platforms.length > 0) {
                const lastPlatform = this.platforms[this.platforms.length - 1];
                // Apenas verificar se estão muito próximas horizontalmente
                if (Math.abs(platform.x - lastPlatform.x) < plateauWidth + lastPlatform.width) {
                    if (checkOverlap(
                        platform.x, platform.y, platform.width, platform.height,
                        lastPlatform.x, lastPlatform.y, lastPlatform.width, lastPlatform.height,
                        0 // Sem margem, apenas detectar overlap real
                    )) {
                        // Se colidir, ajustar altura para não sobrepor
                        if (lastHeight < lastPlatform.y) {
                            lastHeight = lastPlatform.y - tileSize * 4; // Forçar ficar acima
                        } else {
                            lastHeight = lastPlatform.y + lastPlatform.height + tileSize; // Forçar ficar abaixo
                        }
                        platform.y = lastHeight;
                    }
                }
            }

            this.platforms.push(platform);

            // Array para rastrear itens nesta plataforma (evitar colisões)
            const platformItems = [];

            // Adicionar inimigo primeiro (começa no chunk 1, 50% de chance)
            let hasEnemy = false;
            if (rng.next() > 0.5 && this.index >= 1 && plateauWidth > CONFIG.ENEMY_SIZE * 2) {
                const enemyX = x + plateauWidth / 2 - CONFIG.ENEMY_SIZE / 2;
                const enemyY = lastHeight - CONFIG.ENEMY_SIZE;
                const enemy = new Enemy(enemyX, enemyY, plateauWidth, lastHeight);
                this.enemies.push(enemy);
                // Adicionar ao rastreador de colisões
                platformItems.push({
                    x: enemyX,
                    y: enemyY,
                    width: CONFIG.ENEMY_SIZE,
                    height: CONFIG.ENEMY_SIZE
                });
                hasEnemy = true;
            }

            // Adicionar moedas na plataforma (evitando inimigo)
            if (rng.next() > 0.5) {
                const numCoins = rng.int(2, 5);
                let coinsPlaced = 0;

                // Tentar colocar moedas
                for (let i = 0; i < numCoins && coinsPlaced < numCoins; i++) {
                    // Se tem inimigo, evitar centro (usar laterais)
                    let coinX;
                    if (hasEnemy) {
                        // Dividir plataforma em zonas laterais
                        const zone = i % 2; // Alterna entre esquerda e direita
                        if (zone === 0) {
                            // Zona esquerda (0-40%)
                            coinX = x + rng.range(CONFIG.COIN_SIZE, plateauWidth * 0.4);
                        } else {
                            // Zona direita (60-100%)
                            coinX = x + rng.range(plateauWidth * 0.6, plateauWidth - CONFIG.COIN_SIZE);
                        }
                    } else {
                        // Sem inimigo, distribuir uniformemente
                        coinX = x + (i + 1) * (plateauWidth / (numCoins + 1));
                    }

                    const coinY = lastHeight - tileSize * 2;

                    // Verificar se não colide com outros itens
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

            // Gap entre plataformas
            const gap = rng.range(
                tileSize * (2 + difficulty * 0.5),
                tileSize * (4 + difficulty)
            );
            x += gap;

            // Próxima altura (limitada para ser alcançável)
            const maxHeightDiff = tileSize * 2; // Diferença máxima de altura
            lastHeight += rng.range(-maxHeightDiff, maxHeightDiff);

            // Limites de altura
            lastHeight = Math.max(game.height / 3, Math.min(game.height - 100, lastHeight));
        }

        // Adicionar algumas plataformas flutuantes (sem sobreposição)
        if (rng.next() > 0.6) {
            const numFloating = rng.int(1, 3);
            let floatingAttempts = 0;
            let floatingPlaced = 0;

            while (floatingPlaced < numFloating && floatingAttempts < numFloating * 5) {
                const floatingX = startX + rng.range(tileSize * 5, chunkWidth - tileSize * 5);
                const floatingY = game.height * 0.3 + rng.range(0, game.height * 0.3);
                const floatingWidth = tileSize * rng.int(3, 6);

                const newFloating = {
                    x: floatingX,
                    y: floatingY,
                    width: floatingWidth,
                    height: tileSize,
                    type: 'floating'
                };

                // Verificar se não colide com outras plataformas
                let collides = false;
                for (let platform of this.platforms) {
                    // Adicionar margem de segurança de 20px
                    if (checkOverlap(
                        newFloating.x, newFloating.y, newFloating.width, newFloating.height,
                        platform.x, platform.y, platform.width, platform.height,
                        20
                    )) {
                        collides = true;
                        break;
                    }
                }

                if (!collides) {
                    this.platforms.push(newFloating);
                    floatingPlaced++;

                    // Adicionar apenas 1 item por plataforma flutuante
                    // Escolher aleatoriamente: moeda OU nada (50% de chance)
                    if (rng.next() > 0.5) {
                        const itemX = floatingX + floatingWidth / 2 - CONFIG.COIN_SIZE / 2;
                        const itemY = floatingY - tileSize * 1.5;

                        // Sempre moeda em plataforma flutuante
                        this.coins.push(new Coin(itemX, itemY));
                    }
                }

                floatingAttempts++;
            }
        }

        // Adicionar modificadores com frequência (50% de chance por chunk)
        if (rng.next() > 0.50 && this.index >= 0) {
            // Criar lista de todos os itens já colocados (para verificar colisões)
            const allItems = [];

            // Adicionar todas as moedas
            this.coins.forEach(coin => {
                allItems.push({
                    x: coin.x,
                    y: coin.y,
                    width: CONFIG.COIN_SIZE,
                    height: CONFIG.COIN_SIZE
                });
            });

            // Adicionar todos os inimigos
            this.enemies.forEach(enemy => {
                allItems.push({
                    x: enemy.x,
                    y: enemy.y,
                    width: CONFIG.ENEMY_SIZE,
                    height: CONFIG.ENEMY_SIZE
                });
            });

            // Tentar encontrar uma plataforma válida (sem inimigos)
            if (this.platforms.length > 0) {
                let attempts = 0;
                let placed = false;

                while (attempts < 5 && !placed) {
                    const platform = this.platforms[rng.int(0, this.platforms.length - 1)];

                    // Escolher tipo de modificador aleatoriamente
                    const type = rng.next() > 0.5 ? 'jump' : 'speed';
                    const modifierX = platform.x + platform.width / 2 - 10;
                    const modifierY = platform.y - 40;

                    // Verificar se não colide com outros itens
                    if (canPlaceItem(modifierX, modifierY, 20, 20, allItems)) {
                        this.modifiers.push(new Modifier(modifierX, modifierY, type));
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

            // Cor baseada no tipo
            if (platform.type === 'floating') {
                ctx.fillStyle = '#8b5cf6';
            } else {
                ctx.fillStyle = '#2ecc71';
            }

            ctx.fillRect(screenX, screenY, platform.width, platform.height);

            // Borda superior mais clara
            ctx.fillStyle = platform.type === 'floating' ? '#a78bfa' : '#52d681';
            ctx.fillRect(screenX, screenY, platform.width, 4);
        });
    }
}
