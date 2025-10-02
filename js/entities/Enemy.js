import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// ENEMY
// ============================================
export class Enemy {
    constructor(x, y, platformWidth, platformY) {
        this.x = x;
        this.y = y;
        this.width = CONFIG.ENEMY_SIZE;
        this.height = CONFIG.ENEMY_SIZE;
        this.vx = 1.5;
        this.vy = 0;
        this.platformX = x;
        this.platformWidth = platformWidth;
        this.platformY = platformY; // Guardar Y da plataforma
        this.alive = true;
        this.grounded = false;
    }

    update() {
        if (!this.alive) return;

        // Detectar borda antes de cair (edge detection)
        const checkDistance = 5; // pixels à frente para verificar
        const futureX = this.vx > 0 ? this.x + this.width + checkDistance : this.x - checkDistance;
        const futureY = this.y + this.height + 5; // Um pouco abaixo dos pés

        // Verificar se há chão à frente
        let hasGroundAhead = false;
        const startChunk = Math.floor((futureX - 50) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));
        const endChunk = Math.floor((futureX + 50) / (CONFIG.CHUNK_WIDTH * CONFIG.TILE_SIZE));

        for (let chunkIdx = startChunk; chunkIdx <= endChunk; chunkIdx++) {
            const chunk = game.chunks.get(chunkIdx);
            if (!chunk) continue;

            for (let platform of chunk.platforms) {
                // Verificar se há plataforma à frente e abaixo dos pés
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

        // Virar se não houver chão à frente (evitar cair)
        if (!hasGroundAhead) {
            this.vx *= -1;
        }

        // Movimento horizontal
        this.x += this.vx;

        // Patrulha na plataforma (inverter direção nas bordas)
        if (this.x <= this.platformX || this.x + this.width >= this.platformX + this.platformWidth) {
            this.vx *= -1;
            this.x = Math.max(this.platformX, Math.min(this.x, this.platformX + this.platformWidth - this.width));
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

            // Adicionar pontos por derrotar inimigo
            player.score += 50;
            game.stats.enemiesDefeated++;

            // createFloatingText e createParticles serão importados no main.js
            if (window.createFloatingText) {
                window.createFloatingText('+50', this.x + this.width / 2, this.y, '#ffff00');
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ff8800', 8);
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

    draw(ctx) {
        if (!this.alive) return;

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        // Corpo do inimigo (laranja)
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(screenX, screenY, this.width, this.height);

        // Olhos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenX + 6, screenY + 8, 4, 6);
        ctx.fillRect(screenX + 18, screenY + 8, 4, 6);

        // Pupilas
        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX + 8, screenY + 10, 2, 2);
        ctx.fillRect(screenX + 20, screenY + 10, 2, 2);

        // Dentes
        ctx.fillStyle = '#ffffff';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(screenX + 6 + i * 4, screenY + 20, 3, 4);
        }
    }
}
