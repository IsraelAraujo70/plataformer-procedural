import { game } from '../game.js';

// ============================================
// PARTICLE
// ============================================
export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.3;
        this.life--;
    }

    draw(ctx) {
        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;
        const alpha = this.life / this.maxLife;

        ctx.fillStyle = this.color;
        ctx.globalAlpha = alpha;
        ctx.fillRect(screenX, screenY, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}
