import { CONFIG } from '../../config.js';
import { game } from '../../game.js';
import { Enemy } from '../Enemy.js';

// ============================================
// CHASER ENEMY - Persegue o jogador quando próximo
// ============================================
export class ChaserEnemy extends Enemy {
    constructor(x, y, platformWidth, platformY) {
        super(x, y, platformWidth, platformY, 'chaser');

        // Configuração específica do Chaser
        this.normalSpeed = 1.2;
        this.chaseSpeed = 3.5; // Velocidade ao perseguir
        this.vx = this.normalSpeed;
        this.points = 80; // Vale mais pontos (mais difícil)
        this.color = '#ff3333'; // Vermelho

        // Parâmetros de perseguição
        this.detectionRange = 250; // Pixels de distância para detectar jogador
        this.isChasing = false;
        this.targetPlayer = null;
    }

    update() {
        if (!this.alive) return;

        // Detectar jogador mais próximo
        this.detectNearestPlayer();

        // Comportamento de perseguição
        if (this.isChasing && this.targetPlayer) {
            // Perseguir jogador
            const dx = this.targetPlayer.x - this.x;

            if (Math.abs(dx) > 10) { // Margem para evitar oscilação
                if (dx > 0) {
                    this.vx = this.chaseSpeed;
                } else {
                    this.vx = -this.chaseSpeed;
                }
            }
        } else {
            // Patrulha normal (como walker, mas mais devagar)
            // Detectar borda antes de cair
            const checkDistance = 5;
            const futureX = this.vx > 0 ? this.x + this.width + checkDistance : this.x - checkDistance;
            const futureY = this.y + this.height + 5;

            let hasGroundAhead = false;
            const startChunk = Math.floor((futureX - 50) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
            const endChunk = Math.floor((futureX + 50) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

            for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
                const chunk = game.chunks.get(chunkIdx);
                if (!chunk) continue;

                for (let platform of chunk.platforms) {
                    if (futureX > platform.x &&
                        futureX < platform.x + platform.width &&
                        futureY > platform.y - 10 &&
                        futureY < platform.y + platform.height) {
                        hasGroundAhead = true;
                        break;
                    }
                }
                if (hasGroundAhead) break;
            }

            if (!hasGroundAhead) {
                this.vx *= -1;
            }

            // Patrulha nas bordas da plataforma
            if (this.x <= this.platformX || this.x + this.width >= this.platformX + this.platformWidth) {
                this.vx *= -1;
                this.x = Math.max(this.platformX, Math.min(this.x, this.platformX + this.platformWidth - this.width));
            }
        }

        // Movimento horizontal
        this.x += this.vx;

        // Gravidade
        this.vy += CONFIG.GRAVITY;
        this.y += this.vy;

        // Colisão com plataformas
        this.grounded = false;
        this.handlePlatformCollisions();

        // Limitar vy
        if (this.vy > 10) this.vy = 10;

        // Remover se cair do mundo
        if (this.y > game.height + 100) {
            this.alive = false;
        }

        // Chamada para colisão com jogadores (método da classe pai)
        super.update();
    }

    detectNearestPlayer() {
        let closestPlayer = null;
        let closestDistance = Infinity;

        // Verificar Player 1
        if (game.player && !game.player.dying) {
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = game.player;
            }
        }

        // Verificar Player 2 (se existir)
        if (game.player2 && !game.player2.dying) {
            const dx = game.player2.x - this.x;
            const dy = game.player2.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestPlayer = game.player2;
            }
        }

        // Atualizar estado de perseguição
        if (closestDistance < this.detectionRange) {
            this.isChasing = true;
            this.targetPlayer = closestPlayer;
        } else {
            this.isChasing = false;
            this.targetPlayer = null;
            this.vx = this.vx > 0 ? this.normalSpeed : -this.normalSpeed; // Voltar velocidade normal
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Efeito de intensidade quando perseguindo (aura vermelha)
        if (this.isChasing) {
            ctx.fillStyle = 'rgba(255, 51, 51, 0.3)';
            ctx.beginPath();
            ctx.arc(screenX + this.width / 2, screenY + this.height / 2, this.width / 2 + 6, 0, Math.PI * 2);
            ctx.fill();
        }

        // Corpo do inimigo (vermelho)
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Olhos (expressão agressiva)
        const eyeAngle = this.isChasing ? -0.3 : 0; // Sobrancelhas "raivosas" quando perseguindo
        ctx.fillStyle = '#ffffff';

        // Olho esquerdo
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        // Olho direito
        ctx.beginPath();
        ctx.arc(screenX + 20, screenY + 10, 5, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas (olhando na direção do movimento)
        ctx.fillStyle = '#000000';
        const pupilOffsetX = this.vx > 0 ? 1 : -1;
        ctx.beginPath();
        ctx.arc(screenX + 8 + pupilOffsetX, screenY + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 20 + pupilOffsetX, screenY + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Sobrancelhas agressivas
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + 4, screenY + 6);
        ctx.lineTo(screenX + 12, screenY + 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 16, screenY + 8);
        ctx.lineTo(screenX + 24, screenY + 6);
        ctx.stroke();

        // Boca (sorriso maligno)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 14, screenY + 19, 6, 0, Math.PI);
        ctx.fill();

        // Dentes pontiagudos
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.moveTo(screenX + 9 + i * 5, screenY + 19);
            ctx.lineTo(screenX + 11 + i * 5, screenY + 23);
            ctx.lineTo(screenX + 13 + i * 5, screenY + 19);
            ctx.fill();
        }

        // Linhas de velocidade quando perseguindo
        if (this.isChasing) {
            ctx.strokeStyle = 'rgba(255, 51, 51, 0.5)';
            ctx.lineWidth = 2;
            const direction = this.vx > 0 ? -1 : 1;
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.moveTo(screenX + this.width * 0.3 * direction - i * 8 * direction, screenY + 8 + i * 6);
                ctx.lineTo(screenX + this.width * 0.1 * direction - i * 8 * direction, screenY + 8 + i * 6);
                ctx.stroke();
            }
        }
    }
}
