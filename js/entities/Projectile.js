import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// PROJECTILE - Projétil disparado por inimigos
// ============================================
export class Projectile {
    constructor(x, y, vx, vy, owner) {
        this.x = x;
        this.y = y;
        this.width = 8;
        this.height = 8;
        this.vx = vx;
        this.vy = vy;
        this.alive = true;
        this.owner = owner; // Referência ao inimigo que disparou
        this.color = '#ffaa00'; // Laranja/amarelo
    }

    update() {
        if (!this.alive) return;

        // Movimento reto (sem gravidade)
        this.x += this.vx * game.deltaTimeFactor;
        this.y += this.vy * game.deltaTimeFactor;

        // Verificar colisão com plataformas
        this.checkPlatformCollisions();

        // Verificar colisão com jogadores
        this.checkPlayerCollisions();

        // Remover se sair muito do mundo
        if (this.y > game.height + 100 || this.x < game.camera.x - 500 || this.x > game.camera.x + game.width + 500) {
            this.alive = false;
        }
    }

    checkPlatformCollisions() {
        const startChunk = Math.floor((this.x - 100) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((this.x + 100) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            for (let platform of chunk.platforms) {
                if (this.intersects(platform)) {
                    // Projétil explode ao colidir com plataforma
                    this.alive = false;

                    // Efeito visual de explosão
                    if (window.createParticles) {
                        window.createParticles(this.x, this.y, this.color, 5);
                    }
                    return;
                }
            }
        }
    }

    checkPlayerCollisions() {
        // Colisão com Player 1
        if (game.player && !game.player.dying && this.intersects(game.player)) {
            game.player.takeDamage();
            this.alive = false;

            // Som de projétil acertando
            game.soundManager?.playProjectileHit();

            if (window.createParticles) {
                window.createParticles(this.x, this.y, this.color, 6);
            }
            return;
        }

        // Colisão com Player 2 (se existir)
        if (game.player2 && !game.player2.dying && this.intersects(game.player2)) {
            game.player2.takeDamage();
            this.alive = false;

            // Som de projétil acertando
            game.soundManager?.playProjectileHit();

            if (window.createParticles) {
                window.createParticles(this.x, this.y, this.color, 6);
            }
        }
    }

    intersects(rect) {
        return this.x < rect.x + rect.width &&
               this.x + this.width > rect.x &&
               this.y < rect.y + rect.height &&
               this.y + this.height > rect.y;
    }

    draw(ctx) {
        if (!this.alive) return;

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Desenhar projétil como círculo brilhante
        const gradient = ctx.createRadialGradient(
            screenX + this.width / 2,
            screenY + this.height / 2,
            0,
            screenX + this.width / 2,
            screenY + this.height / 2,
            this.width / 2
        );
        gradient.addColorStop(0, '#ffff00'); // Centro amarelo brilhante
        gradient.addColorStop(0.5, this.color);
        gradient.addColorStop(1, '#ff8800'); // Borda laranja escuro

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2, screenY + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Brilho adicional
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(screenX + this.width / 2 - 1, screenY + this.height / 2 - 1, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        // Rastro de movimento (trail)
        ctx.fillStyle = `rgba(255, 170, 0, 0.3)`;
        ctx.beginPath();
        ctx.arc(screenX - this.vx * 0.5, screenY - this.vy * 0.5, this.width / 3, 0, Math.PI * 2);
        ctx.fill();
    }
}
