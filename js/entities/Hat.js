import { CONFIG } from '../config.js';
import { game } from '../game.js';

// ============================================
// TIPOS DE CHAPÉUS BASEADOS EM BIOMAS
// ============================================
export const HAT_TYPES = {
    PLAINS: {
        name: 'Cowboy Hat',
        biome: 'plains',
        colors: {
            main: '#8B4513', // Marrom cowboy
            band: '#654321',
            accent: '#DAA520' // Dourado
        },
        effect: null // Nenhum efeito especial
    },

    CAVE: {
        name: 'Miner Helmet',
        biome: 'cave',
        colors: {
            main: '#2C3E50', // Cinza escuro
            band: '#34495E',
            accent: '#F1C40F', // Amarelo (luz da lanterna)
            light: '#FFF8DC' // Luz branca
        },
        effect: 'light' // Proporciona iluminação extra
    },

    ICE: {
        name: 'Fur Hat',
        biome: 'ice',
        colors: {
            main: '#F8F8FF', // Branco neve
            band: '#DCDCDC',
            accent: '#87CEEB', // Azul gelo
            fur: '#FFFACD' // Branco amarelado
        },
        effect: 'warmth' // Reduz deslizamento no gelo
    },

    DESERT: {
        name: 'Turban',
        biome: 'desert',
        colors: {
            main: '#F4A460', // Areia
            band: '#D2691E',
            accent: '#FFD700', // Ouro
            pattern: '#CD853F'
        },
        effect: 'heat_resistance' // Reduz efeito de calor nos inimigos
    },

    SKY: {
        name: 'Pilot Cap',
        biome: 'sky',
        colors: {
            main: '#4682B4', // Azul aviador
            band: '#2E8B57',
            accent: '#FFFFFF', // Branco
            goggles: '#000000' // Preto
        },
        effect: 'jump_boost' // Pequeno boost no pulo
    },

    APOCALYPSE: {
        name: 'Combat Helmet',
        biome: 'apocalypse',
        colors: {
            main: '#2F2F2F', // Cinza militar
            band: '#1C1C1C',
            accent: '#8B0000', // Vermelho sangue
            camo: '#696969'
        },
        effect: 'damage_reduction' // Reduz dano dos inimigos
    },

    MOON: {
        name: 'Astronaut Helmet',
        biome: 'moon',
        colors: {
            main: '#C0C0C0', // Prata
            band: '#A9A9A9',
            accent: '#4169E1', // Azul royal
            visor: '#87CEEB' // Azul claro (visor)
        },
        effect: 'low_gravity' // Melhora controle em baixa gravidade
    },

    BLACK_HOLE: {
        name: 'Void Crown',
        biome: 'black_hole',
        colors: {
            main: '#0D0D0D', // Preto absoluto
            band: '#1A0F2E',
            accent: '#FF6B35', // Laranja energia
            energy: '#8A2BE2' // Roxo energia
        },
        effect: 'ultimate' // Todos os efeitos + invencibilidade temporária
    }
};

// ============================================
// HAT (Chapéu)
// ============================================
export class Hat {
    constructor(x, y, type = 'collectable', biomeType = 'plains') {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 16;
        this.type = type; // 'collectable' ou 'dropping'

        // Validar e normalizar biomeType
        const validBiomes = ['plains', 'cave', 'ice', 'desert', 'sky', 'apocalypse', 'moon', 'black_hole'];
        const normalizedBiome = biomeType.toLowerCase();

        if (!validBiomes.includes(normalizedBiome)) {
            console.warn(`⚠️ Invalid biome type "${biomeType}", defaulting to "plains"`);
            this.biomeType = 'plains';
        } else {
            this.biomeType = normalizedBiome;
        }

        this.hatData = HAT_TYPES[this.biomeType.toUpperCase()] || HAT_TYPES.PLAINS;
        this.collected = false;

        // Animação
        this.bobTime = 0;
        this.alpha = 1.0;

        if (this.type === 'dropping') {
            // Chapéu sendo perdido - física temporária
            this.vx = Math.random() * 4 - 2; // Impulso horizontal aleatório
            this.vy = -8; // Impulso para cima
            this.rotation = 0;
            this.rotationSpeed = (Math.random() - 0.5) * 0.3;
            this.lifetime = 0;
            this.maxLifetime = 60; // ~1 segundo a 60fps
        } else {
            // Chapéu coletável no mapa
            this.vx = 0;
            this.vy = 0;
            this.rotation = 0;
        }
    }

    update() {
        if (this.collected) return;

        if (this.type === 'dropping') {
            // ============================================
            // MODO: Chapéu caindo (não coletável)
            // ============================================
            this.lifetime += game.deltaTimeFactor;

            // Física simples
            this.vy += CONFIG.GRAVITY * 0.5 * game.deltaTimeFactor;
            this.x += this.vx * game.deltaTimeFactor;
            this.y += this.vy * game.deltaTimeFactor;
            this.rotation += this.rotationSpeed * game.deltaTimeFactor;

            // Fade out progressivo
            this.alpha = 1.0 - (this.lifetime / this.maxLifetime);

            // Remover quando acabar tempo
            if (this.lifetime >= this.maxLifetime) {
                this.collected = true;

                // Partículas finais
                if (window.createParticles) {
                    window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#8b4513', 8);
                }
            }

        } else {
            // ============================================
            // MODO: Chapéu coletável (item no mapa)
            // ============================================
            this.bobTime += 0.1;

            // Colisão com Player 1
            if (this.intersects(game.player)) {
                // Verificar se pode coletar (ainda não atingiu o limite)
                if (game.player.hatCount < game.player.maxHats) {
                    // Coletar chapéu (qualquer tipo, pode repetir)
                    this.collected = true;
                    game.player.hatCount++;
                    game.player.hatTypes.push(this.biomeType);

                    // Som de coletar chapéu
                    game.soundManager?.playHatCollect();

                    // Aplicar efeito especial do chapéu coletado
                    game.player.applyHatEffect(this.biomeType, 'gain');

                    // Efeitos visuais
                    if (window.createFloatingText) {
                        window.createFloatingText(`${this.hatData.name}! (${game.player.hatCount}/${game.player.maxHats})`, this.x + this.width / 2, this.y, '#ffd700');
                    }
                    if (window.createParticles) {
                        window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 20);
                    }
                } else {
                    // Já está no máximo de chapéus
                    if (window.createFloatingText) {
                        window.createFloatingText('MAX HATS!', this.x + this.width / 2, this.y, '#ff6b6b');
                    }
                }
            }

            // Colisão com Player 2 (se existir)
            if (game.player2 && this.intersects(game.player2)) {
                // Verificar se pode coletar (ainda não atingiu o limite)
                if (game.player2.hatCount < game.player2.maxHats) {
                    // Coletar chapéu (qualquer tipo, pode repetir)
                    this.collected = true;
                    game.player2.hatCount++;
                    game.player2.hatTypes.push(this.biomeType);

                    // Som de coletar chapéu
                    game.soundManager?.playHatCollect();

                    // Aplicar efeito especial do chapéu coletado
                    game.player2.applyHatEffect(this.biomeType, 'gain');

                    // Efeitos visuais
                    if (window.createFloatingText) {
                        window.createFloatingText(`${this.hatData.name}! (${game.player2.hatCount}/${game.player2.maxHats})`, this.x + this.width / 2, this.y, '#ffd700');
                    }
                    if (window.createParticles) {
                        window.createParticles(this.x + this.width / 2, this.y + this.height / 2, '#ffd700', 20);
                    }
                } else {
                    // Já está no máximo de chapéus
                    if (window.createFloatingText) {
                        window.createFloatingText('MAX HATS!', this.x + this.width / 2, this.y, '#ff6b6b');
                    }
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

        const screenX = this.x - game.camera.x;
        const screenY = this.y - game.camera.y;

        ctx.save();

        if (this.type === 'dropping') {
            // Chapéu caindo - com rotação e fade
            ctx.globalAlpha = this.alpha;
            ctx.translate(screenX + this.width / 2, screenY + this.height / 2);
            ctx.rotate(this.rotation);
            ctx.translate(-(this.width / 2), -(this.height / 2));

            this.drawHatShape(ctx);

        } else {
            // Chapéu coletável - com bob e brilho
            const bob = Math.sin(this.bobTime) * 3;

            ctx.translate(screenX + this.width / 2, screenY + this.height / 2 + bob);

            // Brilho de fundo pulsante
            const pulseAlpha = 0.3 + Math.sin(this.bobTime * 2) * 0.2;
            ctx.fillStyle = `rgba(255, 215, 0, ${pulseAlpha})`;
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            ctx.translate(-(this.width / 2), -(this.height / 2));

            // Partículas brilhantes girando
            const time = Date.now() / 1000;
            ctx.fillStyle = '#ffd700';
            for (let i = 0; i < 3; i++) {
                const angle = time * 2 + (i * Math.PI * 2 / 3);
                const radius = 12;
                const px = this.width / 2 + Math.cos(angle) * radius;
                const py = this.height / 2 + Math.sin(angle) * radius;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }

            this.drawHatShape(ctx);
        }

        ctx.restore();
    }

    drawHatShape(ctx) {
        const colors = this.hatData.colors;

        // Desenhar baseado no tipo de bioma
        switch (this.biomeType.toUpperCase()) {
            case 'PLAINS':
                this.drawCowboyHat(ctx, colors);
                break;
            case 'CAVE':
                this.drawMinerHelmet(ctx, colors);
                break;
            case 'ICE':
                this.drawFurHat(ctx, colors);
                break;
            case 'DESERT':
                this.drawTurban(ctx, colors);
                break;
            case 'SKY':
                this.drawPilotCap(ctx, colors);
                break;
            case 'APOCALYPSE':
                this.drawCombatHelmet(ctx, colors);
                break;
            case 'MOON':
                this.drawAstronautHelmet(ctx, colors);
                break;
            case 'BLACK_HOLE':
                this.drawVoidCrown(ctx, colors);
                break;
            default:
                this.drawDefaultHat(ctx, colors);
        }
    }

    drawDefaultHat(ctx, colors) {
        // Chapéu padrão (usado como fallback)
        ctx.fillStyle = colors.main || '#2c1810';
        ctx.beginPath();
        ctx.ellipse(this.width / 2, this.height - 3, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.main || '#2c1810';
        ctx.fillRect(this.width / 2 - 6, 2, 12, this.height - 6);

        ctx.beginPath();
        ctx.ellipse(this.width / 2, 2, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.band || '#8b4513';
        ctx.fillRect(this.width / 2 - 6, this.height - 7, 12, 3);
    }

    drawCowboyHat(ctx, colors) {
        // Chapéu de cowboy com aba larga (COM OUTLINE para combinar com personagem)
        const centerX = this.width / 2;
        const baseY = -5; // Ajuste para centralizar melhor no ícone

        // OUTLINE PRETO da aba
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 13, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Aba do chapéu
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 13, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // OUTLINE PRETO da copa
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 7, baseY - 3, 14, 16);

        // Copa do chapéu
        ctx.fillStyle = colors.main;
        ctx.fillRect(centerX - 6, baseY - 2, 12, 14);

        // OUTLINE PRETO do topo
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY - 2, 7, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Topo do chapéu
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY - 2, 6, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Faixa decorativa
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 7, baseY + 8, 14, 4);
        ctx.fillStyle = colors.accent;
        ctx.fillRect(centerX - 6, baseY + 9, 12, 3);
    }

    drawMinerHelmet(ctx, colors) {
        // Capacete de mineiro com lanterna (COM OUTLINE)
        const centerX = this.width / 2;
        const baseY = -5;

        // Outline
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 8, baseY + 1, 16, 14);

        // Capacete
        ctx.fillStyle = colors.main;
        ctx.fillRect(centerX - 7, baseY + 2, 14, 12);

        // Topo arredondado outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 2, 8, 3, 0, 0, Math.PI, true);
        ctx.fill();

        // Topo arredondado
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 2, 7, 2, 0, 0, Math.PI, true);
        ctx.fill();

        // Lanterna frontal
        ctx.fillStyle = colors.accent;
        ctx.fillRect(centerX - 3, baseY + 5, 4, 5);
        ctx.fillStyle = colors.light || '#FFF8DC';
        ctx.fillRect(centerX - 2, baseY + 6, 2, 3);

        // Brilho da lanterna
        ctx.shadowColor = colors.light || '#FFF8DC';
        ctx.shadowBlur = 5;
        ctx.fillStyle = colors.light || '#FFF8DC';
        ctx.beginPath();
        ctx.arc(centerX - 1, baseY + 7, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    drawFurHat(ctx, colors) {
        // Chapéu de pele com pelos (COM OUTLINE)
        const centerX = this.width / 2;
        const baseY = -5;

        // Outline base
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 11, 11, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 11, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline copa
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 7, baseY, 14, 12);

        // Copa
        ctx.fillStyle = colors.main;
        ctx.fillRect(centerX - 6, baseY + 1, 12, 10);

        // Pelo na borda
        ctx.fillStyle = colors.fur || '#FFFACD';
        for (let i = 0; i < 10; i++) {
            const x = centerX - 6 + i * 1.2;
            ctx.fillRect(x, baseY + 9, 1, 2);
        }

        // Faixa azul
        ctx.fillStyle = colors.accent;
        ctx.fillRect(centerX - 6, baseY + 7, 12, 2);
    }

    drawTurban(ctx, colors) {
        // Turbante enrolado (COM OUTLINE)
        const centerX = this.width / 2;
        const baseY = -5;

        // Camadas do turbante (de baixo para cima)
        for (let i = 0; i < 3; i++) {
            // Outline
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(centerX, baseY + 11 - i * 2, 11 - i, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Camada
            ctx.fillStyle = colors.main;
            ctx.beginPath();
            ctx.ellipse(centerX, baseY + 11 - i * 2, 10 - i, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Nó decorativo
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX + 4, baseY + 6, 5, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors.band;
        ctx.beginPath();
        ctx.ellipse(centerX + 4, baseY + 6, 4, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Detalhe dourado
        ctx.fillStyle = colors.accent;
        ctx.fillRect(centerX - 2, baseY + 7, 4, 2);
    }

    drawPilotCap(ctx, colors) {
        // Quepe de piloto (COM OUTLINE)
        const centerX = this.width / 2;
        const baseY = -5;

        // Outline base
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 11, 12, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base (pala)
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 11, 11, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Outline copa
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 6, baseY + 2, 12, 10);

        // Copa
        ctx.fillStyle = colors.main;
        ctx.fillRect(centerX - 5, baseY + 3, 10, 8);

        // Óculos de aviador
        const goggles = colors.goggles || '#000000';
        ctx.fillStyle = goggles;
        ctx.beginPath();
        ctx.ellipse(centerX - 2, baseY + 5, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 2, baseY + 5, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ponte dos óculos
        ctx.fillRect(centerX - 1, baseY + 4, 2, 1);
    }

    drawCombatHelmet(ctx, colors) {
        // Capacete militar (COM OUTLINE)
        const centerX = this.width / 2;
        const baseY = -5;

        // Outline capacete
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 8, baseY + 1, 16, 13);

        // Capacete
        ctx.fillStyle = colors.main;
        ctx.fillRect(centerX - 7, baseY + 2, 14, 11);

        // Topo arredondado outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 2, 8, 3, 0, 0, Math.PI, true);
        ctx.fill();

        // Topo arredondado
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 2, 7, 2, 0, 0, Math.PI, true);
        ctx.fill();

        // Padrão de camuflagem
        ctx.fillStyle = colors.camo || '#696969';
        ctx.fillRect(centerX - 5, baseY + 4, 2, 2);
        ctx.fillRect(centerX, baseY + 6, 2, 2);
        ctx.fillRect(centerX + 3, baseY + 5, 2, 2);

        // Detalhes vermelhos
        ctx.fillStyle = colors.accent;
        ctx.fillRect(centerX - 6, baseY + 3, 12, 1);
        ctx.fillRect(centerX - 6, baseY + 11, 12, 1);
    }

    drawAstronautHelmet(ctx, colors) {
        // Capacete de astronauta com visor (COM OUTLINE)
        const centerX = this.width / 2;
        const baseY = -5;

        // Outline capacete
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 8, baseY + 1, 16, 13);

        // Capacete
        ctx.fillStyle = colors.main;
        ctx.fillRect(centerX - 7, baseY + 2, 14, 11);

        // Topo arredondado outline
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 2, 8, 3, 0, 0, Math.PI, true);
        ctx.fill();

        // Topo arredondado
        ctx.fillStyle = colors.main;
        ctx.beginPath();
        ctx.ellipse(centerX, baseY + 2, 7, 2, 0, 0, Math.PI, true);
        ctx.fill();

        // Visor azul
        ctx.fillStyle = colors.visor || colors.accent;
        ctx.fillRect(centerX - 5, baseY + 4, 10, 7);

        // Reflexo no visor
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.fillRect(centerX - 3, baseY + 5, 2, 1);
        ctx.fillRect(centerX + 1, baseY + 7, 1, 2);
    }

    drawVoidCrown(ctx, colors) {
        // Coroa do vazio com energia (COM OUTLINE)
        const centerX = this.width / 2;
        const baseY = -5;

        // Pontas da coroa (5 pontas) - OUTLINE
        ctx.fillStyle = '#000000';
        for (let i = 0; i < 5; i++) {
            const x = centerX - 7 + i * 3.5;
            ctx.beginPath();
            ctx.moveTo(x, baseY + 11);
            ctx.lineTo(x + 1.5, baseY + 4);
            ctx.lineTo(x + 3, baseY + 11);
            ctx.closePath();
            ctx.fill();
        }

        // Pontas coloridas
        ctx.fillStyle = colors.main;
        for (let i = 0; i < 5; i++) {
            const x = centerX - 7 + i * 3.5;
            ctx.beginPath();
            ctx.moveTo(x + 0.5, baseY + 11);
            ctx.lineTo(x + 1.5, baseY + 5);
            ctx.lineTo(x + 2.5, baseY + 11);
            ctx.closePath();
            ctx.fill();
        }

        // Base da coroa
        ctx.fillStyle = '#000000';
        ctx.fillRect(centerX - 7, baseY + 9, 14, 4);

        ctx.fillStyle = colors.band;
        ctx.fillRect(centerX - 6, baseY + 10, 12, 2);

        // Energia pulsante
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 4) * 0.5 + 0.5;

        ctx.shadowColor = colors.energy || colors.accent;
        ctx.shadowBlur = 4 * pulse;
        ctx.fillStyle = colors.energy || colors.accent;

        // Pequenos orbes de energia
        for (let i = 0; i < 3; i++) {
            const angle = time * 2 + (i * Math.PI * 2 / 3);
            const x = centerX + Math.cos(angle) * 6;
            const y = baseY + 7 + Math.sin(angle) * 1;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;
    }
}
