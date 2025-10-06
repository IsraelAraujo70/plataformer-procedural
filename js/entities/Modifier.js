import { game } from '../game.js';

// ============================================
// MODIFIER (Modificador)
// ============================================
export class Modifier {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.collected = false;
        this.rotation = 0;
        this.pulseTime = 0;

        // Lista de modificadores disponíveis
        let availableModifiers = ['jump', 'speed', 'shield', 'reverse', 'ice', 'doublejump', 'magnet', 'tiny', 'heavy', 'bouncy', 'timewarp'];

        // Swap só aparece em modo 2 jogadores
        if (game.twoPlayerMode) {
            availableModifiers.push('swap');
        }

        // Sortear tipo aleatoriamente
        this.type = availableModifiers[Math.floor(Math.random() * availableModifiers.length)];

        // Duração aleatória entre 2 e 15 segundos (120 a 900 frames a 60fps)
        this.duration = Math.floor(Math.random() * (900 - 120 + 1)) + 120;
    }

    update() {
        if (this.collected) return;

        this.rotation += 0.03;
        this.pulseTime += 0.1;

        // Mapeamento de cores por tipo de modificador
        const colors = {
            jump: '#00d9ff',
            speed: '#00ff88',
            shield: '#ffaa00',
            reverse: '#ff0066',
            ice: '#66ffff',
            doublejump: '#9d00ff',
            magnet: '#ffd700',
            tiny: '#ff1493',
            heavy: '#8b4513',
            bouncy: '#ff69b4',
            timewarp: '#9370db',
            swap: '#ff8c00'
        };

        // Colisão com Player 1
        if (this.intersects(game.player)) {
            // Se for swap e algum jogador estiver morto, transformar em outro modificador
            if (this.type === 'swap' && game.twoPlayerMode && game.player2) {
                if (game.player.dying || game.player.completelyDead || game.player2.dying || game.player2.completelyDead) {
                    const nonSwapModifiers = ['jump', 'speed', 'shield', 'reverse', 'ice', 'doublejump', 'magnet', 'tiny', 'heavy', 'bouncy', 'timewarp'];
                    this.type = nonSwapModifiers[Math.floor(Math.random() * nonSwapModifiers.length)];
                }
            }

            this.collected = true;

            // Em modo 2 jogadores, aplicar efeito em ambos
            if (game.twoPlayerMode && game.player2) {
                // Swap é especial: só precisa ser aplicado uma vez
                if (this.type === 'swap') {
                    this.applyEffect(game.player);
                } else {
                    this.applyEffect(game.player);
                    this.applyEffect(game.player2);
                }
            } else {
                this.applyEffect(game.player);
            }

            // Pontos vão apenas para quem coletou
            game.player.score += 25;
            game.player.stats.modifiersCollected++;
            game.stats.modifiersCollected++; // Também incrementar global para compatibilidade

            const color = colors[this.type] || '#ffffff';
            if (window.createFloatingText) {
                window.createFloatingText('+25', this.x + this.width / 2, this.y, color);
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, color, 12);
            }
        }

        // Colisão com Player 2 (se existir)
        if (game.player2 && !this.collected && this.intersects(game.player2)) {
            // Se for swap e algum jogador estiver morto, transformar em outro modificador
            if (this.type === 'swap' && game.twoPlayerMode && game.player) {
                if (game.player.dying || game.player.completelyDead || game.player2.dying || game.player2.completelyDead) {
                    const nonSwapModifiers = ['jump', 'speed', 'shield', 'reverse', 'ice', 'doublejump', 'magnet', 'tiny', 'heavy', 'bouncy', 'timewarp'];
                    this.type = nonSwapModifiers[Math.floor(Math.random() * nonSwapModifiers.length)];
                }
            }

            this.collected = true;

            // Em modo 2 jogadores, aplicar efeito em ambos
            if (game.twoPlayerMode && game.player) {
                // Swap é especial: só precisa ser aplicado uma vez
                if (this.type === 'swap') {
                    this.applyEffect(game.player);
                } else {
                    this.applyEffect(game.player);
                    this.applyEffect(game.player2);
                }
            } else {
                this.applyEffect(game.player2);
            }

            // Pontos vão apenas para quem coletou
            game.player2.score += 25;
            game.player2.stats.modifiersCollected++;
            game.stats.modifiersCollected++; // Também incrementar global para compatibilidade

            const color = colors[this.type] || '#ffffff';
            if (window.createFloatingText) {
                window.createFloatingText('+25', this.x + this.width / 2, this.y, color);
            }
            if (window.createParticles) {
                window.createParticles(this.x + this.width / 2, this.y + this.height / 2, color, 12);
            }
        }
    }

    applyEffect(player) {
        if (this.type === 'jump') {
            // Aumentar força do pulo por duração aleatória (2-15s)
            player.jumpBoost = 1.4; // 40% mais forte
            player.jumpBoostTime = this.duration;
            player.jumpBoostMaxTime = this.duration;
        } else if (this.type === 'speed') {
            // Aumentar velocidade por duração aleatória (2-15s)
            player.speedBoost = 1.5; // 50% mais rápido
            player.speedBoostTime = this.duration;
            player.speedBoostMaxTime = this.duration;
        } else if (this.type === 'shield') {
            // Escudo que absorve 1 hit
            player.shield = true;
            player.shieldTime = this.duration;
            player.shieldMaxTime = this.duration;
        } else if (this.type === 'reverse') {
            // Controles invertidos
            player.reverseControls = true;
            player.reverseControlsTime = this.duration;
            player.reverseControlsMaxTime = this.duration;
        } else if (this.type === 'ice') {
            // Fricção muito reduzida (efeito de gelo)
            player.icyFloor = true;
            player.icyFloorTime = this.duration;
            player.icyFloorMaxTime = this.duration;
        } else if (this.type === 'doublejump') {
            // Permite double jump no ar
            player.doubleJumpEnabled = true;
            player.doubleJumpTime = this.duration;
            player.doubleJumpMaxTime = this.duration;
            player.hasDoubleJump = true;
        } else if (this.type === 'magnet') {
            // Atrai moedas e modificadores automaticamente
            player.magnetActive = true;
            player.magnetTime = this.duration;
            player.magnetMaxTime = this.duration;
        } else if (this.type === 'tiny') {
            // Reduz tamanho do jogador
            player.tinyPlayer = true;
            player.tinyPlayerTime = this.duration;
            player.tinyPlayerMaxTime = this.duration;
            player.width = player.width * 0.5;
            player.height = player.height * 0.5;
        } else if (this.type === 'heavy') {
            // Aumenta gravidade e reduz pulo
            player.heavy = true;
            player.heavyTime = this.duration;
            player.heavyMaxTime = this.duration;
        } else if (this.type === 'bouncy') {
            // Bounce automático ao colidir com plataformas
            player.bouncy = true;
            player.bouncyTime = this.duration;
            player.bouncyMaxTime = this.duration;
        } else if (this.type === 'timewarp') {
            // Acelera todo o jogo
            player.timeWarp = true;
            player.timeWarpTime = this.duration;
            player.timeWarpMaxTime = this.duration;
        } else if (this.type === 'swap') {
            // Troca posição dos jogadores (apenas em 2P mode)
            if (game.twoPlayerMode && game.player && game.player2) {
                const tempX = game.player.x;
                const tempY = game.player.y;
                const tempVX = game.player.vx;
                const tempVY = game.player.vy;

                game.player.x = game.player2.x;
                game.player.y = game.player2.y;
                game.player.vx = game.player2.vx;
                game.player.vy = game.player2.vy;

                game.player2.x = tempX;
                game.player2.y = tempY;
                game.player2.vx = tempVX;
                game.player2.vy = tempVY;

                // Efeitos visuais para swap
                if (window.createParticles) {
                    window.createParticles(game.player.x + game.player.width / 2, game.player.y + game.player.height / 2, '#ff8c00', 30);
                    window.createParticles(game.player2.x + game.player2.width / 2, game.player2.y + game.player2.height / 2, '#ff8c00', 30);
                }
                if (window.createFloatingText) {
                    window.createFloatingText('SWAP!', game.player.x + game.player.width / 2, game.player.y, '#ff8c00');
                    window.createFloatingText('SWAP!', game.player2.x + game.player2.width / 2, game.player2.y, '#ff8c00');
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

        const screenX = this.x - game.camera.x + this.width / 2;
        const screenY = this.y - game.camera.y + this.height / 2;

        // Efeito de pulso
        const pulse = 1 + Math.sin(this.pulseTime) * 0.2;
        const size = this.width * pulse;

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Aura/outline circular externo
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, size / 2 + 2, 0, Math.PI * 2);
        ctx.stroke();

        // Visual único - gradiente arco-íris animado
        const gradientRotation = this.pulseTime * 0.5;
        const gradient = ctx.createLinearGradient(
            Math.cos(gradientRotation) * size,
            Math.sin(gradientRotation) * size,
            -Math.cos(gradientRotation) * size,
            -Math.sin(gradientRotation) * size
        );

        gradient.addColorStop(0, '#ff00ff');    // Magenta
        gradient.addColorStop(0.33, '#00d9ff'); // Ciano
        gradient.addColorStop(0.66, '#00ff88'); // Verde
        gradient.addColorStop(1, '#ffff00');    // Amarelo

        ctx.fillStyle = gradient;
        ctx.shadowBlur = 0;

        // Desenhar círculo
        ctx.beginPath();
        ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        ctx.fill();

        // Símbolo de interrogação no centro
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('?', 0, 0);

        ctx.restore();
    }
}
