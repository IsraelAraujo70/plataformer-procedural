import { CONFIG } from '../../config.js';
import { game } from '../../game.js';
import { Enemy } from '../Enemy.js';
import { worldToIso, drawIsoShadow } from '../../utils/Isometric.js';

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

        const worldX = this.x;
        const worldY = this.y;
        const worldZ = 0;

        // Converter para isométrico
        const isoPos = worldToIso(worldX, worldY, worldZ);
        const screenX = isoPos.isoX - game.camera.x;
        const screenY = isoPos.isoY - game.camera.y;

        // Sombra projetada no chão
        drawIsoShadow(ctx, worldX, worldY, 0, this.width, this.width);

        // Movimento das asas (batida)
        const wingFlap = Math.sin(Date.now() / 100) * 6; // Amplitude da batida
        const wingAngle = Math.sin(Date.now() / 100) * 0.3; // Ângulo de rotação

        // === ASAS 3D ISOMÉTRICAS ===
        const wingColor = '#6a0099'; // Roxo escuro
        const wingHighlight = '#8a00cc'; // Roxo claro para volume

        // Asa esquerda (atrás do corpo)
        ctx.fillStyle = wingColor;
        ctx.beginPath();
        ctx.moveTo(screenX - 8, screenY - 2);
        ctx.lineTo(screenX - 18, screenY - 8 + wingFlap);
        ctx.lineTo(screenX - 14, screenY + 4 + wingFlap);
        ctx.lineTo(screenX - 6, screenY + 6);
        ctx.closePath();
        ctx.fill();

        // Highlight na asa esquerda (volume)
        ctx.fillStyle = wingHighlight;
        ctx.beginPath();
        ctx.moveTo(screenX - 8, screenY - 2);
        ctx.lineTo(screenX - 12, screenY - 5 + wingFlap * 0.7);
        ctx.lineTo(screenX - 10, screenY + 2 + wingFlap * 0.7);
        ctx.lineTo(screenX - 6, screenY + 6);
        ctx.closePath();
        ctx.fill();

        // Asa direita (atrás do corpo)
        ctx.fillStyle = wingColor;
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY - 2);
        ctx.lineTo(screenX + 18, screenY - 8 + wingFlap);
        ctx.lineTo(screenX + 14, screenY + 4 + wingFlap);
        ctx.lineTo(screenX + 6, screenY + 6);
        ctx.closePath();
        ctx.fill();

        // Highlight na asa direita (volume)
        ctx.fillStyle = wingHighlight;
        ctx.beginPath();
        ctx.moveTo(screenX + 8, screenY - 2);
        ctx.lineTo(screenX + 12, screenY - 5 + wingFlap * 0.7);
        ctx.lineTo(screenX + 10, screenY + 2 + wingFlap * 0.7);
        ctx.lineTo(screenX + 6, screenY + 6);
        ctx.closePath();
        ctx.fill();

        // === CORPO 3D (ESFERA) ===
        // Corpo principal (roxo)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY, this.width / 2, this.width / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Volume do corpo (lado escuro)
        const darkColor = this.darkenColor(this.color, 0.6);
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(screenX + 4, screenY + 4, this.width / 2.5, this.width / 4, 0, 0, Math.PI);
        ctx.fill();

        // === OLHOS 3D ===
        // Brancos dos olhos
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(screenX - 6, screenY - 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(screenX + 2, screenY - 4, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(screenX - 6, screenY - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 2, screenY - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // === ANTENAS 3D ===
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;

        // Antena esquerda
        ctx.beginPath();
        ctx.moveTo(screenX - 4, screenY - 10);
        ctx.lineTo(screenX - 8, screenY - 16);
        ctx.stroke();

        // Antena direita
        ctx.beginPath();
        ctx.moveTo(screenX + 4, screenY - 10);
        ctx.lineTo(screenX + 6, screenY - 16);
        ctx.stroke();

        // Bolinhas nas antenas
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX - 8, screenY - 16, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 6, screenY - 16, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Brilho nas bolinhas (efeito 3D)
        ctx.fillStyle = wingHighlight;
        ctx.beginPath();
        ctx.arc(screenX - 9, screenY - 17, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(screenX + 5, screenY - 17, 1, 0, Math.PI * 2);
        ctx.fill();
    }
}
