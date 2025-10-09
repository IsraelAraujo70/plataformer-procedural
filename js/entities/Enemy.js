import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// ENEMY BASE CLASS
// ============================================
export class Enemy {
    constructor(x, y, platformWidth, platformY, type = 'walker') {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ENEMY_SIZE;
        this.height = CONFIG.ENEMY_SIZE;
        this.vx = 1.5;
        this.vy = 0;
        this.platformX = x;
        this.platformWidth = platformWidth;
        this.platformY = platformY;
        this.alive = true;
        this.grounded = false;
        this.type = type;

        // Pontos por derrotar (pode ser modificado por subclasses)
        this.points = 50;

        // Cor padrão (pode ser modificado por subclasses)
        this.color = '#ff8800';

        // Sistema de piscar olhos (igual ao player)
        this.blinkTimer = 0;
        this.blinkDuration = 0;
        this.isBlinking = false;
        this.nextBlinkTime = Math.random() * 180 + 120; // 2-5 segundos (offset random por inimigo)
    }

    updateBlink() {
        this.blinkTimer += game.deltaTimeFactor;

        if (this.isBlinking) {
            this.blinkDuration += game.deltaTimeFactor;
            if (this.blinkDuration >= 8) { // Piscar dura 8 frames
                this.isBlinking = false;
                this.blinkDuration = 0;
                this.nextBlinkTime = this.blinkTimer + Math.random() * 180 + 120;
            }
        } else if (this.blinkTimer >= this.nextBlinkTime) {
            this.isBlinking = true;
            this.blinkTimer = 0;
        }
    }

    update() {
        // Atualizar piscar de olhos
        this.updateBlink();
        if (!this.alive) return;

        // Colisão com Player 1
        if (this.intersects(game.player)) {
            this.handlePlayerCollision(game.player);
        }

        // Colisão com Player 2 (se existir)
        if (game.player2 && this.alive && this.intersects(game.player2)) {
            this.handlePlayerCollision(game.player2);
        }
    }

    handlePlayerCollision(player) {
        // Detectar stomp (jogador caindo sobre o inimigo)
        if (player.vy > CONFIG.STOMP_THRESHOLD &&
            player.y + player.height < this.y + this.height * 0.5) {
            this.alive = false;
            player.vy = CONFIG.JUMP_STRENGTH * 0.5; // Mini bounce

            // Som de stomp
            game.soundManager?.playStomp();

            // Adicionar pontos por derrotar inimigo
            player.score += this.points;
            player.stats.enemiesDefeated++;
            game.stats.enemiesDefeated++; // Também incrementar global para compatibilidade

            // createFloatingText e createParticles serão importados no main.js
            if (window.createFloatingText) {
                window.createFloatingText(`+${this.points}`, this.x + this.width / 2, this.y, '#ffff00');
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, this.color, 8);
            }
        } else {
            // Jogador toma dano
            player.takeDamage();
        }
    }

    handlePlatformCollisions() {
        const startChunk = Math.floor((this.x - 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((this.x + 200) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            chunk.platforms.forEach(platform => {
                if (this.intersectsPlatform(platform)) {
                    const overlapLeft = (this.x + this.width) - platform.x;
                    const overlapRight = (platform.x + platform.width) - this.x;
                    const overlapTop = (this.y + this.height) - platform.y;
                    const overlapBottom = (platform.y + platform.height) - this.y;

                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

                    // Colisão de cima (pousar na plataforma)
                    if (minOverlap === overlapTop && this.vy >= 0) {
                        this.y = platform.y - this.height;
                        this.vy = 0;
                        this.grounded = true;
                    }
                }
            });
        }
    }

    intersectsPlatform(platform) {
        return this.x < platform.x + platform.width &&
               this.x + this.width > platform.x &&
               this.y < platform.y + platform.height &&
               this.y + this.height > platform.y;
    }

    intersects(player) {
        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    // Método para ser sobrescrito pelas subclasses
    draw(ctx) {
        // Implementação base - será sobrescrita
    }
}
