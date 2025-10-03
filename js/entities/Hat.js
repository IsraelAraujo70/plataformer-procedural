import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// HAT (Chapéu)
// ============================================
export class Hat {
    constructor(x, y, type = 'collectable') {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 16;
        this.type = type; // 'collectable' ou 'dropping'
        this.collected = false;

        // Animação
        this.bobTime = 0;
        this.alpha = 1.0;

        if (this.type === 'dropping') {
            // Chapéu sendo perdido - física temporária
            this.vx = Math.random() * 4 - 2; // Impulso horizontal aleatório
            this.vy = -8; // Impulso para cima
            this.rotation = 0;
            this.rotationSpeed = (Math.random() - 0.5) * 0.3;
            this.lifetime = 0;
            this.maxLifetime = 60; // ~1 segundo a 60fps
        } else {
            // Chapéu coletável no mapa
            this.vx = 0;
            this.vy = 0;
            this.rotation = 0;
        }
    }

    update() {
        if (this.collected) return;

        if (this.type === 'dropping') {
            // ============================================
            // MODO: Chapéu caindo (não coletável)
            // ============================================
            this.lifetime++;

            // Física simples
            this.vy += CONFIG.GRAVITY * 0.5;
            this.x += this.vx;
            this.y += this.vy;
            this.rotation += this.rotationSpeed;

            // Fade out progressivo
            this.alpha = 1.0 - (this.lifetime / this.maxLifetime);

            // Remover quando acabar tempo
            if (this.lifetime >= this.maxLifetime) {
                this.collected = true;

                // Partículas finais
                if (window.createParticles) {
                    window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#8b4513', 8);
                }
            }

        } else {
            // ============================================
            // MODO: Chapéu coletável (item no mapa)
            // ============================================
            this.bobTime += 0.1;

            // Colisão com Player 1
            if (this.intersects(game.player)) {
                // Verificar se pode coletar (não exceder limite)
                if (game.player.hatCount < game.player.maxHats) {
                    this.collected = true;
                    game.player.hatCount++;

                    // Efeitos visuais
                    if (window.createFloatingText) {
                        window.createFloatingText(`HAT! (${game.player.hatCount}/${game.player.maxHats})`, this.x + this.width / 2, this.y, '#ffd700');
                    }
                    if (window.createParticles) {
                        window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 20);
                    }
                } else {
                    // Já está no máximo
                    if (window.createFloatingText) {
                        window.createFloatingText('MAX HATS!', this.x + this.width / 2, this.y, '#ff6b6b');
                    }
                }
            }

            // Colisão com Player 2 (se existir)
            if (game.player2 && this.intersects(game.player2)) {
                // Verificar se pode coletar (não exceder limite)
                if (game.player2.hatCount < game.player2.maxHats) {
                    this.collected = true;
                    game.player2.hatCount++;

                    // Efeitos visuais
                    if (window.createFloatingText) {
                        window.createFloatingText(`HAT! (${game.player2.hatCount}/${game.player2.maxHats})`, this.x + this.width / 2, this.y, '#ffd700');
                    }
                    if (window.createParticles) {
                        window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 20);
                    }
                } else {
                    // Já está no máximo
                    if (window.createFloatingText) {
                        window.createFloatingText('MAX HATS!', this.x + this.width / 2, this.y, '#ff6b6b');
                    }
                }
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

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        ctx.save();

        if (this.type === 'dropping') {
            // Chapéu caindo - com rotação e fade
            ctx.globalAlpha = this.alpha;
            ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
            ctx.rotate(this.rotation);
            ctx.translate(-(this.width / 2), -(this.height / 2));

            this.drawHatShape(ctx);

        } else {
            // Chapéu coletável - com bob e brilho
            const bob = Math.sin(this.bobTime) * 3;

            ctx.translate(screenX + this.width / 2, screenY + this.height / 2 + bob);

            // Brilho de fundo pulsante
            const pulseAlpha = 0.3 + Math.sin(this.bobTime * 2) * 0.2;
            ctx.fillStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.translate(-(this.width / 2), -(this.height / 2));

            // Partículas brilhantes girando
            const time = Date.now() / 1000;
            ctx.fillStyle = '#ffd700';
            for (let i = 0; i < 3; i++) {
                const angle = time * 2 + (i * Math.PI * 2 / 3);
                const radius = 12;
                const px = this.width / 2 + Math.cos(angle) * radius;
                const py = this.height / 2 + Math.sin(angle) * radius;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            this.drawHatShape(ctx);
        }

        ctx.restore();
    }

    drawHatShape(ctx) {
        // Cor principal do chapéu
        const hatColor = '#2c1810'; // Marrom escuro
        const bandColor = '#8b4513'; // Faixa marrom

        // Aba do chapéu (oval achatado)
        ctx.fillStyle = hatColor;
        ctx.beginPath();
        ctx.ellipse(this.width / 2, this.height - 3, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Copa do chapéu (cilindro)
        ctx.fillStyle = hatColor;
        ctx.fillRect(this.width / 2 - 6, 2, 12, this.height - 6);

        // Topo do chapéu (oval)
        ctx.beginPath();
        ctx.ellipse(this.width / 2, 2, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Faixa decorativa
        ctx.fillStyle = bandColor;
        ctx.fillRect(this.width / 2 - 6, this.height - 7, 12, 3);

        // Brilho no topo (highlight)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(this.width / 2 - 4, 4, 3, 4);
    }
}
