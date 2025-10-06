import { CONFIG } from '../config.js';
import { game } from '../game.js';
import { worldToIso, drawIsoShadow } from '../utils/Isometric.js';

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

        // Converter para coordenadas isométricas
        const worldX = this.x;
        const worldY = this.y;
        const worldZ = 0; // Moedas flutuam um pouco
        const floatOffset = Math.sin(Date.now() / 500 + this.x) * 3; // Animação de flutuação

        const isoPos = worldToIso(worldX, worldY, worldZ + floatOffset);
        const screenX = isoPos.isoX - game.camera.x;
        const screenY = isoPos.isoY - game.camera.y;

        // Desenhar sombra no chão
        drawIsoShadow(ctx, worldX, worldY, floatOffset, this.width, this.width);

        // Efeito de brilho/glow ao redor
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 10;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Moeda dourada isométrica (oval para dar perspectiva)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#ffed4e');
        gradient.addColorStop(0.7, '#ffd700');
        gradient.addColorStop(1, '#daa520');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(0, 0, this.width / 2, this.width / 3, 0, 0, Math.PI * 2); // Oval para perspectiva
        ctx.fill();

        // Borda da moeda (dar espessura 3D)
        ctx.fillStyle = '#b8860b';
        ctx.beginPath();
        ctx.ellipse(0, 2, this.width / 2.2, this.width / 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Símbolo de moeda ($)
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

        // Partículas brilhantes ao redor (efeito idle) - isométrico
        const time = Date.now() / 1000 + this.x;
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * Math.PI * 2 / 3);
            const radius = 12;
            const px = worldX + Math.cos(angle) * radius;
            const py = worldY + Math.sin(angle) * radius;
            const pz = worldZ + floatOffset + Math.sin(time * 2 + i) * 5;
            const particlePos = worldToIso(px, py, pz);
            const opacity = 0.3 + Math.sin(time * 3 + i) * 0.2;

            ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
            ctx.beginPath();
            ctx.arc(particlePos.isoX - game.camera.x, particlePos.isoY - game.camera.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
