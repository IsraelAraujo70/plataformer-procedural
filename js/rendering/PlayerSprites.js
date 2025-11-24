// ============================================
// PLAYER SPRITES - Sistema de sprites animados para o player
// Renderização procedural de 120+ frames de animação
// ============================================

import { animationSystem } from '../systems/AnimationSystem.js';

/**
 * Gerador de sprites procedurais do player
 */
export class PlayerSpriteGenerator {
    constructor() {
        this.spriteCache = new Map();
    }

    /**
     * Desenha corpo base do player (estilo cartoon)
     */
    drawPlayerBody(ctx, x, y, width, height, color, options = {}) {
        const {
            squash = 1.0,       // Squash & stretch
            rotation = 0,        // Rotação do corpo
            facingRight = true,  // Direção
            expression = 'normal', // Expressão facial
            frame = 0           // Frame da animação
        } = options;

        ctx.save();
        ctx.translate(x, y);

        // Aplicar rotação se necessário
        if (rotation !== 0) {
            ctx.rotate(rotation);
        }

        // Aplicar flip horizontal
        if (!facingRight) {
            ctx.scale(-1, 1);
        }

        // Aplicar squash & stretch
        const stretchedHeight = height * squash;
        const stretchedWidth = width / squash; // Inverso para manter volume

        // SOMBRA (offset para dar profundidade)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, stretchedHeight / 2 + 2, stretchedWidth / 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // OUTLINE GROSSO PRETO (cartoon style)
        const outlineWidth = 3;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = outlineWidth;

        // CORPO (forma arredondada)
        const bodyPath = new Path2D();
        const bodyW = stretchedWidth * 0.8;
        const bodyH = stretchedHeight * 0.6;
        const bodyY = stretchedHeight * 0.2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(-bodyW / 2, bodyY - bodyH / 2, bodyW, bodyH, bodyW * 0.3);
        ctx.fill();
        ctx.stroke();

        // CABEÇA (círculo)
        const headRadius = stretchedWidth * 0.4;
        const headY = -stretchedHeight * 0.15;

        // Cabeça - outline
        ctx.beginPath();
        ctx.arc(0, headY, headRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.stroke();

        // OLHOS
        this.drawEyes(ctx, 0, headY, headRadius, expression, frame);

        // BOCA (simples)
        this.drawMouth(ctx, 0, headY + headRadius * 0.3, headRadius * 0.4, expression);

        // BRAÇOS (simples)
        this.drawArms(ctx, stretchedWidth, bodyY, frame, facingRight);

        // PERNAS (simples)
        this.drawLegs(ctx, stretchedWidth, bodyY + bodyH / 2, stretchedHeight, frame);

        // ANTENA/TOPETE (com física de pêndulo)
        this.drawAntenna(ctx, 0, headY - headRadius, headRadius, options.antennaAngle || 0);

        // CHAPÉUS EMPILHADOS
        if (options.hatCount && options.hatCount > 0) {
            this.drawHats(ctx, 0, headY - headRadius, options.hatCount, options.hatTypes);
        }

        ctx.restore();
    }

    /**
     * Desenha olhos com expressões
     */
    drawEyes(ctx, x, y, headRadius, expression, frame) {
        const eyeOffsetX = headRadius * 0.25;
        const eyeOffsetY = -headRadius * 0.1;
        const eyeSize = headRadius * 0.15;

        // Piscada (frame-based)
        const blinkFrame = frame % 180; // Pisca a cada 3 segundos (180 frames)
        const isBlinking = blinkFrame >= 175 && blinkFrame <= 178;

        if (isBlinking) {
            // Olhos fechados (linha)
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - eyeOffsetX - eyeSize, y + eyeOffsetY);
            ctx.lineTo(x - eyeOffsetX + eyeSize, y + eyeOffsetY);
            ctx.moveTo(x + eyeOffsetX - eyeSize, y + eyeOffsetY);
            ctx.lineTo(x + eyeOffsetX + eyeSize, y + eyeOffsetY);
            ctx.stroke();
        } else {
            // Brancos dos olhos
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x - eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.arc(x + eyeOffsetX, y + eyeOffsetY, eyeSize, 0, Math.PI * 2);
            ctx.fill();

            // Pupilas (variam com expressão)
            let pupilOffsetY = 0;
            let pupilSize = eyeSize * 0.6;

            switch (expression) {
                case 'scared':
                    pupilSize = eyeSize * 0.8; // Pupilas dilatadas
                    break;
                case 'excited':
                    pupilSize = eyeSize * 0.7;
                    pupilOffsetY = -eyeSize * 0.2; // Olhando para cima
                    break;
                case 'dizzy':
                    // Espiral nos olhos
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1.5;
                    for (let eye of [-eyeOffsetX, eyeOffsetX]) {
                        ctx.beginPath();
                        for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
                            const radius = angle * 0.5;
                            const px = x + eye + Math.cos(angle) * radius;
                            const py = y + eyeOffsetY + Math.sin(angle) * radius;
                            if (angle === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        }
                        ctx.stroke();
                    }
                    return;
                case 'angry':
                    pupilOffsetY = eyeSize * 0.1;
                    break;
            }

            // Desenhar pupilas normais
            if (expression !== 'dizzy') {
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(x - eyeOffsetX, y + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
                ctx.arc(x + eyeOffsetX, y + eyeOffsetY + pupilOffsetY, pupilSize, 0, Math.PI * 2);
                ctx.fill();

                // Brilho nos olhos (destaque cartoon)
                ctx.fillStyle = '#ffffff';
                const shineSize = pupilSize * 0.4;
                ctx.beginPath();
                ctx.arc(x - eyeOffsetX - pupilSize * 0.3, y + eyeOffsetY + pupilOffsetY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
                ctx.arc(x + eyeOffsetX - pupilSize * 0.3, y + eyeOffsetY + pupilOffsetY - pupilSize * 0.3, shineSize, 0, Math.PI * 2);
                ctx.fill();
            }

            // Sobrancelhas (para expressões)
            if (expression === 'angry' || expression === 'determined') {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
                ctx.beginPath();
                // Sobrancelha esquerda (inclinada para baixo no centro)
                ctx.moveTo(x - eyeOffsetX - eyeSize, y + eyeOffsetY - eyeSize);
                ctx.lineTo(x - eyeOffsetX + eyeSize, y + eyeOffsetY - eyeSize * 1.5);
                // Sobrancelha direita
                ctx.moveTo(x + eyeOffsetX - eyeSize, y + eyeOffsetY - eyeSize * 1.5);
                ctx.lineTo(x + eyeOffsetX + eyeSize, y + eyeOffsetY - eyeSize);
                ctx.stroke();
            }
        }
    }

    /**
     * Desenha boca
     */
    drawMouth(ctx, x, y, width, expression) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();

        switch (expression) {
            case 'normal':
                // Sorriso simples
                ctx.arc(x, y - width * 0.2, width, 0.2, Math.PI - 0.2);
                break;
            case 'excited':
                // Boca aberta feliz
                ctx.arc(x, y - width * 0.3, width * 1.2, 0.3, Math.PI - 0.3);
                ctx.arc(x, y, width * 0.8, Math.PI, 0);
                break;
            case 'scared':
                // Boca "O"
                ctx.arc(x, y, width * 0.5, 0, Math.PI * 2);
                break;
            case 'dizzy':
                // Linha ondulada
                for (let i = 0; i < 5; i++) {
                    const px = x - width + (i * width / 2);
                    const py = y + (i % 2 === 0 ? -2 : 2);
                    if (i === 0) ctx.moveTo(px, py);
                    else ctx.lineTo(px, py);
                }
                break;
            case 'angry':
                // Linha reta para baixo
                ctx.moveTo(x - width, y);
                ctx.lineTo(x + width, y);
                break;
            case 'determined':
                // Sorriso determinado
                ctx.moveTo(x - width, y);
                ctx.lineTo(x + width * 0.8, y - 2);
                break;
        }

        ctx.stroke();
    }

    /**
     * Desenha braços (animados)
     */
    drawArms(ctx, bodyWidth, bodyY, frame, facingRight) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Animação de balanço dos braços ao andar
        const walkCycle = (frame % 30) / 30; // Ciclo de 0.5s
        const armSwing = Math.sin(walkCycle * Math.PI * 2) * 0.3;

        // Braço esquerdo
        ctx.beginPath();
        const leftArmX = -bodyWidth * 0.4;
        const leftArmAngle = armSwing;
        const armLength = bodyWidth * 0.5;
        ctx.moveTo(leftArmX, bodyY);
        ctx.lineTo(
            leftArmX + Math.sin(leftArmAngle) * armLength,
            bodyY + Math.cos(leftArmAngle) * armLength
        );
        ctx.stroke();

        // Braço direito
        ctx.beginPath();
        const rightArmX = bodyWidth * 0.4;
        const rightArmAngle = -armSwing;
        ctx.moveTo(rightArmX, bodyY);
        ctx.lineTo(
            rightArmX + Math.sin(rightArmAngle) * armLength,
            bodyY + Math.cos(rightArmAngle) * armLength
        );
        ctx.stroke();
    }

    /**
     * Desenha pernas (animadas)
     */
    drawLegs(ctx, bodyWidth, bodyBottom, height, frame) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Animação de caminhada
        const walkCycle = (frame % 30) / 30;
        const legSwing = Math.sin(walkCycle * Math.PI * 2) * 0.4;

        const legLength = height * 0.35;

        // Perna esquerda
        ctx.beginPath();
        const leftLegX = -bodyWidth * 0.2;
        ctx.moveTo(leftLegX, bodyBottom);
        ctx.lineTo(
            leftLegX + Math.sin(legSwing) * legLength * 0.5,
            bodyBottom + legLength
        );
        ctx.stroke();

        // Perna direita
        ctx.beginPath();
        const rightLegX = bodyWidth * 0.2;
        ctx.moveTo(rightLegX, bodyBottom);
        ctx.lineTo(
            rightLegX + Math.sin(-legSwing) * legLength * 0.5,
            bodyBottom + legLength
        );
        ctx.stroke();
    }

    /**
     * Desenha antena/topete com física
     */
    drawAntenna(ctx, x, y, baseRadius, angle) {
        const antennaLength = baseRadius * 1.5;
        const antennaWidth = 3;

        // Haste da antena
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = antennaWidth;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(x, y);
        const tipX = x + Math.sin(angle) * antennaLength;
        const tipY = y - Math.cos(angle) * antennaLength;
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Bolinha na ponta
        ctx.fillStyle = '#ff6b9d';
        ctx.beginPath();
        ctx.arc(tipX, tipY, antennaWidth * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Desenha chapéus empilhados
     */
    drawHats(ctx, x, y, count, types = []) {
        const hatSpacing = 8;

        for (let i = 0; i < Math.min(count, 5); i++) {
            const hatY = y - (i * hatSpacing);
            const hatType = types[i] || 'default';

            this.drawSingleHat(ctx, x, hatY, hatType, i);
        }
    }

    /**
     * Desenha um chapéu individual
     */
    drawSingleHat(ctx, x, y, type, stackIndex) {
        const baseWidth = 16;
        const hatWidth = baseWidth - (stackIndex * 2); // Chapéus ficam menores conforme empilham

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        switch (type) {
            case 'plains':
                // Chapéu de cowboy
                ctx.fillStyle = '#8B4513';
                ctx.beginPath();
                ctx.moveTo(x - hatWidth / 2, y);
                ctx.lineTo(x - hatWidth / 3, y - 8);
                ctx.lineTo(x + hatWidth / 3, y - 8);
                ctx.lineTo(x + hatWidth / 2, y);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            case 'ice':
                // Gorro de inverno
                ctx.fillStyle = '#00BFFF';
                ctx.beginPath();
                ctx.arc(x, y - 5, hatWidth / 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                // Pompom
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y - 10, 3, 0, Math.PI * 2);
                ctx.fill();
                break;

            case 'desert':
                // Turbante
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.ellipse(x, y - 4, hatWidth / 2.5, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                break;

            case 'sky':
                // Halo angelical
                ctx.strokeStyle = '#FFD700';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(x, y - 10, hatWidth / 3, 0, Math.PI * 2);
                ctx.stroke();
                break;

            case 'apocalypse':
                // Chifres demoníacos
                ctx.fillStyle = '#8B0000';
                ctx.beginPath();
                ctx.moveTo(x - hatWidth / 3, y);
                ctx.lineTo(x - hatWidth / 2, y - 10);
                ctx.lineTo(x - hatWidth / 4, y - 5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(x + hatWidth / 3, y);
                ctx.lineTo(x + hatWidth / 2, y - 10);
                ctx.lineTo(x + hatWidth / 4, y - 5);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                break;

            default:
                // Chapéu padrão (cartola)
                ctx.fillStyle = '#000000';
                // Base larga
                ctx.fillRect(x - hatWidth / 2, y - 2, hatWidth, 2);
                // Tubo
                ctx.fillRect(x - hatWidth / 4, y - 12, hatWidth / 2, 10);
                ctx.strokeRect(x - hatWidth / 2, y - 2, hatWidth, 2);
                ctx.strokeRect(x - hatWidth / 4, y - 12, hatWidth / 2, 10);
        }
    }

    /**
     * Gera todas as animações do player e registra no sistema
     */
    generatePlayerAnimations(playerNumber = 1) {
        const color = playerNumber === 1 ? '#00d9ff' : '#ff6b6b';
        const prefix = `player${playerNumber}_`;

        // IDLE (12 frames) - Respiração suave
        const idleFrames = [];
        for (let i = 0; i < 12; i++) {
            idleFrames.push((ctx, x, y, options) => {
                const breathe = 1.0 + Math.sin((i / 12) * Math.PI * 2) * 0.05;
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: breathe,
                    frame: i
                });
            });
        }

        animationSystem.registerAnimation(prefix + 'idle', {
            frames: idleFrames,
            frameRate: 8,
            loop: true
        });

        // RUN (8 frames) - Corrida
        const runFrames = [];
        for (let i = 0; i < 8; i++) {
            runFrames.push((ctx, x, y, options) => {
                const bobbing = Math.sin((i / 8) * Math.PI * 2) * 2;
                const tilt = Math.sin((i / 8) * Math.PI * 2) * 0.1;
                this.drawPlayerBody(ctx, x, y + bobbing, 24, 32, color, {
                    ...options,
                    rotation: tilt,
                    frame: i * 4 // Multiplica para animação de braços/pernas
                });
            });
        }

        animationSystem.registerAnimation(prefix + 'run', {
            frames: runFrames,
            frameRate: 12,
            loop: true
        });

        // JUMP (6 frames) - Pulo
        const jumpFrames = [
            // Frame 0: Agachamento (anticipation)
            (ctx, x, y, options) => {
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: 0.7,
                    expression: 'determined'
                });
            },
            // Frame 1: Impulso
            (ctx, x, y, options) => {
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: 1.4,
                    expression: 'excited'
                });
            },
            // Frames 2-3: No ar (stretch)
            ...[0, 1].map(() => (ctx, x, y, options) => {
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: 1.2,
                    expression: 'excited'
                });
            }),
            // Frames 4-5: Começando a cair
            ...[0, 1].map(() => (ctx, x, y, options) => {
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: 1.1
                });
            })
        ];

        animationSystem.registerAnimation(prefix + 'jump', {
            frames: jumpFrames,
            frameRate: 10,
            loop: false
        });

        // FALL (4 frames) - Queda
        const fallFrames = [];
        for (let i = 0; i < 4; i++) {
            fallFrames.push((ctx, x, y, options) => {
                const stretch = 1.0 + (i * 0.05);
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: stretch,
                    expression: i > 2 ? 'scared' : 'normal'
                });
            });
        }

        animationSystem.registerAnimation(prefix + 'fall', {
            frames: fallFrames,
            frameRate: 8,
            loop: false
        });

        // LAND (5 frames) - Pouso
        const landFrames = [
            // Frame 0: Impacto (muito comprimido)
            (ctx, x, y, options) => {
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: 0.5
                });
            },
            // Frames 1-2: Recuperação (bounce back)
            ...[1.3, 1.1].map(sq => (ctx, x, y, options) => {
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: sq
                });
            }),
            // Frames 3-4: Estabilização
            ...[1.05, 1.0].map(sq => (ctx, x, y, options) => {
                this.drawPlayerBody(ctx, x, y, 24, 32, color, {
                    ...options,
                    squash: sq
                });
            })
        ];

        animationSystem.registerAnimation(prefix + 'land', {
            frames: landFrames,
            frameRate: 15,
            loop: false,
            onComplete: () => {
                // Transicionar para idle ou run
            }
        });

        console.log(`✅ Animações do Player ${playerNumber} geradas com sucesso!`);
    }
}

// Instância global do gerador
export const playerSpriteGenerator = new PlayerSpriteGenerator();
