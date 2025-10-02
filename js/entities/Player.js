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
        this.speedBoost = 1;
        this.speedBoostTime = 0;

        // Multiplayer: definir número do jogador e controles
        this.playerNumber = playerNumber;
        this.color = playerNumber === 1 ? '#00d9ff' : '#ff6b6b';
        this.controls = playerNumber === 1 ?
            { left: 'a', right: 'd', up: 'w' } :
            { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp' };

        // Stats individuais por jogador
        this.lives = 3;
        this.score = 0;

        // Animação de caminhada
        this.animFrame = 0;
        this.animCounter = 0;
        this.animSpeed = 4; // Frames de jogo entre cada frame de animação (mais rápido = mais fluido)
        this.facingRight = true;
    }

    update() {
        // Jogador morto não pode se mover
        if (this.lives <= 0) {
            return;
        }

        // Atualizar power-ups
        if (this.jumpBoostTime > 0) {
            this.jumpBoostTime--;
            if (this.jumpBoostTime <= 0) {
                this.jumpBoost = 1;
            }
        }

        if (this.speedBoostTime > 0) {
            this.speedBoostTime--;
            if (this.speedBoostTime <= 0) {
                this.speedBoost = 1;
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

        // Controles normais
        let moveSpeed = CONFIG.MOVE_SPEED * this.speedBoost;
        if (game.devMode.enabled) moveSpeed *= 2; // Velocidade dobrada em dev mode

        if (game.keys[this.controls.left]) {
            this.vx = -moveSpeed;
            this.facingRight = false;
        } else if (game.keys[this.controls.right]) {
            this.vx = moveSpeed;
            this.facingRight = true;
        } else {
            this.vx *= CONFIG.FRICTION;
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
            if (game.devMode.enabled) jumpStrength *= 1.5; // Super pulo em dev mode
            this.vy = jumpStrength;
            this.jumping = true;
            this.grounded = false;
        }

        // Pulo conjunto (ESPAÇO faz ambos pularem)
        if (game.keys[' '] && this.grounded && !this.jumping) {
            let jumpStrength = CONFIG.JUMP_STRENGTH * this.jumpBoost;
            if (game.devMode.enabled) jumpStrength *= 1.5;
            this.vy = jumpStrength;
            this.jumping = true;
            this.grounded = false;
        }

        if (!game.keys[this.controls.up] && !game.keys[' ']) {
            this.jumping = false;
        }

        // Gravidade (pode ser desativada em dev mode)
        if (game.devMode.gravityEnabled) {
            this.vy += CONFIG.GRAVITY;
        }

        // Limites de velocidade
        if (this.vy > 20) this.vy = 20;

        // Atualizar posição
        this.x += this.vx;
        this.y += this.vy;

        // Colisões com terreno
        this.grounded = false;
        this.handleCollisions();

        // Limites do mundo
        if (this.y > game.height + 100) {
            this.die();
        }

        // Invulnerabilidade
        if (this.invulnerable) {
            this.invulnerableTime--;
            if (this.invulnerableTime <= 0) {
                this.invulnerable = false;
            }
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

    takeDamage() {
        if (this.invulnerable) return;
        if (game.devMode.enabled && game.devMode.invincible) return; // Dev Mode: invencível

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

        // Em modo 2 jogadores, verificar se o outro ainda está vivo
        if (game.twoPlayerMode) {
            const otherPlayer = this.playerNumber === 1 ? game.player2 : game.player;
            if (otherPlayer && otherPlayer.lives > 0) {
                // Outro jogador ainda vivo, não game over
                console.log(`Player ${this.playerNumber} morreu, mas Player ${otherPlayer.playerNumber} continua!`);
                this.lives = 0;
                // Jogador morto continua no jogo mas não pode mais ser controlado
                return;
            }
        }

        // Game over (modo 1P ou ambos morreram em 2P)
        game.state = 'gameover';
        // showGameOver será chamado no menu.js
        if (window.showGameOver) {
            window.showGameOver();
        }
    }

    draw(ctx) {
        // Efeito de piscar quando invulnerável
        if (this.invulnerable && Math.floor(this.invulnerableTime / 5) % 2 === 0) {
            return;
        }

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Aura de power-up
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

        // Desenhar pernas animadas (antes do corpo para ficarem atrás)
        this.drawLegs(ctx, screenX, screenY);

        // Corpo do jogador (cor baseada no número do jogador)
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Olhos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 6, screenY + 8, 4, 4);
        ctx.fillRect(screenX + 14, screenY + 8, 4, 4);

        // Pupilas (olhando na direção do movimento)
        ctx.fillStyle = '#000000';
        const pupilOffsetX = this.facingRight ? 1 : -1;
        ctx.fillRect(screenX + 8 + pupilOffsetX, screenY + 9, 2, 2);
        ctx.fillRect(screenX + 16 + pupilOffsetX, screenY + 9, 2, 2);

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
}
