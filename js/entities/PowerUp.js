import { game } from '../game.js';

// ============================================
// POWER-UP
// ============================================
export class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type; // 'jump' ou 'speed'
        this.collected = false;
        this.rotation = 0;
        this.pulseTime = 0;
    }

    update() {
        if (this.collected) return;

        this.rotation += 0.03;
        this.pulseTime += 0.1;

        // Colisão com Player 1
        if (this.intersects(game.player)) {
            this.collected = true;
            this.applyEffect(game.player);

            // Adicionar pontos por coletar power-up
            game.player.score += 25;
            game.stats.powerupsCollected++;

            const color = this.type === 'jump' ? '#00d9ff' : '#00ff88';
            if (window.createFloatingText) {
                window.createFloatingText('+25', this.x + this.width / 2, this.y, color);
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, color, 12);
            }
        }

        // Colisão com Player 2 (se existir)
        if (game.player2 && !this.collected && this.intersects(game.player2)) {
            this.collected = true;
            this.applyEffect(game.player2);

            // Adicionar pontos por coletar power-up
            game.player2.score += 25;
            game.stats.powerupsCollected++;

            const color = this.type === 'jump' ? '#00d9ff' : '#00ff88';
            if (window.createFloatingText) {
                window.createFloatingText('+25', this.x + this.width / 2, this.y, color);
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, color, 12);
            }
        }
    }

    applyEffect(player) {
        if (this.type === 'jump') {
            // Aumentar força do pulo por 10 segundos
            player.jumpBoost = 1.4; // 40% mais forte
            player.jumpBoostTime = 600; // 10 segundos a 60fps
        } else if (this.type === 'speed') {
            // Aumentar velocidade por 10 segundos
            player.speedBoost = 1.5; // 50% mais rápido
            player.speedBoostTime = 600; // 10 segundos a 60fps
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

        // Efeito de pulso
        const pulse = 1 + Math.sin(this.pulseTime) * 0.2;
        const size = this.width * pulse;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Cor baseada no tipo
        if (this.type === 'jump') {
            // Azul brilhante
            ctx.fillStyle = '#00d9ff';
            ctx.shadowColor = '#00d9ff';
            ctx.shadowBlur = 15;
        } else {
            // Verde brilhante
            ctx.fillStyle = '#00ff88';
            ctx.shadowColor = '#00ff88';
            ctx.shadowBlur = 15;
        }

        // Desenhar círculo
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Anel interno
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.beginPath();
        ctx.arc(0, 0, size / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
