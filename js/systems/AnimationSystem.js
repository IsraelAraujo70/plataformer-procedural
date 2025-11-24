// ============================================
// ANIMATION SYSTEM - Sistema profissional de animações
// Suporta sprite sheets, frame interpolation, blend states
// ============================================

export class AnimationSystem {
    constructor() {
        this.animations = new Map(); // Armazena todas as animações registradas
        this.spriteSheets = new Map(); // Cache de sprite sheets carregadas
    }

    /**
     * Registra uma nova animação
     * @param {string} name - Nome da animação (ex: "player_idle", "enemy_walk")
     * @param {Object} config - Configuração da animação
     */
    registerAnimation(name, config) {
        this.animations.set(name, {
            frames: config.frames || [],          // Array de frames
            frameRate: config.frameRate || 12,   // FPS da animação
            loop: config.loop !== false,          // Loop por padrão
            pingPong: config.pingPong || false,   // Vai e volta
            onComplete: config.onComplete || null, // Callback ao completar
            spriteSheet: config.spriteSheet || null // Referência ao sprite sheet
        });
    }

    /**
     * Carrega um sprite sheet
     * @param {string} name - Nome do sprite sheet
     * @param {HTMLImageElement} image - Imagem do sprite sheet
     * @param {Object} config - Configuração do sprite sheet
     */
    registerSpriteSheet(name, image, config) {
        this.spriteSheets.set(name, {
            image: image,
            frameWidth: config.frameWidth,
            frameHeight: config.frameHeight,
            columns: config.columns || Math.floor(image.width / config.frameWidth),
            rows: config.rows || Math.floor(image.height / config.frameHeight),
            padding: config.padding || 0,
            offset: config.offset || { x: 0, y: 0 }
        });
    }

    /**
     * Cria um novo controller de animação para uma entidade
     */
    createController() {
        return new AnimationController(this);
    }
}

/**
 * Controller de animação para uma entidade específica
 */
export class AnimationController {
    constructor(system) {
        this.system = system;
        this.currentAnimation = null;      // Animação atual
        this.currentFrame = 0;             // Frame atual (float para interpolação)
        this.frameTimer = 0;               // Timer interno
        this.isPlaying = false;            // Estado de reprodução
        this.isPaused = false;             // Estado de pausa
        this.playbackSpeed = 1.0;          // Velocidade de reprodução (1.0 = normal)
        this.direction = 1;                // 1 = forward, -1 = reverse
        this.blendTime = 0;                // Tempo de blend entre animações
        this.previousAnimation = null;     // Animação anterior (para blend)
        this.previousFrame = 0;            // Frame anterior (para blend)

        // Callbacks
        this.onAnimationComplete = null;
        this.onFrameChange = null;
    }

    /**
     * Reproduz uma animação
     * @param {string} name - Nome da animação
     * @param {Object} options - Opções de reprodução
     */
    play(name, options = {}) {
        const anim = this.system.animations.get(name);
        if (!anim) {
            console.warn(`Animação "${name}" não encontrada!`);
            return;
        }

        // Se já está tocando a mesma animação, não reiniciar (a menos que forceRestart seja true)
        if (this.currentAnimation === name && !options.forceRestart) {
            return;
        }

        // Guardar animação anterior para blend
        if (options.blend && this.currentAnimation) {
            this.previousAnimation = this.currentAnimation;
            this.previousFrame = Math.floor(this.currentFrame);
            this.blendTime = options.blendTime || 0.15; // 150ms de blend padrão
        }

        this.currentAnimation = name;
        this.currentFrame = options.startFrame || 0;
        this.frameTimer = 0;
        this.isPlaying = true;
        this.isPaused = false;
        this.direction = options.reverse ? -1 : 1;
        this.playbackSpeed = options.speed || 1.0;

        if (options.onComplete) {
            this.onAnimationComplete = options.onComplete;
        }
    }

    /**
     * Para a animação
     */
    stop() {
        this.isPlaying = false;
        this.currentFrame = 0;
        this.frameTimer = 0;
    }

    /**
     * Pausa a animação
     */
    pause() {
        this.isPaused = true;
    }

    /**
     * Resume a animação pausada
     */
    resume() {
        this.isPaused = false;
    }

    /**
     * Atualiza a animação (chamar todo frame)
     * @param {number} deltaTime - Tempo desde último frame (em segundos)
     */
    update(deltaTime) {
        if (!this.isPlaying || this.isPaused || !this.currentAnimation) {
            return;
        }

        const anim = this.system.animations.get(this.currentAnimation);
        if (!anim || anim.frames.length === 0) {
            return;
        }

        // Atualizar blend time
        if (this.blendTime > 0) {
            this.blendTime -= deltaTime;
            if (this.blendTime <= 0) {
                this.blendTime = 0;
                this.previousAnimation = null;
            }
        }

        // Calcular frame rate ajustado
        const adjustedFrameRate = anim.frameRate * this.playbackSpeed;
        const frameTime = 1.0 / adjustedFrameRate; // Tempo por frame em segundos

        // Atualizar timer
        this.frameTimer += deltaTime * Math.abs(this.direction);

        // Trocar de frame?
        if (this.frameTimer >= frameTime) {
            const previousFrame = Math.floor(this.currentFrame);
            this.currentFrame += this.direction * (this.frameTimer / frameTime);
            this.frameTimer = 0;

            const currentFrameInt = Math.floor(this.currentFrame);

            // Verificar se trocou de frame (para callback)
            if (currentFrameInt !== previousFrame && this.onFrameChange) {
                this.onFrameChange(currentFrameInt);
            }

            // Verificar limites
            if (this.direction > 0 && this.currentFrame >= anim.frames.length) {
                if (anim.loop) {
                    if (anim.pingPong) {
                        this.direction = -1;
                        this.currentFrame = anim.frames.length - 1;
                    } else {
                        this.currentFrame = 0;
                    }
                } else {
                    // Animação terminou
                    this.currentFrame = anim.frames.length - 1;
                    this.isPlaying = false;
                    if (anim.onComplete) anim.onComplete();
                    if (this.onAnimationComplete) this.onAnimationComplete();
                }
            } else if (this.direction < 0 && this.currentFrame < 0) {
                if (anim.loop && anim.pingPong) {
                    this.direction = 1;
                    this.currentFrame = 0;
                } else if (anim.loop) {
                    this.currentFrame = anim.frames.length - 1;
                } else {
                    this.currentFrame = 0;
                    this.isPlaying = false;
                    if (anim.onComplete) anim.onComplete();
                    if (this.onAnimationComplete) this.onAnimationComplete();
                }
            }
        }
    }

    /**
     * Renderiza a animação atual
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     * @param {number} x - Posição X
     * @param {number} y - Posição Y
     * @param {Object} options - Opções de renderização
     */
    render(ctx, x, y, options = {}) {
        if (!this.currentAnimation) return;

        const anim = this.system.animations.get(this.currentAnimation);
        if (!anim || anim.frames.length === 0) return;

        const frameIndex = Math.floor(this.currentFrame);
        const frame = anim.frames[frameIndex];

        // Se tem sprite sheet, renderizar a partir dele
        if (anim.spriteSheet) {
            const sheet = this.system.spriteSheets.get(anim.spriteSheet);
            if (sheet) {
                this.renderSpriteFrame(ctx, sheet, frame, x, y, options);
            }
        } else {
            // Renderização customizada (primitivas)
            if (typeof frame === 'function') {
                frame(ctx, x, y, options);
            }
        }

        // Renderizar blend se ativo
        if (this.blendTime > 0 && this.previousAnimation) {
            const prevAnim = this.system.animations.get(this.previousAnimation);
            if (prevAnim && prevAnim.frames[this.previousFrame]) {
                const blendAlpha = this.blendTime / 0.15; // Normalizado 0-1
                ctx.globalAlpha = blendAlpha;

                if (prevAnim.spriteSheet) {
                    const sheet = this.system.spriteSheets.get(prevAnim.spriteSheet);
                    if (sheet) {
                        this.renderSpriteFrame(ctx, sheet, prevAnim.frames[this.previousFrame], x, y, options);
                    }
                }

                ctx.globalAlpha = 1.0;
            }
        }
    }

    /**
     * Renderiza um frame do sprite sheet
     */
    renderSpriteFrame(ctx, sheet, frame, x, y, options = {}) {
        if (typeof frame === 'number') {
            // Frame é um índice no sprite sheet
            const col = frame % sheet.columns;
            const row = Math.floor(frame / sheet.columns);

            const sx = sheet.offset.x + col * (sheet.frameWidth + sheet.padding);
            const sy = sheet.offset.y + row * (sheet.frameHeight + sheet.padding);

            ctx.save();

            // Aplicar transformações
            if (options.flipX || options.flipY) {
                ctx.translate(x + sheet.frameWidth / 2, y + sheet.frameHeight / 2);
                ctx.scale(options.flipX ? -1 : 1, options.flipY ? -1 : 1);
                ctx.translate(-(sheet.frameWidth / 2), -(sheet.frameHeight / 2));
            } else {
                ctx.translate(x, y);
            }

            if (options.rotation) {
                ctx.translate(sheet.frameWidth / 2, sheet.frameHeight / 2);
                ctx.rotate(options.rotation);
                ctx.translate(-sheet.frameWidth / 2, -sheet.frameHeight / 2);
            }

            if (options.scale) {
                ctx.scale(options.scale, options.scale);
            }

            if (options.opacity !== undefined) {
                ctx.globalAlpha = options.opacity;
            }

            // Desenhar frame
            ctx.drawImage(
                sheet.image,
                sx, sy,
                sheet.frameWidth, sheet.frameHeight,
                0, 0,
                sheet.frameWidth, sheet.frameHeight
            );

            ctx.restore();
        } else if (typeof frame === 'object') {
            // Frame é um objeto com coordenadas customizadas
            ctx.drawImage(
                sheet.image,
                frame.x, frame.y,
                frame.width, frame.height,
                x, y,
                frame.width, frame.height
            );
        }
    }

    /**
     * Retorna o frame atual como número inteiro
     */
    getCurrentFrame() {
        return Math.floor(this.currentFrame);
    }

    /**
     * Verifica se está tocando
     */
    isAnimationPlaying() {
        return this.isPlaying && !this.isPaused;
    }

    /**
     * Retorna progresso da animação (0-1)
     */
    getProgress() {
        const anim = this.system.animations.get(this.currentAnimation);
        if (!anim || anim.frames.length === 0) return 0;
        return this.currentFrame / anim.frames.length;
    }

    /**
     * Seta um frame específico
     */
    setFrame(frame) {
        const anim = this.system.animations.get(this.currentAnimation);
        if (!anim) return;
        this.currentFrame = Math.max(0, Math.min(frame, anim.frames.length - 1));
    }
}

// Instância global do sistema de animação
export const animationSystem = new AnimationSystem();
