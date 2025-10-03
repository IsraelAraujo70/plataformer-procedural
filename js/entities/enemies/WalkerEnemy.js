import { CONFIG } from '../../config.js';
import { game } from '../../game.js';
import { Enemy } from '../Enemy.js';

// ============================================
// WALKER ENEMY - Patrulha horizontal básica
// ============================================
export class WalkerEnemy extends Enemy {
    constructor(x, y, platformWidth, platformY) {
        super(x, y, platformWidth, platformY, 'walker');

        this.vx = 1.5;
        this.points = 50;
        this.color = '#ff8800'; // Laranja
    }

    update() {
        if (!this.alive) return;

        // Detectar borda antes de cair (edge detection)
        const checkDistance = 5;
        const futureX = this.vx > 0 ? this.x + this.width + checkDistance : this.x - checkDistance;
        const futureY = this.y + this.height + 5;

        // Verificar se há chão à frente
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

        // Virar se não houver chão à frente
        if (!hasGroundAhead) {
            this.vx *= -1;
        }

        // Movimento horizontal
        this.x += this.vx;

        // Patrulha na plataforma (inverter direção nas bordas)
        if (this.x <= this.platformX || this.x + this.width >= this.platformX + this.platformWidth) {
            this.vx *= -1;
            this.x = Math.max(this.platformX, Math.min(this.x, this.platformX + this.platformWidth - this.width));
        }

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

    draw(ctx) {
        if (!this.alive) return;

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Corpo do inimigo (laranja)
        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Olhos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 6, screenY + 8, 4, 6);
        ctx.fillRect(screenX + 18, screenY + 8, 4, 6);

        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX + 8, screenY + 10, 2, 2);
        ctx.fillRect(screenX + 20, screenY + 10, 2, 2);

        // Dentes
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(screenX + 6 + i * 4, screenY + 20, 3, 4);
        }
    }
}
