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
        // Cores vibrantes estilo cartoon
        this.color = '#00cc88'; // Verde-água vibrante
        this.colorDark = '#009966'; // Sombra
        this.colorLight = '#33ffaa'; // Highlight

        // Parâmetros de pulo
        this.jumpTimer = 0;
        this.jumpInterval = 90; // Pula a cada 1.5 segundos (60fps)
        this.jumpStrength = CONFIG.JUMP_STRENGTH * 0.8; // Pulo um pouco menor que o jogador
        this.canJump = false;
    }

    update() {
        if (!this.alive) return;

        // Timer de pulo
        this.jumpTimer += game.deltaTimeFactor;

        // Movimento horizontal (mais lento)
        this.x += this.vx * game.deltaTimeFactor;

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
        this.vy += CONFIG.GRAVITY * game.deltaTimeFactor;
        this.y += this.vy * game.deltaTimeFactor;

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

        // Pernas/molas (desenhar primeiro) - mais grossas com outline
        const legHeight = this.grounded ? 6 : 10; // Pernas esticam quando no ar

        // Mola esquerda com outline preto
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < legHeight; i += 2) {
            const offset = (i % 4 === 0) ? -2 : 2;
            ctx.lineTo(screenX + 8 + offset, screenY + this.height + i);
        }
        ctx.stroke();

        ctx.strokeStyle = this.colorDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < legHeight; i += 2) {
            const offset = (i % 4 === 0) ? -2 : 2;
            ctx.lineTo(screenX + 8 + offset, screenY + this.height + i);
        }
        ctx.stroke();

        // Mola direita com outline preto
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let i = 0; i < legHeight; i += 2) {
            const offset = (i % 4 === 0) ? -2 : 2;
            ctx.lineTo(screenX + 20 + offset, screenY + this.height + i);
        }
        ctx.stroke();

        ctx.strokeStyle = this.colorDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < legHeight; i += 2) {
            const offset = (i % 4 === 0) ? -2 : 2;
            ctx.lineTo(screenX + 20 + offset, screenY + this.height + i);
        }
        ctx.stroke();

        // Corpo do inimigo (verde-água, comprimido quando no chão) - formato blob
        const bodyHeight = this.grounded ? this.height * 0.9 : this.height;
        const bodyY = this.grounded ? screenY + 2 : screenY;
        const centerX = screenX + this.width / 2;
        const centerY = bodyY + bodyHeight / 2;
        const radiusX = this.width / 2;
        const radiusY = bodyHeight / 2;

        // OUTLINE PRETO GROSSO
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX + 2, radiusY + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // CORPO BLOB com gradiente
        const gradient = ctx.createRadialGradient(
            centerX - radiusX * 0.3,
            centerY - radiusY * 0.3,
            0,
            centerX,
            centerY,
            radiusX
        );
        gradient.addColorStop(0, this.colorLight);
        gradient.addColorStop(0.6, this.color);
        gradient.addColorStop(1, this.colorDark);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.fill();

        // HIGHLIGHT
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(centerX - radiusX * 0.25, centerY - radiusY * 0.3, radiusX * 0.4, radiusY * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Olhos (maiores quando pulando - expressão de surpresa)
        const eyeSize = this.grounded ? 4 : 6;

        // Outline dos olhos
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 10, bodyY + 10, eyeSize + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, bodyY + 10, eyeSize + 1, 0, Math.PI * 2);
        ctx.fill();

        // Olhos brancos
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX + 10, bodyY + 10, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, bodyY + 10, eyeSize, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = '#000000';
        const pupilY = this.grounded ? bodyY + 10 : bodyY + 12; // Olhar para baixo quando no ar
        ctx.beginPath();
        ctx.arc(screenX + 10, pupilY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, pupilY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Brilho nos olhos
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(screenX + 9, bodyY + 9, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 17, bodyY + 9, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Boca (sorrisinho com outline)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, bodyY + 18, 5, 0, Math.PI);
        ctx.stroke();

        // Indicador de carga do pulo (barra no topo vibrante)
        if (this.grounded && this.jumpTimer > this.jumpInterval * 0.7) {
            const chargePercent = (this.jumpTimer - this.jumpInterval * 0.7) / (this.jumpInterval * 0.3);

            // Outline preto da barra
            ctx.fillStyle = '#000000';
            ctx.fillRect(screenX - 1, screenY - 5, this.width + 2, 4);

            // Barra colorida pulsante
            const pulseColor = chargePercent > 0.8 ? '#ff3300' : '#ffff00';
            ctx.fillStyle = pulseColor;
            ctx.fillRect(screenX, screenY - 4, this.width * chargePercent, 2);
        }
    }
}
