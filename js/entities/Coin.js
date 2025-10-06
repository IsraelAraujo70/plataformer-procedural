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
            game.player.stats.coinsCollected++;
            game.stats.coinsCollected++; // Também incrementar global para compatibilidade

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
            game.player2.stats.coinsCollected++;
            game.stats.coinsCollected++; // Também incrementar global para compatibilidade

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

        // Efeito de brilho/glow ao redor (mais intenso)
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 15;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // OUTLINE PRETO GROSSO (estilo cartoon)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2 + 2, 0, Math.PI * 2);
        ctx.fill();

        // Moeda dourada com gradiente mais vibrante
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#ffff66'); // Mais claro
        gradient.addColorStop(0.5, '#ffd700'); // Dourado vibrante
        gradient.addColorStop(1, '#cc9900'); // Mais escuro
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        // Símbolo de moeda ($ maior e com outline)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeText('$', 0, 0);

        ctx.fillStyle = '#ffff66';
        ctx.fillText('$', 0, 0);

        // Highlight brilhante (mais pronunciado)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(-3, -3, this.width / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Resetar shadow
        ctx.shadowBlur = 0;

        // Partículas brilhantes ao redor (mais visíveis e maiores)
        const time = Date.now() / 1000 + this.x; // Offset por posição para variar
        for (let i = 0; i < 4; i++) {
            const angle = time * 2 + (i * Math.PI * 2 / 4);
            const radius = 14 + Math.sin(time * 3 + i) * 4;
            const px = screenX + Math.cos(angle) * radius;
            const py = screenY + Math.sin(angle) * radius;
            const opacity = 0.4 + Math.sin(time * 4 + i) * 0.3;

            // Outline preto nas partículas
            ctx.fillStyle = `rgba(0, 0, 0, ${opacity * 0.5})`;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
