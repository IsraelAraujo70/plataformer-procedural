import { CONFIG } from '../../config.js';
import { game } from '../../game.js';
import { Enemy } from '../Enemy.js';

// ============================================
// JUMPER ENEMY - Pula periodicamente na plataforma
// ============================================
export class JumperEnemy extends Enemy {
    constructor(x, y, platformWidth, platformY) {
        super(x, y, platformWidth, platformY, 'jumper');

        // Configuração específica do Jumper
        this.vx = 0.8; // Mais lento que o walker
        this.points = 60;
        this.color = '#00cc88'; // Verde-água

        // Parâmetros de pulo
        this.jumpTimer = 0;
        this.jumpInterval = 90; // Pula a cada 1.5 segundos (60fps)
        this.jumpStrength = CONFIG.JUMP_STRENGTH * 0.8; // Pulo um pouco menor que o jogador
        this.canJump = false;
    }

    update() {
        if (!this.alive) return;

        // Timer de pulo
        this.jumpTimer++;

        // Movimento horizontal (mais lento)
        this.x += this.vx;

        // Patrulha na plataforma (inverter direção nas bordas)
        if (this.x <= this.platformX || this.x + this.width >= this.platformX + this.platformWidth) {
            this.vx *= -1;
            this.x = Math.max(this.platformX, Math.min(this.x, this.platformX + this.platformWidth - this.width));
        }

        // Pular periodicamente quando está no chão
        if (this.grounded && this.jumpTimer >= this.jumpInterval) {
            this.vy = this.jumpStrength;
            this.jumpTimer = 0;
            this.grounded = false;
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

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Pernas/molas (desenhar primeiro)
        ctx.fillStyle = '#008866'; // Verde mais escuro
        const legHeight = this.grounded ? 6 : 10; // Pernas esticam quando no ar

        // Mola esquerda (espiral simplificada)
        ctx.strokeStyle = '#008866';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < legHeight; i += 2) {
            const offset = (i % 4 === 0) ? -2 : 2;
            ctx.lineTo(screenX + 8 + offset, screenY + this.height + i);
        }
        ctx.stroke();

        // Mola direita
        ctx.beginPath();
        for (let i = 0; i < legHeight; i += 2) {
            const offset = (i % 4 === 0) ? -2 : 2;
            ctx.lineTo(screenX + 20 + offset, screenY + this.height + i);
        }
        ctx.stroke();

        // Corpo do inimigo (verde-água, comprimido quando no chão)
        const bodyHeight = this.grounded ? this.height * 0.9 : this.height;
        const bodyY = this.grounded ? screenY + 2 : screenY;

        ctx.fillStyle = this.color;
        ctx.fillRect(screenX, bodyY, this.width, bodyHeight);

        // Olhos (maiores quando pulando - expressão de surpresa)
        const eyeSize = this.grounded ? 5 : 7;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX + 8, bodyY + 10, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 20, bodyY + 10, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = '#000000';
        const pupilY = this.grounded ? bodyY + 10 : bodyY + 12; // Olhar para baixo quando no ar
        ctx.beginPath();
        ctx.arc(screenX + 8, pupilY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 20, pupilY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Boca (sorrisinho)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(screenX + 14, bodyY + 16, 4, 0, Math.PI);
        ctx.stroke();

        // Indicador de carga do pulo (barra no topo quando está prestes a pular)
        if (this.grounded && this.jumpTimer > this.jumpInterval * 0.7) {
            const chargePercent = (this.jumpTimer - this.jumpInterval * 0.7) / (this.jumpInterval * 0.3);
            ctx.fillStyle = '#ffff00';
            ctx.fillRect(screenX, screenY - 4, this.width * chargePercent, 2);
        }
    }
}
