import { CONFIG } from '../../config.js';
import { game } from '../../game.js';
import { Enemy } from '../Enemy.js';
import { Projectile } from '../Projectile.js';

// ============================================
// SHOOTER ENEMY - Fica parado e dispara projéteis
// ============================================
export class ShooterEnemy extends Enemy {
    constructor(x, y, platformWidth, platformY) {
        super(x, y, platformWidth, platformY, 'shooter');

        // Configuração específica do Shooter
        this.vx = 0; // Shooter não se move
        this.points = 100; // Vale mais pontos (mais perigoso)
        this.color = '#ff00ff'; // Magenta/Rosa

        // Parâmetros de disparo
        this.shootTimer = 0;
        this.shootInterval = 120; // Dispara a cada 2 segundos (60fps)
        this.projectileSpeed = 4;
        this.detectionRange = 300; // Distância para detectar jogador
        this.canShoot = false;

        // Telegraph (antecipação de ataque)
        this.telegraphTime = 0;
        this.telegraphDuration = 15; // 0.25s a 60fps
        this.isTelegraphing = false;

        // Posição fixa (shooter não patrulha)
        this.centerX = x + this.width / 2;
    }

    update() {
        if (!this.alive) return;

        // Shooter não se move horizontalmente, mas pode cair
        this.vx = 0;

        // Gravidade
        this.vy += CONFIG.GRAVITY * game.deltaTimeFactor;
        this.y += this.vy * game.deltaTimeFactor;

        // Colisão com plataformas
        this.grounded = false;
        this.handlePlatformCollisions();

        // Limitar vy
        if (this.vy > 10) this.vy = 10;

        // Detectar jogador mais próximo para mirar
        const targetPlayer = this.detectNearestPlayer();

        // Timer de disparo com telegraph
        if (targetPlayer && this.grounded) {
            this.shootTimer += game.deltaTimeFactor;

            // Quando o timer atingir o intervalo, começar telegraph
            if (this.shootTimer >= this.shootInterval && !this.isTelegraphing) {
                this.isTelegraphing = true;
                this.telegraphTime = 0;
            }

            // Atualizar telegraph
            if (this.isTelegraphing) {
                this.telegraphTime += game.deltaTimeFactor;

                if (this.telegraphTime >= this.telegraphDuration) {
                    // AGORA SIM atirar!
                    this.shoot(targetPlayer);
                    this.shootTimer = 0;
                    this.isTelegraphing = false;
                    this.telegraphTime = 0;
                }
            }
        } else {
            // Resetar timer e telegraph se não houver alvo
            this.shootTimer = Math.max(0, this.shootTimer - 2);
            this.isTelegraphing = false;
            this.telegraphTime = 0;
        }

        // Remover se cair do mundo
        if (this.y > game.height + 100) {
            this.alive = false;
        }

        // Chamada para colisão com jogadores (método da classe pai)
        super.update();
    }

    detectNearestPlayer() {
        let closestPlayer = null;
        let closestDistance = Infinity;

        // Verificar Player 1
        if (game.player && !game.player.dying) {
            const dx = game.player.x - this.x;
            const dy = game.player.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance && distance < this.detectionRange) {
                closestDistance = distance;
                closestPlayer = game.player;
            }
        }

        // Verificar Player 2 (se existir)
        if (game.player2 && !game.player2.dying) {
            const dx = game.player2.x - this.x;
            const dy = game.player2.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < closestDistance && distance < this.detectionRange) {
                closestDistance = distance;
                closestPlayer = game.player2;
            }
        }

        return closestPlayer;
    }

    shoot(targetPlayer) {
        if (!game.projectiles) {
            game.projectiles = [];
        }

        // Som de disparo
        game.soundManager?.playShoot();

        // Calcular direção do projétil (mirar no jogador)
        const startX = this.x + this.width / 2;
        const startY = this.y + this.height / 2;

        const dx = (targetPlayer.x + targetPlayer.width / 2) - startX;
        const dy = (targetPlayer.y + targetPlayer.height / 2) - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalizar direção e aplicar velocidade
        const vx = (dx / distance) * this.projectileSpeed;
        const vy = (dy / distance) * this.projectileSpeed;

        // Criar projétil
        const projectile = new Projectile(startX - 4, startY - 4, vx, vy, this);
        game.projectiles.push(projectile);

        // Efeito visual de disparo
        if (window.createParticles) {
            window.createParticles(startX, startY, '#ffaa00', 3);
        }
    }

    draw(ctx) {
        if (!this.alive) return;

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Base/canhão (desenhar primeiro)
        ctx.fillStyle = '#cc00cc'; // Magenta escuro
        ctx.fillRect(screenX + 4, screenY + 18, 20, 10);

        // Corpo principal (magenta) com flash vermelho durante telegraph
        if (this.isTelegraphing) {
            // Piscar vermelho durante telegraph
            const flash = Math.floor(this.telegraphTime / 3) % 2; // Alterna a cada 3 frames
            ctx.fillStyle = flash ? '#ff0000' : this.color;
        } else {
            ctx.fillStyle = this.color;
        }
        ctx.fillRect(screenX, screenY, this.width, this.height - 10);

        // Overlay vermelho semi-transparente durante telegraph
        if (this.isTelegraphing) {
            const intensity = this.telegraphTime / this.telegraphDuration;
            ctx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.5})`;
            ctx.fillRect(screenX, screenY, this.width, this.height - 10);
        }

        // Detectar jogador mais próximo para direcionar o canhão
        const targetPlayer = this.detectNearestPlayer();
        let cannonAngle = 0;

        if (targetPlayer) {
            const dx = (targetPlayer.x + targetPlayer.width / 2) - (this.x + this.width / 2);
            const dy = (targetPlayer.y + targetPlayer.height / 2) - (this.y + this.height / 2);
            cannonAngle = Math.atan2(dy, dx);
        }

        // Canhão (rotacionado para mirar no jogador)
        ctx.save();
        ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
        ctx.rotate(cannonAngle);

        // Tubo do canhão
        ctx.fillStyle = '#660066'; // Magenta muito escuro
        ctx.fillRect(0, -3, 12, 6);

        // Ponta do canhão
        ctx.fillStyle = '#ffaa00'; // Laranja (energia)
        ctx.fillRect(10, -2, 4, 4);

        ctx.restore();

        // Olho único (tipo ciclope/torreta) com PISCAR
        const eyeSquash = this.isBlinking ? 0.1 : 1.0;

        // Outline preto do olho
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(screenX + 14, screenY + 10, 7, 7 * eyeSquash, 0, 0, Math.PI * 2);
        ctx.fill();

        // Branco do olho (só se não estiver completamente fechado)
        if (eyeSquash > 0.15) {
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.ellipse(screenX + 14, screenY + 10, 6, 6 * eyeSquash, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Pupila (olhando na direção do alvo) (só se não estiver piscando muito)
        if (eyeSquash > 0.3) {
            ctx.fillStyle = '#ff0000'; // Vermelho (agressivo)
            if (targetPlayer) {
                const pupilOffsetX = Math.cos(cannonAngle) * 2;
                const pupilOffsetY = Math.sin(cannonAngle) * 2;
                ctx.beginPath();
                ctx.arc(screenX + 14 + pupilOffsetX, screenY + 10 + pupilOffsetY, 3 * eyeSquash, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(screenX + 14, screenY + 10, 3 * eyeSquash, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Indicador de carga do disparo (anel ao redor do olho)
        if (targetPlayer && this.shootTimer > this.shootInterval * 0.6) {
            const chargePercent = (this.shootTimer - this.shootInterval * 0.6) / (this.shootInterval * 0.4);
            ctx.strokeStyle = `rgba(255, 170, 0, ${chargePercent})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(screenX + 14, screenY + 10, 8 + Math.sin(Date.now() / 100) * 2, 0, Math.PI * 2 * chargePercent);
            ctx.stroke();
        }

        // Efeito de mira quando tem alvo
        if (targetPlayer) {
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(screenX + this.width / 2, screenY + this.height / 2);
            const lineEndX = (targetPlayer.x + targetPlayer.width / 2) - game.camera.x;
            const lineEndY = (targetPlayer.y + targetPlayer.height / 2) - game.camera.y;
            ctx.lineTo(lineEndX, lineEndY);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}
