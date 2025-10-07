import { game } from '../game.js';

// ============================================
// FLOATING TEXT (Feedback de Pontos)
// ============================================
export class FloatingText {
    constructor(text, x, y, color) {
        this.text = text;
        this.x = x;
        this.y = y;
        this.vy = -2; // Sobe
        this.life = 60; // 1 segundo a 60fps
        this.maxLife = 60;
        this.color = color;
    }

    update() {
        this.y += this.vy * game.deltaTimeFactor;
        this.life -= game.deltaTimeFactor;
    }

    draw(ctx) {
        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;
        const alpha = this.life / this.maxLife;

        ctx.save();
        ctx.font = 'bold 20px monospace';
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.globalAlpha = alpha;

        // Contorno
        ctx.strokeText(this.text, screenX, screenY);
        // Texto
        ctx.fillText(this.text, screenX, screenY);

        ctx.restore();
    }
}
