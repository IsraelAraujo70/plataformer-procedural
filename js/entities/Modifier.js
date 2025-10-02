import { game } from '../game.js';

// ============================================
// MODIFIER (Modificador)
// ============================================
export class Modifier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.rotation = 0;
        this.pulseTime = 0;

        // Lista de modificadores disponíveis
        const availableModifiers = ['jump', 'speed', 'shield', 'reverse', 'ice', 'doublejump', 'magnet'];

        // Sortear tipo aleatoriamente
        this.type = availableModifiers[Math.floor(Math.random() * availableModifiers.length)];

        // Duração aleatória entre 2 e 15 segundos (120 a 900 frames a 60fps)
        this.duration = Math.floor(Math.random() * (900 - 120 + 1)) + 120;
    }

    update() {
        if (this.collected) return;

        this.rotation += 0.03;
        this.pulseTime += 0.1;

        // Mapeamento de cores por tipo de modificador
        const colors = {
            jump: '#00d9ff',
            speed: '#00ff88',
            shield: '#ffaa00',
            reverse: '#ff0066',
            ice: '#66ffff',
            doublejump: '#9d00ff',
            magnet: '#ffd700'
        };

        // Colisão com Player 1
        if (this.intersects(game.player)) {
            this.collected = true;

            // Em modo 2 jogadores, aplicar efeito em ambos
            if (game.twoPlayerMode && game.player2) {
                this.applyEffect(game.player);
                this.applyEffect(game.player2);
            } else {
                this.applyEffect(game.player);
            }

            // Pontos vão apenas para quem coletou
            game.player.score += 25;
            game.stats.modifiersCollected++;

            const color = colors[this.type] || '#ffffff';
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

            // Em modo 2 jogadores, aplicar efeito em ambos
            if (game.twoPlayerMode && game.player) {
                this.applyEffect(game.player);
                this.applyEffect(game.player2);
            } else {
                this.applyEffect(game.player2);
            }

            // Pontos vão apenas para quem coletou
            game.player2.score += 25;
            game.stats.modifiersCollected++;

            const color = colors[this.type] || '#ffffff';
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
            // Aumentar força do pulo por duração aleatória (2-15s)
            player.jumpBoost = 1.4; // 40% mais forte
            player.jumpBoostTime = this.duration;
            player.jumpBoostMaxTime = this.duration;
        } else if (this.type === 'speed') {
            // Aumentar velocidade por duração aleatória (2-15s)
            player.speedBoost = 1.5; // 50% mais rápido
            player.speedBoostTime = this.duration;
            player.speedBoostMaxTime = this.duration;
        } else if (this.type === 'shield') {
            // Escudo que absorve 1 hit
            player.shield = true;
            player.shieldTime = this.duration;
            player.shieldMaxTime = this.duration;
        } else if (this.type === 'reverse') {
            // Controles invertidos
            player.reverseControls = true;
            player.reverseControlsTime = this.duration;
            player.reverseControlsMaxTime = this.duration;
        } else if (this.type === 'ice') {
            // Fricção muito reduzida (efeito de gelo)
            player.icyFloor = true;
            player.icyFloorTime = this.duration;
            player.icyFloorMaxTime = this.duration;
        } else if (this.type === 'doublejump') {
            // Permite double jump no ar
            player.doubleJumpEnabled = true;
            player.doubleJumpTime = this.duration;
            player.doubleJumpMaxTime = this.duration;
            player.hasDoubleJump = true;
        } else if (this.type === 'magnet') {
            // Atrai moedas e modificadores automaticamente
            player.magnetActive = true;
            player.magnetTime = this.duration;
            player.magnetMaxTime = this.duration;
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

        // Visual único - gradiente arco-íris animado
        const gradientRotation = this.pulseTime * 0.5;
        const gradient = ctx.createLinearGradient(
            Math.cos(gradientRotation) * size,
            Math.sin(gradientRotation) * size,
            -Math.cos(gradientRotation) * size,
            -Math.sin(gradientRotation) * size
        );

        gradient.addColorStop(0, '#ff00ff');    // Magenta
        gradient.addColorStop(0.33, '#00d9ff'); // Ciano
        gradient.addColorStop(0.66, '#00ff88'); // Verde
        gradient.addColorStop(1, '#ffff00');    // Amarelo

        ctx.fillStyle = gradient;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;

        // Desenhar círculo
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Símbolo de interrogação no centro
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);

        ctx.restore();
    }
}
