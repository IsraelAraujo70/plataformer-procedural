import { CONFIG } from '../../config.js';
import { game } from '../../game.js';
import { Enemy } from '../Enemy.js';

// ============================================
// WALKER ENEMY - Patrulha horizontal básica
// ============================================
export class WalkerEnemy extends Enemy {
    constructor(x, y, platformWidth, platformY) {
        super(x, y, platformWidth, platformY, 'walker');

        this.vx = 1.5;
        this.points = 50;
        // Cores vibrantes estilo cartoon
        this.color = '#ff8800'; // Laranja vibrante
        this.colorDark = '#cc6600'; // Sombra
        this.colorLight = '#ffaa33'; // Highlight
    }

    update() {
        if (!this.alive) return;

        // Detectar borda antes de cair (edge detection)
        const checkDistance = 5;
        const futureX = this.vx > 0 ? this.x + this.width + checkDistance : this.x - checkDistance;
        const futureY = this.y + this.height + 5;

        // Verificar se há chão à frente
        let hasGroundAhead = false;
        const startChunk = Math.floor((futureX - 50) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((futureX + 50) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            for (let platform of chunk.platforms) {
                if (futureX > platform.x &&
                    futureX < platform.x + platform.width &&
                    futureY > platform.y - 10 &&
                    futureY < platform.y + platform.height) {
                    hasGroundAhead = true;
                    break;
                }
            }
            if (hasGroundAhead) break;
        }

        // Virar se não houver chão à frente
        if (!hasGroundAhead) {
            this.vx *= -1;
        }

        // Movimento horizontal
        this.x += this.vx * game.deltaTimeFactor;

        // Patrulha na plataforma (inverter direção nas bordas)
        if (this.x <= this.platformX || this.x + this.width >= this.platformX + this.platformWidth) {
            this.vx *= -1;
            this.x = Math.max(this.platformX, Math.min(this.x, this.platformX + this.platformWidth - this.width));
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
        const centerX = screenX + this.width / 2;
        const centerY = screenY + this.height / 2;
        const radius = this.width / 2;

        // OUTLINE PRETO GROSSO (estilo cartoon)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
        ctx.fill();

        // CORPO BLOB com gradiente (sombra interna)
        const gradient = ctx.createRadialGradient(
            centerX - radius * 0.3,
            centerY - radius * 0.3,
            0,
            centerX,
            centerY,
            radius
        );
        gradient.addColorStop(0, this.colorLight);
        gradient.addColorStop(0.6, this.color);
        gradient.addColorStop(1, this.colorDark);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();

        // HIGHLIGHT (brilho no topo)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.arc(centerX - radius * 0.25, centerY - radius * 0.3, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // OLHOS GRANDES com outline
        // Outline dos olhos
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 11, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, screenY + 11, 5, 0, Math.PI * 2);
        ctx.fill();

        // Brancos dos olhos
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 11, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, screenY + 11, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas grandes e expressivas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 10, screenY + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, screenY + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Brilho nos olhos
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(screenX + 9, screenY + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 17, screenY + 10, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // BOCA COM DENTES (estilo cartoon assustador)
        // Boca grande preta
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX, screenY + 22, 8, 0, Math.PI, false);
        ctx.fill();

        // Interior da boca (escuro)
        ctx.fillStyle = '#330000';
        ctx.beginPath();
        ctx.arc(centerX, screenY + 22, 6, 0, Math.PI, false);
        ctx.fill();

        // Dentes triangulares brancos
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 5; i++) {
            const toothX = screenX + 6 + i * 4;
            const toothY = screenY + 20;
            ctx.beginPath();
            ctx.moveTo(toothX, toothY);
            ctx.lineTo(toothX + 3, toothY);
            ctx.lineTo(toothX + 1.5, toothY + 4);
            ctx.closePath();
            ctx.fill();
        }
    }
}
