import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// PLAYER
// ============================================
export class Player {
    constructor(x, y, playerNumber = 1) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = CONFIG.PLAYER_WIDTH;
        this.height = CONFIG.PLAYER_HEIGHT;
        this.grounded = false;
        this.jumping = false;
        this.invulnerable = false;
        this.invulnerableTime = 0;
        this.jumpBoost = 1;
        this.jumpBoostTime = 0;
        this.jumpBoostMaxTime = 0;
        this.speedBoost = 1;
        this.speedBoostTime = 0;
        this.speedBoostMaxTime = 0;
        this.shield = false;
        this.shieldTime = 0;
        this.shieldMaxTime = 0;
        this.reverseControls = false;
        this.reverseControlsTime = 0;
        this.reverseControlsMaxTime = 0;
        this.icyFloor = false;
        this.icyFloorTime = 0;
        this.icyFloorMaxTime = 0;
        this.doubleJumpEnabled = false;
        this.doubleJumpTime = 0;
        this.doubleJumpMaxTime = 0;
        this.hasDoubleJump = false;
        this.magnetActive = false;
        this.magnetTime = 0;
        this.magnetMaxTime = 0;
        this.tinyPlayer = false;
        this.tinyPlayerTime = 0;
        this.tinyPlayerMaxTime = 0;
        this.heavy = false;
        this.heavyTime = 0;
        this.heavyMaxTime = 0;
        this.bouncy = false;
        this.bouncyTime = 0;
        this.bouncyMaxTime = 0;
        this.timeWarp = false;
        this.timeWarpTime = 0;
        this.timeWarpMaxTime = 0;

        // Multiplayer: definir número do jogador e controles
        this.playerNumber = playerNumber;
        this.color = playerNumber === 1 ? '#00d9ff' : '#ff6b6b';
        this.controls = playerNumber === 1 ?
            { left: 'a', right: 'd', up: 'w' } :
            { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp' };

        // Stats individuais por jogador
        this.lives = 3;
        this.score = 0;

        // Sistema de checkpoint
        this.lastSafeX = x;
        this.lastSafeY = y;

        // Animação de caminhada
        this.animFrame = 0;
        this.animCounter = 0;
        this.animSpeed = 4; // Frames de jogo entre cada frame de animação (mais rápido = mais fluido)
        this.facingRight = true;

        // Animação de morte
        this.dying = false;
        this.deathAnimTime = 0;
        this.deathAnimDuration = 60; // 1 segundo a 60fps
    }

    update() {
        // Atualizar animação de morte
        if (this.dying) {
            this.deathAnimTime++;

            // Efeito de queda e rotação
            this.vy += CONFIG.GRAVITY * 0.5;
            this.y += this.vy;
            this.vx *= 0.95; // Desacelerar horizontalmente
            this.x += this.vx;

            // Quando a animação terminar, marcar como completamente morto
            if (this.deathAnimTime >= this.deathAnimDuration) {
                this.completelyDead = true;

                // Disparar game over se necessário
                if (this.shouldTriggerGameOver) {
                    game.state = 'gameover';
                    if (window.showGameOver) {
                        window.showGameOver();
                    }
                }
            }
            return;
        }

        // Jogador morto não pode se mover
        if (this.lives <= 0) {
            return;
        }

        // Atualizar modificadores
        if (this.jumpBoostTime > 0) {
            this.jumpBoostTime--;
            if (this.jumpBoostTime <= 0) {
                this.jumpBoost = 1;
                this.jumpBoostMaxTime = 0;
            }
        }

        if (this.speedBoostTime > 0) {
            this.speedBoostTime--;
            if (this.speedBoostTime <= 0) {
                this.speedBoost = 1;
                this.speedBoostMaxTime = 0;
            }
        }

        if (this.shieldTime > 0) {
            this.shieldTime--;
            if (this.shieldTime <= 0) {
                this.shield = false;
                this.shieldMaxTime = 0;
            }
        }

        if (this.reverseControlsTime > 0) {
            this.reverseControlsTime--;
            if (this.reverseControlsTime <= 0) {
                this.reverseControls = false;
                this.reverseControlsMaxTime = 0;
            }
        }

        if (this.icyFloorTime > 0) {
            this.icyFloorTime--;
            if (this.icyFloorTime <= 0) {
                this.icyFloor = false;
                this.icyFloorMaxTime = 0;
            }
        }

        if (this.doubleJumpTime > 0) {
            this.doubleJumpTime--;
            if (this.doubleJumpTime <= 0) {
                this.doubleJumpEnabled = false;
                this.doubleJumpMaxTime = 0;
                this.hasDoubleJump = false;
            }
        }

        if (this.magnetTime > 0) {
            this.magnetTime--;
            if (this.magnetTime <= 0) {
                this.magnetActive = false;
                this.magnetMaxTime = 0;
            }
        }

        if (this.tinyPlayerTime > 0) {
            this.tinyPlayerTime--;
            if (this.tinyPlayerTime <= 0) {
                this.tinyPlayer = false;
                this.tinyPlayerMaxTime = 0;
                // Restaurar tamanho original
                this.width = CONFIG.PLAYER_WIDTH;
                this.height = CONFIG.PLAYER_HEIGHT;
            } else if (this.tinyPlayer) {
                // Manter tamanho reduzido enquanto ativo
                this.width = CONFIG.PLAYER_WIDTH * 0.5;
                this.height = CONFIG.PLAYER_HEIGHT * 0.5;
            }
        }

        if (this.heavyTime > 0) {
            this.heavyTime--;
            if (this.heavyTime <= 0) {
                this.heavy = false;
                this.heavyMaxTime = 0;
            }
        }

        if (this.bouncyTime > 0) {
            this.bouncyTime--;
            if (this.bouncyTime <= 0) {
                this.bouncy = false;
                this.bouncyMaxTime = 0;
            }
        }

        if (this.timeWarpTime > 0) {
            this.timeWarpTime--;
            if (this.timeWarpTime <= 0) {
                this.timeWarp = false;
                this.timeWarpMaxTime = 0;
            }
        }

        // DEV MODE: Controles especiais
        if (game.devMode.enabled && game.devMode.noclip) {
            const flySpeed = game.devMode.flySpeed;

            // Voo livre (ignora física)
            this.vx = 0;
            this.vy = 0;

            if (game.keys[this.controls.left]) {
                this.x -= flySpeed;
            }
            if (game.keys[this.controls.right]) {
                this.x += flySpeed;
            }
            if (game.keys[this.controls.up]) {
                this.y -= flySpeed;
            }
            if (game.keys['s'] || game.keys['ArrowDown']) {
                this.y += flySpeed;
            }

            // Não aplicar gravidade ou colisões no noclip
            return;
        }

        // Controles normais (com inversão se reverseControls ativo)
        let moveSpeed = CONFIG.MOVE_SPEED * this.speedBoost;
        if (game.devMode.enabled) moveSpeed *= 2; // Velocidade dobrada em dev mode

        const leftKey = this.reverseControls ? this.controls.right : this.controls.left;
        const rightKey = this.reverseControls ? this.controls.left : this.controls.right;

        if (game.keys[leftKey]) {
            this.vx = -moveSpeed;
            this.facingRight = false;
        } else if (game.keys[rightKey]) {
            this.vx = moveSpeed;
            this.facingRight = true;
        } else {
            // Aplicar fricção (reduzida se icyFloor ativo)
            this.vx *= this.icyFloor ? 0.98 : CONFIG.FRICTION;
        }

        // Atualizar animação de caminhada (quando está se movendo)
        if (Math.abs(this.vx) > 0.5) {
            const currentAnimSpeed = this.speedBoost > 1 ? Math.floor(this.animSpeed / 1.5) : this.animSpeed;
            this.animCounter++;
            if (this.animCounter >= currentAnimSpeed) {
                this.animFrame = (this.animFrame + 1) % 4;
                this.animCounter = 0;
            }
        } else {
            this.animFrame = 0;
            this.animCounter = 0;
        }

        // Pulo individual (W ou Seta para cima)
        if (game.keys[this.controls.up] && this.grounded && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost;
            if (this.heavy) jumpStrength *= 0.7; // Heavy reduz força do pulo em 30%
            if (game.devMode.enabled) jumpStrength *= 1.5; // Super pulo em dev mode
            this.vy = jumpStrength;
            this.jumping = true;
            this.grounded = false;
        }

        // Pulo conjunto (ESPAÇO faz ambos pularem)
        if (game.keys[' '] && this.grounded && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost;
            if (this.heavy) jumpStrength *= 0.7; // Heavy reduz força do pulo em 30%
            if (game.devMode.enabled) jumpStrength *= 1.5;
            this.vy = jumpStrength;
            this.jumping = true;
            this.grounded = false;
        }

        // Double Jump (pulo no ar se modificador ativo)
        if (game.keys[this.controls.up] && !this.grounded && this.doubleJumpEnabled && this.hasDoubleJump && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost * 0.9; // Double jump um pouco mais fraco
            if (game.devMode.enabled) jumpStrength *= 1.5;
            this.vy = jumpStrength;
            this.hasDoubleJump = false; // Consumir o double jump
            this.jumping = true;
        }

        if (game.keys[' '] && !this.grounded && this.doubleJumpEnabled && this.hasDoubleJump && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost * 0.9;
            if (game.devMode.enabled) jumpStrength *= 1.5;
            this.vy = jumpStrength;
            this.hasDoubleJump = false;
            this.jumping = true;
        }

        if (!game.keys[this.controls.up] && !game.keys[' ']) {
            this.jumping = false;
        }

        // Resetar double jump ao tocar o chão
        if (this.grounded && this.doubleJumpEnabled) {
            this.hasDoubleJump = true;
        }

        // Gravidade (pode ser desativada em dev mode)
        if (game.devMode.gravityEnabled) {
            let gravity = CONFIG.GRAVITY;
            if (this.heavy) gravity *= 1.7; // Heavy aumenta gravidade em 70%
            this.vy += gravity;
        }

        // Limites de velocidade
        if (this.vy > 20) this.vy = 20;

        // Atualizar posição
        this.x += this.vx;
        this.y += this.vy;

        // Colisões com terreno
        const wasGrounded = this.grounded; // Salvar estado ANTES de resetar
        const previousVY = this.vy; // Salvar vy ANTES de handleCollisions zerar
        this.grounded = false;
        this.handleCollisions();

        // Bouncy: dar bounce ao colidir com o chão (usar vy anterior)
        if (this.bouncy && this.grounded && !wasGrounded && previousVY > 2) {
            this.vy = -previousVY * 0.5; // Bounce com 50% da velocidade de queda
        }

        // Salvar última posição segura quando está no chão
        if (this.grounded) {
            this.lastSafeX = this.x;
            this.lastSafeY = this.y;
        }

        // Limites do mundo - respawn ao invés de game over imediato
        if (this.y > game.height + 100) {
            this.respawn();
        }

        // Invulnerabilidade
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
        }

        // Sistema de magnetismo - atrair moedas e modificadores próximos
        if (this.magnetActive) {
            this.attractNearbyItems();
        }

        // Atualizar distância e pontuar (baseado no jogador mais à direita)
        const rightmostX = game.twoPlayerMode && game.player2 ?
            Math.max(game.player.x, game.player2.x) :
            this.x;

        const newDistance = Math.floor(rightmostX / CONFIG.TILE_SIZE);
        if (newDistance > game.distance) {
            const distanceDiff = newDistance - game.distance;
            // Jogador mais à direita ganha os pontos de distância
            if (game.twoPlayerMode && game.player2) {
                if (game.player.x > game.player2.x) {
                    game.player.score += distanceDiff;
                } else {
                    game.player2.score += distanceDiff;
                }
            } else {
                this.score += distanceDiff;
            }
            game.distance = newDistance;
        }
        game.difficulty = Math.floor(game.distance / 100); // Aumenta a cada 100 tiles
    }

    handleCollisions() {
        const startChunk = Math.floor((this.x - 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((this.x + 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            chunk.platforms.forEach(platform => {
                if (this.intersects(platform)) {
                    // Detectar de que lado veio a colisão
                    const overlapLeft = (this.x + this.width) - platform.x;
                    const overlapRight = (platform.x + platform.width) - this.x;
                    const overlapTop = (this.y + this.height) - platform.y;
                    const overlapBottom = (platform.y + platform.height) - this.y;

                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    // Colisão vertical
                    if (minOverlap === overlapTop && this.vy > 0) {
                        this.y = platform.y - this.height;
                        this.vy = 0;
                        this.grounded = true;
                    }
                    // Head bump
                    else if (minOverlap === overlapBottom && this.vy < 0) {
                        this.y = platform.y + platform.height;
                        this.vy = 0;
                    }
                    // Colisão horizontal
                    else if (minOverlap === overlapLeft) {
                        this.x = platform.x - this.width;
                        this.vx = 0;
                    }
                    else if (minOverlap === overlapRight) {
                        this.x = platform.x + platform.width;
                        this.vx = 0;
                    }
                }
            });
        }
    }

    intersects(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }


    attractNearbyItems() {
        const magnetRange = 150; // Raio de atração em pixels
        const attractionSpeed = 8; // Velocidade de atração

        // Calcular centro do jogador
        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;

        // Verificar chunks próximos
        const startChunk = Math.floor((this.x - magnetRange) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((this.x + magnetRange) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            // Atrair moedas
            chunk.coins.forEach(coin => {
                if (coin.collected) return;

                const coinCenterX = coin.x + coin.width / 2;
                const coinCenterY = coin.y + coin.height / 2;

                const dx = playerCenterX - coinCenterX;
                const dy = playerCenterY - coinCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Se dentro do alcance do ímã, mover em direção ao jogador
                if (distance < magnetRange && distance > 5) {
                    const moveX = (dx / distance) * attractionSpeed;
                    const moveY = (dy / distance) * attractionSpeed;
                    coin.x += moveX;
                    coin.y += moveY;
                }
            });

            // Atrair modificadores (opcional, pode comentar se achar muito OP)
            chunk.modifiers.forEach(modifier => {
                if (modifier.collected) return;

                const modCenterX = modifier.x + modifier.width / 2;
                const modCenterY = modifier.y + modifier.height / 2;

                const dx = playerCenterX - modCenterX;
                const dy = playerCenterY - modCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Se dentro do alcance do ímã, mover em direção ao jogador
                if (distance < magnetRange && distance > 5) {
                    const moveX = (dx / distance) * attractionSpeed;
                    const moveY = (dy / distance) * attractionSpeed;
                    modifier.x += moveX;
                    modifier.y += moveY;
                }
            });
        }
    }

    respawn() {
        if (game.devMode.enabled && game.devMode.invincible) return; // Dev Mode: não perde vida

        this.lives--;

        // Atualizar HUD apropriado
        if (this.playerNumber === 1) {
            document.getElementById('p1-lives').textContent = this.lives;
        } else {
            document.getElementById('p2-lives').textContent = this.lives;
        }

        // Game over se não tem mais vidas
        if (this.lives <= 0) {
            this.die();
            return;
        }

        // Respawn na última posição segura
        this.x = this.lastSafeX;
        this.y = this.lastSafeY;
        this.vx = 0;
        this.vy = 0;

        // Invulnerabilidade temporária
        this.invulnerable = true;
        this.invulnerableTime = 120; // 2 segundos a 60fps

        // Efeito visual de respawn
        if (window.createParticles) {
            window.createParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 30);
        }
        if (window.createFloatingText) {
            window.createFloatingText('RESPAWN!', this.x + this.width / 2, this.y, this.color);
        }
    }

    takeDamage() {
        if (this.invulnerable) return;
        if (game.devMode.enabled && game.devMode.invincible) return; // Dev Mode: invencível

        // Shield absorve o dano
        if (this.shield) {
            this.shield = false;
            this.shieldTime = 0;
            this.shieldMaxTime = 0;

            // Efeito visual de shield quebrado
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffaa00', 20);
            }
            if (window.createFloatingText) {
                window.createFloatingText('SHIELD!', this.x + this.width / 2, this.y, '#ffaa00');
            }

            // Aplicar invulnerabilidade temporária após quebrar shield
            this.invulnerable = true;
            this.invulnerableTime = 30; // 0.5 segundos a 60fps
            return; // Não perde vida
        }

        this.lives--;

        // Atualizar HUD apropriado
        if (this.playerNumber === 1) {
            document.getElementById('p1-lives').textContent = this.lives;
        } else {
            document.getElementById('p2-lives').textContent = this.lives;
        }

        if (this.lives <= 0) {
            this.die();
        } else {
            this.invulnerable = true;
            this.invulnerableTime = 90; // 1.5 segundos a 60fps
            this.vy = CONFIG.JUMP_STRENGTH * 0.7;
        }
    }

    die() {
        if (game.devMode.enabled && game.devMode.invincible) return; // Dev Mode: não morre

        // Iniciar animação de morte
        this.dying = true;
        this.deathAnimTime = 0;
        this.completelyDead = false;

        // Impulso para cima e para trás ao morrer
        this.vy = -8;
        this.vx = this.facingRight ? -3 : 3;

        // Criar partículas de morte
        if (window.createParticles) {
            window.createParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 50);
        }

        // Em modo 2 jogadores, verificar se o outro ainda está vivo
        if (game.twoPlayerMode) {
            const otherPlayer = this.playerNumber === 1 ? game.player2 : game.player;
            if (otherPlayer && otherPlayer.lives > 0) {
                // Other player still alive, no game over
                console.log(`Player ${this.playerNumber} died, but Player ${otherPlayer.playerNumber} continues!`);
                this.lives = 0;
                this.shouldTriggerGameOver = false;
                // Dead player continues in game but can no longer be controlled
                // Animation will play and then player disappears
                return;
            }
        }

        // Game over (modo 1P ou ambos morreram em 2P) - marcar para game over após animação
        this.shouldTriggerGameOver = true;
    }

    draw(ctx) {
        // Não desenhar se completamente morto
        if (this.completelyDead) {
            return;
        }

        // Efeito de piscar quando invulnerável
        if (this.invulnerable && Math.floor(this.invulnerableTime / 5) % 2 === 0) {
            return;
        }

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Aplicar transparência e rotação durante animação de morte
        if (this.dying) {
            ctx.save();

            // Calcular opacidade (fade out)
            const opacity = 1 - (this.deathAnimTime / this.deathAnimDuration);
            ctx.globalAlpha = opacity;

            // Calcular rotação (girar enquanto cai)
            const rotation = (this.deathAnimTime / this.deathAnimDuration) * Math.PI * 2;
            const centerX = screenX + this.width / 2;
            const centerY = screenY + this.height / 2;

            ctx.translate(centerX, centerY);
            ctx.rotate(rotation);
            ctx.translate(-centerX, -centerY);
        }

        // Auras de power-ups
        if (this.jumpBoostTime > 0) {
            ctx.fillStyle = 'rgba(0, 217, 255, 0.3)';
            ctx.shadowColor = '#00d9ff';
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;
        }
        if (this.speedBoostTime > 0) {
            ctx.fillStyle = 'rgba(0, 255, 136, 0.3)';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;
        }
        if (this.shield) {
            // Aura dourada brilhante do shield
            ctx.fillStyle = 'rgba(255, 170, 0, 0.4)';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 15;
            ctx.fillRect(screenX - 3, screenY - 3, this.width + 6, this.height + 6);
            ctx.shadowBlur = 0;

            // Borda do shield
            ctx.strokeStyle = '#ffaa00';
            ctx.lineWidth = 2;
            ctx.strokeRect(screenX - 3, screenY - 3, this.width + 6, this.height + 6);
        }
        if (this.reverseControls) {
            // Aura rosa/vermelha pulsante para controles invertidos
            const pulsate = 0.3 + Math.sin(Date.now() / 200) * 0.15;
            ctx.fillStyle = `rgba(255, 0, 102, ${pulsate})`;
            ctx.shadowColor = '#ff0066';
            ctx.shadowBlur = 12;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;
        }
        if (this.icyFloor) {
            // Aura azul clara cristalina (efeito de gelo)
            ctx.fillStyle = 'rgba(102, 255, 255, 0.35)';
            ctx.shadowColor = '#66ffff';
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;

            // Pequenos "cristais de gelo" nos cantos
            ctx.fillStyle = '#66ffff';
            ctx.fillRect(screenX - 2, screenY - 2, 4, 4);
            ctx.fillRect(screenX + this.width - 2, screenY - 2, 4, 4);
        }
        if (this.doubleJumpEnabled) {
            // Aura roxa do double jump
            ctx.fillStyle = 'rgba(157, 0, 255, 0.35)';
            ctx.shadowColor = '#9d00ff';
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;
        }
        if (this.magnetActive) {
            // Aura dourada com efeito de partículas girando
            const time = Date.now() / 1000;
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 12;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;

            // Pequenas partículas girando ao redor
            for (let i = 0; i < 4; i++) {
                const angle = time * 2 + (i * Math.PI / 2);
                const radius = 18;
                const px = screenX + this.width / 2 + Math.cos(angle) * radius;
                const py = screenY + this.height / 2 + Math.sin(angle) * radius;
                ctx.fillStyle = '#ffd700';
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        if (this.tinyPlayer) {
            // Aura rosa (Tiny Player)
            ctx.fillStyle = 'rgba(255, 20, 147, 0.35)';
            ctx.shadowColor = '#ff1493';
            ctx.shadowBlur = 8;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;
        }
        if (this.heavy) {
            // Aura marrom escura com efeito de peso
            ctx.fillStyle = 'rgba(139, 69, 19, 0.4)';
            ctx.shadowColor = '#8b4513';
            ctx.shadowBlur = 10;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;

            // Linhas de gravidade
            ctx.strokeStyle = '#8b4513';
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(screenX + this.width / 2, screenY + this.height + 2 + i * 3);
                ctx.lineTo(screenX + this.width / 2, screenY + this.height + 8 + i * 3);
                ctx.stroke();
            }
        }
        if (this.bouncy) {
            // Aura rosa claro pulsante (Bouncy)
            const bouncePulse = 0.25 + Math.sin(Date.now() / 150) * 0.15;
            ctx.fillStyle = `rgba(255, 105, 180, ${bouncePulse})`;
            ctx.shadowColor = '#ff69b4';
            ctx.shadowBlur = 12;
            ctx.fillRect(screenX - 2, screenY - 2, this.width + 4, this.height + 4);
            ctx.shadowBlur = 0;
        }
        if (this.timeWarp) {
            // Aura roxa média com efeito de distorção temporal
            const timeEffect = Date.now() / 100;
            ctx.fillStyle = 'rgba(147, 112, 219, 0.4)';
            ctx.shadowColor = '#9370db';
            ctx.shadowBlur = 15;
            ctx.fillRect(screenX - 3, screenY - 3, this.width + 6, this.height + 6);
            ctx.shadowBlur = 0;

            // Anéis de tempo girando
            for (let i = 0; i < 2; i++) {
                ctx.strokeStyle = `rgba(147, 112, 219, ${0.5 - i * 0.2})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                const radius = 15 + i * 8 + Math.sin(timeEffect + i) * 3;
                ctx.arc(screenX + this.width / 2, screenY + this.height / 2, radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Desenhar pernas animadas (antes do corpo para ficarem atrás)
        this.drawLegs(ctx, screenX, screenY);

        // Corpo do jogador (cor baseada no número do jogador)
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Olhos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 6, screenY + 8, 4, 4);
        ctx.fillRect(screenX + 14, screenY + 8, 4, 4);

        // Pupilas (olhando na direção do movimento ou centro quando parado)
        ctx.fillStyle = '#000000';
        let pupilOffsetX = 0; // Centro quando parado
        if (Math.abs(this.vx) > 0.5) {
            // Se está se movendo, olhar na direção do movimento
            pupilOffsetX = this.facingRight ? 1 : -1;
        }
        // Pupilas centralizadas: olho começa em 6 (largura 4), centro é 6+1=7
        ctx.fillRect(screenX + 7 + pupilOffsetX, screenY + 9, 2, 2);
        ctx.fillRect(screenX + 15 + pupilOffsetX, screenY + 9, 2, 2);

        // Boca - oval quando pulando/caindo
        ctx.fillStyle = '#000000';
        if (!this.grounded || Math.abs(this.vy) > 0.5) {
            // Boca oval (aberta) - usando ellipse
            ctx.beginPath();
            ctx.ellipse(
                screenX + 12,  // centro X
                screenY + 20,  // centro Y
                4,             // raio X
                6,             // raio Y (maior = mais oval)
                0, 0, Math.PI * 2
            );
            ctx.fill();
        } else {
            // Boca normal (linha)
            ctx.fillRect(screenX + 8, screenY + 18, 8, 2);
        }

        // Restaurar contexto se estava na animação de morte
        if (this.dying) {
            ctx.restore();
        }
    }

    drawLegs(ctx, screenX, screenY) {
        ctx.fillStyle = this.color;

        // Parâmetros das pernas
        const legWidth = 6;
        const bodyBottom = screenY + this.height;

        // Se estiver no ar, pernas juntas
        if (!this.grounded) {
            ctx.fillRect(screenX + 5, bodyBottom, legWidth, 8);
            ctx.fillRect(screenX + 13, bodyBottom, legWidth, 8);
            return;
        }

        // Animação de caminhada - 4 frames
        let leftLegY = bodyBottom;
        let rightLegY = bodyBottom;
        let leftLegHeight = 8;
        let rightLegHeight = 8;

        switch(this.animFrame) {
            case 0: // Neutro
                leftLegHeight = 8;
                rightLegHeight = 8;
                break;
            case 1: // Perna esquerda levantada, direita abaixada
                leftLegHeight = 6;
                rightLegHeight = 10;
                break;
            case 2: // Neutro
                leftLegHeight = 8;
                rightLegHeight = 8;
                break;
            case 3: // Perna direita levantada, esquerda abaixada
                leftLegHeight = 10;
                rightLegHeight = 6;
                break;
        }

        // Desenhar pernas
        ctx.fillRect(screenX + 5, leftLegY, legWidth, leftLegHeight);
        ctx.fillRect(screenX + 13, rightLegY, legWidth, rightLegHeight);
    }

    getModifierTimeRemaining(type) {
        if (type === 'jump') {
            return Math.ceil(this.jumpBoostTime / 60);
        } else if (type === 'speed') {
            return Math.ceil(this.speedBoostTime / 60);
        } else if (type === 'shield') {
            return Math.ceil(this.shieldTime / 60);
        } else if (type === 'reverse') {
            return Math.ceil(this.reverseControlsTime / 60);
        } else if (type === 'ice') {
            return Math.ceil(this.icyFloorTime / 60);
        } else if (type === 'doublejump') {
            return Math.ceil(this.doubleJumpTime / 60);
        } else if (type === 'magnet') {
            return Math.ceil(this.magnetTime / 60);
        } else if (type === 'tiny') {
            return Math.ceil(this.tinyPlayerTime / 60);
        } else if (type === 'heavy') {
            return Math.ceil(this.heavyTime / 60);
        } else if (type === 'bouncy') {
            return Math.ceil(this.bouncyTime / 60);
        } else if (type === 'timewarp') {
            return Math.ceil(this.timeWarpTime / 60);
        }
        return 0;
    }

    getModifierProgress(type) {
        if (type === 'jump' && this.jumpBoostMaxTime > 0) {
            return this.jumpBoostTime / this.jumpBoostMaxTime;
        } else if (type === 'speed' && this.speedBoostMaxTime > 0) {
            return this.speedBoostTime / this.speedBoostMaxTime;
        } else if (type === 'shield' && this.shieldMaxTime > 0) {
            return this.shieldTime / this.shieldMaxTime;
        } else if (type === 'reverse' && this.reverseControlsMaxTime > 0) {
            return this.reverseControlsTime / this.reverseControlsMaxTime;
        } else if (type === 'ice' && this.icyFloorMaxTime > 0) {
            return this.icyFloorTime / this.icyFloorMaxTime;
        } else if (type === 'doublejump' && this.doubleJumpMaxTime > 0) {
            return this.doubleJumpTime / this.doubleJumpMaxTime;
        } else if (type === 'magnet' && this.magnetMaxTime > 0) {
            return this.magnetTime / this.magnetMaxTime;
        } else if (type === 'tiny' && this.tinyPlayerMaxTime > 0) {
            return this.tinyPlayerTime / this.tinyPlayerMaxTime;
        } else if (type === 'heavy' && this.heavyMaxTime > 0) {
            return this.heavyTime / this.heavyMaxTime;
        } else if (type === 'bouncy' && this.bouncyMaxTime > 0) {
            return this.bouncyTime / this.bouncyMaxTime;
        } else if (type === 'timewarp' && this.timeWarpMaxTime > 0) {
            return this.timeWarpTime / this.timeWarpMaxTime;
        }
        return 0;
    }
}
