import { game } from './game.js';
import { CONFIG } from './config.js';
import { Random } from './utils/Random.js';
import { Chunk } from './world/Chunk.js';

// ============================================
// DEV MODE - Funções
// ============================================

/**
 * Aplica um modificador específico via Dev Mode
 * @param {string} type - Tipo do modificador (jump, speed, shield, etc.)
 */
export function applyDevModifier(type) {
    const duration = 600; // 10 segundos fixos para testes

    // Swap é especial: executar UMA VEZ antes do loop de jogadores
    if (type === 'swap') {
        if (game.twoPlayerMode && game.player && game.player2) {
            const tempX = game.player.x;
            const tempY = game.player.y;
            const tempVX = game.player.vx;
            const tempVY = game.player.vy;

            game.player.x = game.player2.x;
            game.player.y = game.player2.y;
            game.player.vx = game.player2.vx;
            game.player.vy = game.player2.vy;

            game.player2.x = tempX;
            game.player2.y = tempY;
            game.player2.vx = tempVX;
            game.player2.vy = tempVY;

            if (window.createParticles) {
                window.createParticles(game.player.x + game.player.width / 2, game.player.y + game.player.height / 2, '#ff8c00', 30);
                window.createParticles(game.player2.x + game.player2.width / 2, game.player2.y + game.player2.height / 2, '#ff8c00', 30);
            }
        }
        return; // Swap executado, não continuar com o forEach
    }

    const players = [game.player];

    // Em modo 2P, aplicar em ambos
    if (game.twoPlayerMode && game.player2) {
        players.push(game.player2);
    }

    players.forEach(player => {
        switch(type) {
            case 'jump':
                player.jumpBoost = 1.4;
                player.jumpBoostTime = duration;
                player.jumpBoostMaxTime = duration;
                break;
            case 'speed':
                player.speedBoost = 1.5;
                player.speedBoostTime = duration;
                player.speedBoostMaxTime = duration;
                break;
            case 'shield':
                player.shield = true;
                player.shieldTime = duration;
                player.shieldMaxTime = duration;
                break;
            case 'reverse':
                player.reverseControls = true;
                player.reverseControlsTime = duration;
                player.reverseControlsMaxTime = duration;
                break;
            case 'ice':
                player.icyFloor = true;
                player.icyFloorTime = duration;
                player.icyFloorMaxTime = duration;
                break;
            case 'doublejump':
                player.doubleJumpEnabled = true;
                player.doubleJumpTime = duration;
                player.doubleJumpMaxTime = duration;
                player.hasDoubleJump = true;
                break;
            case 'magnet':
                player.magnetActive = true;
                player.magnetTime = duration;
                player.magnetMaxTime = duration;
                break;
            case 'tiny':
                player.tinyPlayer = true;
                player.tinyPlayerTime = duration;
                player.tinyPlayerMaxTime = duration;
                player.width = CONFIG.PLAYER_WIDTH * 0.5;
                player.height = CONFIG.PLAYER_HEIGHT * 0.5;
                break;
            case 'heavy':
                player.heavy = true;
                player.heavyTime = duration;
                player.heavyMaxTime = duration;
                break;
            case 'bouncy':
                player.bouncy = true;
                player.bouncyTime = duration;
                player.bouncyMaxTime = duration;
                break;
            case 'timewarp':
                player.timeWarp = true;
                player.timeWarpTime = duration;
                player.timeWarpMaxTime = duration;
                break;
        }
    });

    const modifierNames = {
        jump: 'Jump Boost',
        speed: 'Speed Boost',
        shield: 'Shield',
        reverse: 'Reverse Controls',
        ice: 'Icy Floor',
        doublejump: 'Double Jump',
        magnet: 'Magnet',
        tiny: 'Tiny Player',
        heavy: 'Heavy',
        bouncy: 'Bouncy',
        timewarp: 'Time Warp',
        swap: 'Swap'
    };

    console.log(`✨ Applied: ${modifierNames[type] || type} (10s)`);
}

export function toggleDevMode() {
    game.devMode.enabled = !game.devMode.enabled;

    if (game.devMode.enabled) {
        console.log('🛠️ DEV MODE ACTIVATED');
        // Enable invincibility and noclip by default
        game.devMode.invincible = true;
        game.devMode.noclip = true;
        game.devMode.showHitboxes = false;
        game.devMode.showGrid = false;
    } else {
        console.log('DEV MODE DEACTIVATED');
        game.devMode.noclip = false;
        game.devMode.invincible = false;
        game.devMode.gravityEnabled = true;
    }
}

export function handleDevModeKeys(key) {
    if (!game.devMode.enabled) return;

    switch(key.toLowerCase()) {
        case 'h': // Toggle Hitboxes
            game.devMode.showHitboxes = !game.devMode.showHitboxes;
            console.log('Hitboxes:', game.devMode.showHitboxes ? 'ON' : 'OFF');
            break;

        case 'g': // Toggle Gravity
            game.devMode.gravityEnabled = !game.devMode.gravityEnabled;
            console.log('Gravity:', game.devMode.gravityEnabled ? 'ON' : 'OFF');
            break;

        case 'f': // Toggle Noclip/Fly
            game.devMode.noclip = !game.devMode.noclip;
            console.log('Fly/Noclip:', game.devMode.noclip ? 'ON' : 'OFF');
            break;

        case 'i': // Toggle Invincible
            game.devMode.invincible = !game.devMode.invincible;
            console.log('Invincible:', game.devMode.invincible ? 'ON' : 'OFF');
            break;

        case 'm': // Teleport forward
            game.player.x += 500;
            console.log('Teleport +500px');
            break;

        case 'r': // Reset position
            game.player.x = 100;
            game.player.y = 100;
            console.log('Position reset');
            break;

        case 'n': // Force generate next chunk
            const nextChunk = Math.floor(game.player.x / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE)) + 1;
            if (!game.chunks.has(nextChunk)) {
                const chunkRandom = new Random(game.seed + nextChunk * 1000);
                const previousChunk = game.chunks.get(nextChunk - 1) || null;
                const chunk = new Chunk(nextChunk, chunkRandom, previousChunk);
                game.chunks.set(nextChunk, chunk);
                game.coins.push(...chunk.coins);
                game.enemies.push(...chunk.enemies);
                game.modifiers.push(...chunk.modifiers);
                console.log('Chunk', nextChunk, 'generated manually');
            }
            break;

        case 'b': // Toggle grid
            game.devMode.showGrid = !game.devMode.showGrid;
            console.log('Grid:', game.devMode.showGrid ? 'ON' : 'OFF');
            break;

        case '=':
        case '+': // Increase speed
            game.devMode.flySpeed = Math.min(30, game.devMode.flySpeed + 2);
            console.log('Fly speed:', game.devMode.flySpeed);
            break;

        case '-':
        case '_': // Decrease speed
            game.devMode.flySpeed = Math.max(2, game.devMode.flySpeed - 2);
            console.log('Fly speed:', game.devMode.flySpeed);
            break;

        case 'x': // Toggle Modifier Menu
            game.devMode.modifierMenuOpen = !game.devMode.modifierMenuOpen;
            console.log('Modifier Menu:', game.devMode.modifierMenuOpen ? 'OPEN' : 'CLOSED');
            break;

        case 'o': // Add Hat (+1)
            [game.player, game.player2].filter(p => p).forEach(player => {
                if (player.hatCount < player.maxHats) {
                    player.hatCount++;
                    console.log(`Player ${player.playerNumber} Hats: ${player.hatCount}/${player.maxHats}`);
                    if (window.createFloatingText) {
                        window.createFloatingText('+1 HAT!', player.x + player.width / 2, player.y - 20, '#ffd700');
                    }
                } else {
                    console.log(`Player ${player.playerNumber} already at MAX HATS (${player.maxHats})`);
                }
            });
            break;

        case 'l': // Remove Hat (-1)
            [game.player, game.player2].filter(p => p).forEach(player => {
                if (player.hatCount > 0) {
                    player.hatCount--;
                    console.log(`Player ${player.playerNumber} Hats: ${player.hatCount}/${player.maxHats}`);
                    if (window.createFloatingText) {
                        window.createFloatingText('-1 HAT!', player.x + player.width / 2, player.y - 20, '#ff6b6b');
                    }
                } else {
                    console.log(`Player ${player.playerNumber} has NO HATS`);
                }
            });
            break;

        case ']': // Next Page
            if (game.devMode.modifierMenuOpen) {
                game.devMode.modifierMenuPage = (game.devMode.modifierMenuPage + 1) % 2;
                console.log('Menu Page:', game.devMode.modifierMenuPage + 1);
            }
            break;

        // Página 1: Modificadores 1-10
        case '1':
            if (game.devMode.modifierMenuOpen) {
                if (game.devMode.modifierMenuPage === 0) applyDevModifier('jump');
                else applyDevModifier('timewarp');
            }
            break;
        case '2':
            if (game.devMode.modifierMenuOpen) {
                if (game.devMode.modifierMenuPage === 0) applyDevModifier('speed');
                else applyDevModifier('swap');
            }
            break;
        case '3':
            if (game.devMode.modifierMenuOpen) {
                if (game.devMode.modifierMenuPage === 0) applyDevModifier('shield');
            }
            break;
        case '4':
            if (game.devMode.modifierMenuOpen && game.devMode.modifierMenuPage === 0) {
                applyDevModifier('reverse');
            }
            break;
        case '5':
            if (game.devMode.modifierMenuOpen && game.devMode.modifierMenuPage === 0) {
                applyDevModifier('ice');
            }
            break;
        case '6':
            if (game.devMode.modifierMenuOpen && game.devMode.modifierMenuPage === 0) {
                applyDevModifier('doublejump');
            }
            break;
        case '7':
            if (game.devMode.modifierMenuOpen && game.devMode.modifierMenuPage === 0) {
                applyDevModifier('magnet');
            }
            break;
        case '8':
            if (game.devMode.modifierMenuOpen && game.devMode.modifierMenuPage === 0) {
                applyDevModifier('tiny');
            }
            break;
        case '9':
            if (game.devMode.modifierMenuOpen && game.devMode.modifierMenuPage === 0) {
                applyDevModifier('heavy');
            }
            break;
        case '0':
            if (game.devMode.modifierMenuOpen && game.devMode.modifierMenuPage === 0) {
                applyDevModifier('bouncy');
            }
            break;
    }
}

export function drawModifierMenu(ctx) {
    if (!game.devMode.enabled || !game.devMode.modifierMenuOpen) return;

    const menuWidth = 500;
    const menuHeight = 450;
    const menuX = (game.width - menuWidth) / 2;
    const menuY = (game.height - menuHeight) / 2;

    ctx.save();

    // Background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
    ctx.fillRect(menuX, menuY, menuWidth, menuHeight);

    // Border
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);

    // Title
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚡ MODIFIER MENU ⚡', menuX + menuWidth / 2, menuY + 35);

    // Modifiers list
    const modifiers = [
        // Página 1
        [
            { key: '1', icon: '⬆️', name: 'Jump Boost', color: '#00d9ff' },
            { key: '2', icon: '⚡', name: 'Speed Boost', color: '#00ff88' },
            { key: '3', icon: '🛡️', name: 'Shield', color: '#ffaa00' },
            { key: '4', icon: '🔄', name: 'Reverse Controls', color: '#ff0066' },
            { key: '5', icon: '❄️', name: 'Icy Floor', color: '#66ffff' },
            { key: '6', icon: '⏫', name: 'Double Jump', color: '#9d00ff' },
            { key: '7', icon: '🧲', name: 'Magnet', color: '#ffd700' },
            { key: '8', icon: '🔻', name: 'Tiny Player', color: '#ff1493' },
            { key: '9', icon: '⬇️', name: 'Heavy', color: '#8b4513' },
            { key: '0', icon: '⚾', name: 'Bouncy', color: '#ff69b4' }
        ],
        // Página 2
        [
            { key: '1', icon: '⏰', name: 'Time Warp', color: '#9370db' },
            { key: '2', icon: '🔀', name: 'Swap (2P only)', color: '#ff8c00' }
        ]
    ];

    // Page indicator (only show if there are multiple pages)
    if (modifiers.length > 1) {
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`Page ${game.devMode.modifierMenuPage + 1}/${modifiers.length}`, menuX + menuWidth / 2, menuY + 60);
    }

    const currentPage = modifiers[game.devMode.modifierMenuPage];
    const startY = menuY + 90;
    const lineHeight = 32;

    currentPage.forEach((mod, index) => {
        const y = startY + index * lineHeight;

        // Key background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(menuX + 20, y - 18, 30, 26);

        // Key number
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(mod.key, menuX + 35, y);

        // Icon
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(mod.icon, menuX + 60, y);

        // Name
        ctx.fillStyle = mod.color;
        ctx.font = 'bold 16px Arial';
        ctx.fillText(mod.name, menuX + 95, y);
    });

    // Instructions
    const instructY = menuY + menuHeight - 60;
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press 1-9 / 0 to activate modifier', menuX + menuWidth / 2, instructY);
    ctx.fillStyle = '#ffff00';
    ctx.fillText('[ ] ] Next Page  •  [ X ] Close Menu', menuX + menuWidth / 2, instructY + 25);

    ctx.restore();
}

export function drawDevModeUI(ctx) {
    if (!game.devMode.enabled) return;

    // Painel de informações
    if (game.devMode.showInfo) {
        ctx.save();

        // Fundo do painel (aumentado para acomodar nova linha de chapéus)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(10, 10, 320, 370);

        // Borda
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 320, 370);

        // Text
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('🛠️ DEV MODE ACTIVE', 20, 35);

        ctx.strokeStyle = '#00ffff';
        ctx.beginPath();
        ctx.moveTo(20, 45);
        ctx.lineTo(310, 45);
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '12px monospace';
        let y = 65;
        const lineHeight = 18;

        ctx.fillText(`Pos: (${Math.floor(game.player.x)}, ${Math.floor(game.player.y)})`, 20, y); y += lineHeight;
        ctx.fillText(`Vel: (${game.player.vx.toFixed(1)}, ${game.player.vy.toFixed(1)})`, 20, y); y += lineHeight;
        ctx.fillText(`Chunk: ${Math.floor(game.player.x / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE))}`, 20, y); y += lineHeight;
        ctx.fillText(`Chunks Loaded: ${game.chunks.size}`, 20, y); y += lineHeight;
        ctx.fillText(`Enemies: ${game.enemies.filter(e => e.alive).length}/${game.enemies.length}`, 20, y); y += lineHeight;
        ctx.fillText(`Coins: ${game.coins.filter(c => !c.collected).length}/${game.coins.length}`, 20, y); y += lineHeight;
        ctx.fillText(`Modifiers: ${game.modifiers.filter(m => !m.collected).length}/${game.modifiers.length}`, 20, y); y += lineHeight;
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`🎩 Hats: ${game.player.hatCount}/${game.player.maxHats}`, 20, y); y += lineHeight;
        ctx.fillStyle = '#ffffff';

        y += 10;
        ctx.strokeStyle = '#555555';
        ctx.beginPath();
        ctx.moveTo(20, y - 5);
        ctx.lineTo(310, y - 5);
        ctx.stroke();

        ctx.fillStyle = game.devMode.noclip ? '#00ff00' : '#ff0000';
        ctx.fillText(`[F] Fly: ${game.devMode.noclip ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.invincible ? '#00ff00' : '#ff0000';
        ctx.fillText(`[I] Invincible: ${game.devMode.invincible ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.gravityEnabled ? '#00ff00' : '#ff0000';
        ctx.fillText(`[G] Gravity: ${game.devMode.gravityEnabled ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.showHitboxes ? '#00ff00' : '#ff0000';
        ctx.fillText(`[H] Hitboxes: ${game.devMode.showHitboxes ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        ctx.fillStyle = game.devMode.showGrid ? '#00ff00' : '#ff0000';
        ctx.fillText(`[B] Grid: ${game.devMode.showGrid ? 'ON' : 'OFF'}`, 20, y); y += lineHeight;

        y += 10;
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`[M] Teleport  [R] Reset`, 20, y); y += lineHeight;
        ctx.fillText(`[+/-] Speed (${game.devMode.flySpeed})`, 20, y); y += lineHeight;
        ctx.fillStyle = '#ffd700';
        ctx.fillText(`[O] +Hat  [L] -Hat`, 20, y); y += lineHeight;
        ctx.fillStyle = '#00ff00';
        ctx.fillText(`[X] Modifier Menu`, 20, y); y += lineHeight;
        ctx.fillStyle = '#ffff00';
        ctx.fillText(`[F3] Exit Dev Mode`, 20, y);

        ctx.restore();
    }

    // Desenhar grid
    if (game.devMode.showGrid) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 0, 0.2)';
        ctx.lineWidth = 1;

        // Grid vertical (chunks)
        const startChunk = Math.floor(game.camera.x / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = startChunk + 5;

        for (let i = startChunk; i <= endChunk; i++) {
            const x = i * CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE - game.camera.x;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, game.height);
            ctx.stroke();

            // Número do chunk
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.font = '20px monospace';
            ctx.fillText(`Chunk ${i}`, x + 10, 30);
        }

        ctx.restore();
    }

    // Desenhar hitboxes
    if (game.devMode.showHitboxes) {
        ctx.save();
        ctx.lineWidth = 2;

        // Player hitbox
        ctx.strokeStyle = '#00ffff';
        ctx.strokeRect(
            game.player.x - game.camera.x,
            game.player.y - game.camera.y,
            game.player.width,
            game.player.height
        );

        // Enemies hitboxes
        game.enemies.filter(e => e.alive).forEach(enemy => {
            ctx.strokeStyle = '#ff0000';
            ctx.strokeRect(
                enemy.x - game.camera.x,
                enemy.y - game.camera.y,
                enemy.width,
                enemy.height
            );
        });

        // Coins hitboxes
        game.coins.filter(c => !c.collected).forEach(coin => {
            ctx.strokeStyle = '#ffff00';
            ctx.strokeRect(
                coin.x - game.camera.x,
                coin.y - game.camera.y,
                coin.width,
                coin.height
            );
        });

        // Modifiers hitboxes
        game.modifiers.filter(m => !m.collected).forEach(modifier => {
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(
                modifier.x - game.camera.x,
                modifier.y - game.camera.y,
                modifier.width,
                modifier.height
            );
        });

        // Platforms hitboxes
        game.chunks.forEach(chunk => {
            chunk.platforms.forEach(platform => {
                ctx.strokeStyle = '#ffffff';
                ctx.globalAlpha = 0.3;
                ctx.strokeRect(
                    platform.x - game.camera.x,
                    platform.y - game.camera.y,
                    platform.width,
                    platform.height
                );
            });
        });

        ctx.restore();
    }

    // Desenhar Modifier Menu (por cima de tudo)
    drawModifierMenu(ctx);
}
