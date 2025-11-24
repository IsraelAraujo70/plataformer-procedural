// ============================================
// SCREEN EFFECTS SYSTEM - Efeitos cinematográficos de tela
// Screen shake, flash, freeze frame, slow motion, zoom
// ============================================

export class ScreenEffects {
    constructor() {
        // Screen Shake
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeDuration = 0;
        this.shakeDecay = 0.9;

        // Flash
        this.flashAlpha = 0;
        this.flashColor = '#ffffff';
        this.flashDuration = 0;

        // Freeze Frame
        this.freezeFrameActive = false;
        this.freezeFrameDuration = 0;
        this.freezeFrameCallback = null;

        // Slow Motion
        this.slowMotionFactor = 1.0;
        this.slowMotionTarget = 1.0;
        this.slowMotionTransitionSpeed = 0.1;

        // Zoom
        this.zoomLevel = 1.0;
        this.zoomTarget = 1.0;
        this.zoomSpeed = 0.05;

        // Chromatic Aberration
        this.chromaticIntensity = 0;
        this.chromaticDecay = 0.95;

        // Vignette
        this.vignetteIntensity = 0;
        this.vignetteTarget = 0;
        this.vignetteSpeed = 0.05;

        // Motion Blur
        this.motionBlurStrength = 0;
        this.motionBlurTarget = 0;
        this.motionBlurDecay = 0.9;

        // Trauma (para shake procedural mais orgânico)
        this.trauma = 0;
        this.traumaDecay = 0.8;
        this.maxTrauma = 1.0;

        // Screen distortion
        this.distortionWave = 0;
        this.distortionAmplitude = 0;
        this.distortionFrequency = 1;
    }

    /**
     * Screen Shake - 12 intensidades
     * @param {number} intensity - 0.1 (sutil) a 1.0 (extremo)
     * @param {number} duration - Duração em frames (60 = 1 segundo)
     */
    shake(intensity = 0.5, duration = 15) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity * 30);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    /**
     * Trauma-based shake (mais orgânico, usado por Celeste)
     * @param {number} amount - Quantidade de trauma (0-1)
     */
    addTrauma(amount) {
        this.trauma = Math.min(this.trauma + amount, this.maxTrauma);
    }

    /**
     * Flash na tela
     * @param {string} color - Cor do flash
     * @param {number} duration - Duração em frames
     * @param {number} intensity - Intensidade (0-1)
     */
    flash(color = '#ffffff', duration = 5, intensity = 0.8) {
        this.flashColor = color;
        this.flashAlpha = intensity;
        this.flashDuration = duration;
    }

    /**
     * Freeze Frame - Congela o jogo por um breve momento
     * @param {number} duration - Duração em frames
     * @param {Function} callback - Callback após o freeze
     */
    freezeFrame(duration = 3, callback = null) {
        this.freezeFrameActive = true;
        this.freezeFrameDuration = duration;
        this.freezeFrameCallback = callback;
    }

    /**
     * Slow Motion
     * @param {number} factor - Fator de velocidade (0.5 = 50% speed, 2.0 = 200% speed)
     * @param {number} duration - Duração (0 = permanente)
     */
    setSlowMotion(factor, duration = 0) {
        this.slowMotionTarget = factor;

        if (duration > 0) {
            setTimeout(() => {
                this.slowMotionTarget = 1.0;
            }, duration * 16.67); // Converter frames para ms
        }
    }

    /**
     * Zoom da câmera
     * @param {number} level - Nível de zoom (1.0 = normal, 1.5 = 150%, etc)
     */
    setZoom(level) {
        this.zoomTarget = level;
    }

    /**
     * Chromatic Aberration (efeito de separação de cores RGB)
     * @param {number} intensity - Intensidade (pixels de separação)
     */
    chromaticAberration(intensity = 3) {
        this.chromaticIntensity = Math.max(this.chromaticIntensity, intensity);
    }

    /**
     * Vignette (escurecimento nas bordas)
     * @param {number} intensity - Intensidade (0-1)
     */
    setVignette(intensity) {
        this.vignetteTarget = intensity;
    }

    /**
     * Motion Blur
     * @param {number} strength - Força do blur (0-1)
     */
    setMotionBlur(strength) {
        this.motionBlurTarget = strength;
    }

    /**
     * Wave Distortion (efeito de onda na tela)
     * @param {number} amplitude - Amplitude da onda
     * @param {number} frequency - Frequência da onda
     * @param {number} duration - Duração em frames
     */
    waveDistortion(amplitude, frequency, duration) {
        this.distortionAmplitude = amplitude;
        this.distortionFrequency = frequency;
        this.distortionWave = duration;
    }

    /**
     * Atualiza todos os efeitos
     * @param {number} deltaTime - Delta time normalizado
     */
    update(deltaTime = 1) {
        // Atualizar Screen Shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= deltaTime;
            this.shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeY = (Math.random() - 0.5) * this.shakeIntensity;
            this.shakeIntensity *= Math.pow(this.shakeDecay, deltaTime);

            if (this.shakeDuration <= 0) {
                this.shakeX = 0;
                this.shakeY = 0;
                this.shakeIntensity = 0;
            }
        }

        // Atualizar Trauma Shake (mais suave e orgânico)
        if (this.trauma > 0) {
            this.trauma = Math.max(0, this.trauma - this.traumaDecay * deltaTime * 0.01);

            // Shake baseado em trauma ao quadrado (mais natural)
            const traumaSquared = this.trauma * this.trauma;
            const maxAngle = 0.1; // radianos
            const maxOffset = 10; // pixels

            const angle = maxAngle * traumaSquared * (Math.random() * 2 - 1);
            this.shakeX = maxOffset * traumaSquared * (Math.random() * 2 - 1);
            this.shakeY = maxOffset * traumaSquared * (Math.random() * 2 - 1);
        } else if (this.shakeDuration <= 0) {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Atualizar Flash
        if (this.flashDuration > 0) {
            this.flashDuration -= deltaTime;
            this.flashAlpha -= deltaTime * 0.05;
            if (this.flashAlpha < 0) {
                this.flashAlpha = 0;
                this.flashDuration = 0;
            }
        }

        // Atualizar Freeze Frame
        if (this.freezeFrameActive) {
            this.freezeFrameDuration -= deltaTime;
            if (this.freezeFrameDuration <= 0) {
                this.freezeFrameActive = false;
                if (this.freezeFrameCallback) {
                    this.freezeFrameCallback();
                    this.freezeFrameCallback = null;
                }
            }
        }

        // Atualizar Slow Motion (transição suave)
        if (Math.abs(this.slowMotionFactor - this.slowMotionTarget) > 0.01) {
            this.slowMotionFactor += (this.slowMotionTarget - this.slowMotionFactor) * this.slowMotionTransitionSpeed;
        } else {
            this.slowMotionFactor = this.slowMotionTarget;
        }

        // Atualizar Zoom (transição suave)
        if (Math.abs(this.zoomLevel - this.zoomTarget) > 0.01) {
            this.zoomLevel += (this.zoomTarget - this.zoomLevel) * this.zoomSpeed;
        } else {
            this.zoomLevel = this.zoomTarget;
        }

        // Atualizar Chromatic Aberration
        if (this.chromaticIntensity > 0) {
            this.chromaticIntensity *= Math.pow(this.chromaticDecay, deltaTime);
            if (this.chromaticIntensity < 0.1) {
                this.chromaticIntensity = 0;
            }
        }

        // Atualizar Vignette
        if (Math.abs(this.vignetteIntensity - this.vignetteTarget) > 0.01) {
            this.vignetteIntensity += (this.vignetteTarget - this.vignetteIntensity) * this.vignetteSpeed;
        } else {
            this.vignetteIntensity = this.vignetteTarget;
        }

        // Atualizar Motion Blur
        if (Math.abs(this.motionBlurStrength - this.motionBlurTarget) > 0.01) {
            this.motionBlurStrength += (this.motionBlurTarget - this.motionBlurStrength) * 0.1;
        } else {
            this.motionBlurStrength = this.motionBlurTarget;
        }

        // Atualizar Wave Distortion
        if (this.distortionWave > 0) {
            this.distortionWave -= deltaTime;
            if (this.distortionWave <= 0) {
                this.distortionAmplitude = 0;
            }
        }
    }

    /**
     * Renderiza efeitos de tela
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     * @param {number} width - Largura da tela
     * @param {number} height - Altura da tela
     */
    render(ctx, width, height) {
        // Flash
        if (this.flashAlpha > 0) {
            ctx.save();
            ctx.fillStyle = this.flashColor;
            ctx.globalAlpha = this.flashAlpha;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }

        // Vignette
        if (this.vignetteIntensity > 0) {
            ctx.save();
            const gradient = ctx.createRadialGradient(
                width / 2, height / 2, height * 0.3,
                width / 2, height / 2, height * 0.8
            );
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, `rgba(0, 0, 0, ${this.vignetteIntensity})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    }

    /**
     * Aplica transformações de câmera (shake, zoom)
     * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
     * @param {number} centerX - Centro X da câmera
     * @param {number} centerY - Centro Y da câmera
     */
    applyTransform(ctx, centerX, centerY) {
        ctx.save();

        // Aplicar zoom
        if (this.zoomLevel !== 1.0) {
            ctx.translate(centerX, centerY);
            ctx.scale(this.zoomLevel, this.zoomLevel);
            ctx.translate(-centerX, -centerY);
        }

        // Aplicar shake
        if (this.shakeX !== 0 || this.shakeY !== 0) {
            ctx.translate(this.shakeX, this.shakeY);
        }
    }

    /**
     * Restaura transformações
     */
    restoreTransform(ctx) {
        ctx.restore();
    }

    /**
     * Retorna o fator de slow motion atual
     */
    getSlowMotionFactor() {
        return this.slowMotionFactor;
    }

    /**
     * Verifica se está em freeze frame
     */
    isFrozen() {
        return this.freezeFrameActive;
    }

    /**
     * Reseta todos os efeitos
     */
    reset() {
        this.shakeIntensity = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeDuration = 0;
        this.trauma = 0;
        this.flashAlpha = 0;
        this.flashDuration = 0;
        this.freezeFrameActive = false;
        this.freezeFrameDuration = 0;
        this.slowMotionFactor = 1.0;
        this.slowMotionTarget = 1.0;
        this.zoomLevel = 1.0;
        this.zoomTarget = 1.0;
        this.chromaticIntensity = 0;
        this.vignetteIntensity = 0;
        this.vignetteTarget = 0;
        this.motionBlurStrength = 0;
        this.motionBlurTarget = 0;
        this.distortionWave = 0;
        this.distortionAmplitude = 0;
    }

    // ============================================
    // PRESETS - Efeitos pré-configurados
    // ============================================

    /**
     * Hit Stop - Parada breve em impactos (estilo fighting game)
     */
    hitStop(intensity = 0.5) {
        this.freezeFrame(Math.floor(2 + intensity * 3));
        this.shake(intensity * 0.3, 8);
    }

    /**
     * Explosion - Efeito de explosão
     */
    explosion(intensity = 1.0) {
        this.shake(intensity, 20);
        this.flash('#ff6600', 8, 0.6);
        this.addTrauma(intensity * 0.5);
        this.chromaticAberration(intensity * 5);
    }

    /**
     * Landing - Impacto ao pousar
     */
    landing(force = 0.5) {
        this.shake(force * 0.2, 10);
        this.addTrauma(force * 0.2);
    }

    /**
     * Damage - Efeito de dano
     */
    damage(severity = 0.5) {
        this.shake(severity * 0.4, 12);
        this.flash('#ff0000', 6, severity * 0.5);
        this.addTrauma(severity * 0.3);
    }

    /**
     * Victory - Efeito de vitória
     */
    victory() {
        this.flash('#ffd700', 30, 0.5);
        this.setSlowMotion(0.3, 60);
        this.setZoom(1.2);
    }

    /**
     * Death - Efeito de morte
     */
    death() {
        this.freezeFrame(5);
        this.flash('#000000', 40, 0.8);
        this.setSlowMotion(0.1, 30);
        this.addTrauma(1.0);
    }

    /**
     * Speedlines - Efeito de velocidade
     */
    speedLines(velocity) {
        const intensity = Math.min(velocity / 20, 1.0);
        this.chromaticAberration(intensity * 3);
        this.setMotionBlur(intensity * 0.5);
    }
}

// Instância global do sistema de efeitos
export const screenEffects = new ScreenEffects();
