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

        // Usar método isométrico da classe pai
        this.drawIsoEnemy(ctx, this.color, '#ffffff');
    }
}
