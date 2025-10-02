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
        this.decorations = []; // Elementos decorativos

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

        // Adicionar decorações nas plataformas
        this.platforms.forEach(platform => {
            // Apenas adicionar decorações em plataformas ground
            if (platform.type === 'ground') {
                const numDecorations = rng.int(2, 5);
                for (let i = 0; i < numDecorations; i++) {
                    const decorationType = rng.next() > 0.5 ? 'flower' : (rng.next() > 0.5 ? 'rock' : 'bush');
                    const decorX = platform.x + rng.range(10, platform.width - 10);
                    const decorY = platform.y;

                    this.decorations.push({
                        x: decorX,
                        y: decorY,
                        type: decorationType,
                        variant: rng.int(0, 2) // Variação visual (0, 1, ou 2)
                    });
                }
            }
        });

        // Adicionar modificadores (100% de chance - um por chunk)
        if (this.index >= 0) {
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

                    const modifierX = platform.x + platform.width / 2 - 10;
                    const modifierY = platform.y - 40;

                    // Verificar se não colide com outros itens
                    if (canPlaceItem(modifierX, modifierY, 20, 20, allItems)) {
                        // Modificador sorteia seu próprio tipo internamente
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
                // Plataformas flutuantes com efeito cristal/mágico
                this.drawFloatingPlatform(ctx, screenX, screenY, platform.width, platform.height);
            } else {
                // Plataformas ground com textura de terra/grama
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
            }
        });
    }

    drawGroundPlatform(ctx, x, y, width, height) {
        const tileSize = 16; // Tamanho dos "blocos" da textura

        // Fundo base com gradiente
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, '#8b6914');
        gradient.addColorStop(0.5, '#654321');
        gradient.addColorStop(1, '#3d2812');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);

        // Camada de grama no topo
        const grassHeight = 8;
        const grassGradient = ctx.createLinearGradient(x, y, x, y + grassHeight);
        grassGradient.addColorStop(0, '#52d681');
        grassGradient.addColorStop(1, '#2ecc71');
        ctx.fillStyle = grassGradient;
        ctx.fillRect(x, y, width, grassHeight);

        // Detalhes de grama (tufos)
        ctx.fillStyle = '#52d681';
        for (let i = 0; i < width; i += 8) {
            const tuftHeight = 3 + (i % 3);
            ctx.fillRect(x + i, y - tuftHeight, 3, tuftHeight);
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
}
