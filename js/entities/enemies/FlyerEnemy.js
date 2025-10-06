import { CONFIG } from '../../config.js';
import { game } from '../../game.js';
import { Enemy } from '../Enemy.js';

// ============================================
// FLYER ENEMY - Voa em padrão senoidal
// ============================================
export class FlyerEnemy extends Enemy {
    constructor(x, y, platformWidth, platformY) {
        super(x, y, platformWidth, platformY, 'flyer');

        // Configuração específica do Flyer
        this.vx = 2; // Um pouco mais rápido
        this.points = 75; // Vale mais pontos
        // Cores vibrantes estilo cartoon
        this.color = '#9d00ff'; // Roxo vibrante
        this.colorDark = '#6a0099'; // Sombra
        this.colorLight = '#cc33ff'; // Highlight

        // Parâmetros do movimento senoidal
        this.baseY = y; // Altura base
        this.waveAmplitude = 40; // Amplitude da onda vertical
        this.waveSpeed = 0.05; // Velocidade da oscilação
        this.waveOffset = Math.random() * Math.PI * 2; // Offset aleatório para variar

        // Flyer não usa gravidade
        this.vy = 0;

        // Área de patrulha maior
        this.patrolRange = platformWidth * 2; // 2x o tamanho da plataforma
        this.patrolStartX = x - platformWidth / 2;
    }

    update() {
        if (!this.alive) return;

        // Movimento horizontal
        this.x += this.vx;

        // Patrulha em área maior (não limitado à plataforma)
        if (this.x <= this.patrolStartX || this.x >= this.patrolStartX + this.patrolRange) {
            this.vx *= -1;
            this.x = Math.max(this.patrolStartX, Math.min(this.x, this.patrolStartX + this.patrolRange));
        }

        // Movimento senoidal vertical (oscilação)
        const time = Date.now() / 1000;
        this.y = this.baseY + Math.sin(time * this.waveSpeed * 100 + this.waveOffset) * this.waveAmplitude;

        // Remover se cair muito longe do mundo
        if (this.y > game.height + 200 || this.y < -200) {
            this.alive = false;
        }

        // Flyer não precisa de colisão com plataformas (voa sobre elas)
        this.grounded = false;

        // Chamada para colisão com jogadores (método da classe pai)
        super.update();
    }

    handlePlayerCollision(player) {
        // Flyer sempre pode ser derrotado por stomp (mesmo voando)
        if (player.vy > CONFIG.STOMP_THRESHOLD &&
            player.y + player.height < this.y + this.height * 0.6) {
            this.alive = false;
            player.vy = CONFIG.JUMP_STRENGTH * 0.5;

            player.score += this.points;
            player.stats.enemiesDefeated++;
            game.stats.enemiesDefeated++; // Também incrementar global para compatibilidade

            if (window.createFloatingText) {
                window.createFloatingText(`+${this.points}`, this.x + this.width / 2, this.y, '#ffff00');
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 12);
            }
        } else {
            player.takeDamage();
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;
        const centerX = screenX + 14;
        const centerY = screenY + 14;

        // Asas (desenhar primeiro para ficar atrás) com outline
        const wingFlap = Math.sin(Date.now() / 100) * 4; // Movimento das asas

        // Outline preto das asas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 10);
        ctx.lineTo(screenX - 4, screenY + 6 + wingFlap);
        ctx.lineTo(screenX + 8, screenY + 16);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + 20, screenY + 10);
        ctx.lineTo(screenX + 32, screenY + 6 + wingFlap);
        ctx.lineTo(screenX + 20, screenY + 16);
        ctx.fill();

        // Asas coloridas
        ctx.fillStyle = this.colorDark;
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 10);
        ctx.lineTo(screenX - 2, screenY + 6 + wingFlap);
        ctx.lineTo(screenX + 8, screenY + 14);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(screenX + 20, screenY + 10);
        ctx.lineTo(screenX + 30, screenY + 6 + wingFlap);
        ctx.lineTo(screenX + 20, screenY + 14);
        ctx.fill();

        // OUTLINE PRETO do corpo
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // CORPO BLOB com gradiente
        const gradient = ctx.createRadialGradient(
            centerX - 5,
            centerY - 5,
            0,
            centerX,
            centerY,
            14
        );
        gradient.addColorStop(0, this.colorLight);
        gradient.addColorStop(0.6, this.color);
        gradient.addColorStop(1, this.colorDark);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // HIGHLIGHT
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.beginPath();
        ctx.ellipse(centerX - 4, centerY - 4, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Olhos grandes com outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 9, screenY + 12, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 19, screenY + 12, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX + 9, screenY + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 19, screenY + 12, 4, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 9, screenY + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 19, screenY + 12, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Brilho
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY + 11, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 18, screenY + 11, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Antenas com outline
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 4);
        ctx.lineTo(screenX + 8, screenY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 18, screenY + 4);
        ctx.lineTo(screenX + 20, screenY);
        ctx.stroke();

        ctx.strokeStyle = this.colorDark;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 4);
        ctx.lineTo(screenX + 8, screenY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 18, screenY + 4);
        ctx.lineTo(screenX + 20, screenY);
        ctx.stroke();

        // Bolinhas nas antenas com outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 20, screenY, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 20, screenY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
