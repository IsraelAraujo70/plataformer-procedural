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
        this.color = '#9d00ff'; // Roxo

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
            game.stats.enemiesDefeated++;

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

        // Asas (desenhar primeiro para ficar atrás)
        const wingFlap = Math.sin(Date.now() / 100) * 4; // Movimento das asas
        ctx.fillStyle = '#6a0099'; // Roxo mais escuro

        // Asa esquerda
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY + 10);
        ctx.lineTo(screenX - 2, screenY + 6 + wingFlap);
        ctx.lineTo(screenX + 8, screenY + 14);
        ctx.fill();

        // Asa direita
        ctx.beginPath();
        ctx.moveTo(screenX + 20, screenY + 10);
        ctx.lineTo(screenX + 30, screenY + 6 + wingFlap);
        ctx.lineTo(screenX + 20, screenY + 14);
        ctx.fill();

        // Corpo do inimigo (roxo, formato mais arredondado)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(screenX + 14, screenY + 14, 14, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Olhos grandes (característico de voador)
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
        ctx.arc(screenX + 9, screenY + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 19, screenY + 12, 2, 0, Math.PI * 2);
        ctx.fill();

        // Antenas pequenas no topo
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX + 10, screenY + 4);
        ctx.lineTo(screenX + 8, screenY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(screenX + 18, screenY + 4);
        ctx.lineTo(screenX + 20, screenY);
        ctx.stroke();

        // Bolinhas nas antenas
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX + 8, screenY, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 20, screenY, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}
