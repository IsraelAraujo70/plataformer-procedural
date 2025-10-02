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

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Moeda dourada
        ctx.fillStyle = '#ffd700';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        // Brilho
        ctx.fillStyle = '#ffed4e';
        ctx.fillRect(-this.width / 3, -this.height / 3, this.width / 1.5, this.height / 1.5);

        ctx.restore();
    }
}
