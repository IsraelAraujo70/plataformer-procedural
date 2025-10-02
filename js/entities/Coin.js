import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// COIN
// ============================================
export class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.COIN_SIZE;
        this.height = CONFIG.COIN_SIZE;
        this.collected = false;
        this.rotation = 0;
    }

    update() {
        if (this.collected) return;

        this.rotation += 0.05;

        // Colisão com Player 1
        if (this.intersects(game.player)) {
            this.collected = true;
            game.player.score += 10;
            game.stats.coinsCollected++;

            if (window.createFloatingText) {
                window.createFloatingText('+10', this.x + this.width / 2, this.y, '#ffd700');
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 6);
            }
        }

        // Colisão com Player 2 (se existir)
        if (game.player2 && !this.collected && this.intersects(game.player2)) {
            this.collected = true;
            game.player2.score += 10;
            game.stats.coinsCollected++;

            if (window.createFloatingText) {
                window.createFloatingText('+10', this.x + this.width / 2, this.y, '#ffd700');
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 6);
            }
        }
    }

    intersects(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    draw(ctx) {
        if (this.collected) return;

        const screenX = this.x - game.camera.x + this.width / 2;
        const screenY = this.y - game.camera.y + this.height / 2;

        // Efeito de brilho/glow ao redor
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Moeda dourada (círculo ao invés de quadrado)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#ffed4e');
        gradient.addColorStop(0.7, '#ffd700');
        gradient.addColorStop(1, '#daa520');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Símbolo de moeda (C ou $)
        ctx.fillStyle = '#b8860b';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', 0, 0);

        // Highlight brilhante
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-2, -2, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Resetar shadow
        ctx.shadowBlur = 0;

        // Partículas brilhantes ao redor (efeito idle)
        const time = Date.now() / 1000 + this.x; // Offset por posição para variar
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * Math.PI * 2 / 3);
            const radius = 12 + Math.sin(time * 2 + i) * 3;
            const px = screenX + Math.cos(angle) * radius;
            const py = screenY + Math.sin(angle) * radius;
            const opacity = 0.3 + Math.sin(time * 3 + i) * 0.2;

            ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
            ctx.beginPath();
            ctx.arc(px, py, 1, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
