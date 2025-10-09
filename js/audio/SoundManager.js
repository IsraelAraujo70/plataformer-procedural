// ============================================
// SOUND MANAGER - Gerencia todos os sons e música do jogo
// ============================================

import { SoundSynthesizer } from './SoundSynthesizer.js';
import { BiomeMusic } from './BiomeMusic.js';

export class SoundManager {
    constructor() {
        this.synthesizer = new SoundSynthesizer();

        // Volumes (0.0 a 1.0)
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
        this.isMuted = false;

        // Música de fundo atual
        this.currentMusic = null;
        this.musicGainNode = null;
        this.musicOscillators = [];

        // Sistema de música por bioma
        this.biomeMusic = null; // Será inicializado depois

        // Carregar preferências salvas
        this.loadPreferences();

        // Flag para evitar múltiplos sons simultâneos do mesmo tipo
        this.soundCooldowns = new Map();
    }

    // Inicializar sistema de música de bioma (após audio context estar pronto)
    initBiomeMusic() {
        if (!this.biomeMusic) {
            this.biomeMusic = new BiomeMusic(this);
        }
    }

    // ============================================
    // CONFIGURAÇÕES E PREFERÊNCIAS
    // ============================================

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        this.savePreferences();
        this.updateMusicVolume();
    }

    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        this.savePreferences();
        this.updateMusicVolume();
    }

    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.savePreferences();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.savePreferences();
        this.updateMusicVolume();
        return this.isMuted;
    }

    setMuted(muted) {
        this.isMuted = muted;
        this.savePreferences();
        this.updateMusicVolume();
    }

    getEffectiveVolume(type = 'sfx') {
        if (this.isMuted) return 0;
        if (type === 'music') {
            return this.masterVolume * this.musicVolume;
        }
        return this.masterVolume * this.sfxVolume;
    }

    savePreferences() {
        const prefs = {
            masterVolume: this.masterVolume,
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        };
        localStorage.setItem('audioPreferences', JSON.stringify(prefs));
    }

    loadPreferences() {
        const saved = localStorage.getItem('audioPreferences');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                this.masterVolume = prefs.masterVolume ?? 0.7;
                this.musicVolume = prefs.musicVolume ?? 0.5;
                this.sfxVolume = prefs.sfxVolume ?? 0.8;
                this.isMuted = prefs.isMuted ?? false;
            } catch (e) {
                console.warn('Failed to load audio preferences:', e);
            }
        }
    }

    // ============================================
    // EFEITOS SONOROS (SFX)
    // ============================================

    // Helper para prevenir spam de sons
    canPlaySound(soundName, cooldownMs = 50) {
        const now = Date.now();
        const lastPlayed = this.soundCooldowns.get(soundName) || 0;
        if (now - lastPlayed < cooldownMs) {
            return false;
        }
        this.soundCooldowns.set(soundName, now);
        return true;
    }

    // Aplicar volume efetivo (wrapper para todos os sons)
    playSfx(soundFunction, cooldownMs = 50, soundName = null) {
        const effectiveName = soundName || soundFunction.name;

        if (!this.canPlaySound(effectiveName, cooldownMs)) {
            return;
        }

        const effectiveVolume = this.getEffectiveVolume('sfx');
        if (effectiveVolume === 0) return;

        // Resume audio context se necessário
        this.synthesizer.resume();

        // Executar som (o volume já está aplicado dentro do synthesizer)
        soundFunction();
    }

    // Sons do Player
    playJump() {
        this.playSfx(() => this.synthesizer.jump(), 100, 'jump');
    }

    playLand() {
        this.playSfx(() => this.synthesizer.land(), 100, 'land');
    }

    playDamage() {
        this.playSfx(() => this.synthesizer.damage(), 200, 'damage');
    }

    playDeath() {
        this.playSfx(() => this.synthesizer.death(), 500, 'death');
    }

    // Sons de Collectibles
    playCoin() {
        this.playSfx(() => this.synthesizer.coin(), 50, 'coin');
    }

    playHatCollect() {
        this.playSfx(() => this.synthesizer.hatCollect(), 100, 'hatCollect');
    }

    playModifier() {
        this.playSfx(() => this.synthesizer.modifier(), 100, 'modifier');
    }

    // Sons de Combate
    playStomp() {
        this.playSfx(() => this.synthesizer.stomp(), 80, 'stomp');
    }

    playShoot() {
        this.playSfx(() => this.synthesizer.shoot(), 100, 'shoot');
    }

    playProjectileHit() {
        this.playSfx(() => this.synthesizer.projectileHit(), 80, 'projectileHit');
    }

    // Sons Especiais
    playShieldBreak() {
        this.playSfx(() => this.synthesizer.shieldBreak(), 200, 'shieldBreak');
    }

    playSwap() {
        this.playSfx(() => this.synthesizer.swap(), 200, 'swap');
    }

    playVictory() {
        this.playSfx(() => this.synthesizer.victory(), 1000, 'victory');
    }

    playGameOver() {
        this.playSfx(() => this.synthesizer.gameOver(), 1000, 'gameOver');
    }

    // Sons de UI
    playButtonClick() {
        this.playSfx(() => this.synthesizer.buttonClick(), 80, 'buttonClick');
    }

    playButtonHover() {
        this.playSfx(() => this.synthesizer.buttonHover(), 100, 'buttonHover');
    }

    // ============================================
    // MÚSICA DE FUNDO (Procedural)
    // ============================================

    updateMusicVolume() {
        if (this.musicGainNode) {
            const volume = this.getEffectiveVolume('music');
            this.musicGainNode.gain.setValueAtTime(volume, this.synthesizer.audioContext.currentTime);
        }
    }

    stopMusic() {
        if (this.musicOscillators.length > 0) {
            this.musicOscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {
                    // Oscillator já parado
                }
            });
            this.musicOscillators = [];
        }

        // Parar música de bioma se existir
        if (this.biomeMusic) {
            this.biomeMusic.stop();
        }

        this.currentMusic = null;
    }

    // Música de menu
    playMenuMusic() {
        if (this.currentMusic === 'menu') return;

        this.stopMusic();
        this.synthesizer.resume();
        this.initBiomeMusic();

        this.currentMusic = 'menu';

        // Criar gain node para controlar volume da música
        const ctx = this.synthesizer.audioContext;
        this.musicGainNode = ctx.createGain();
        this.musicGainNode.gain.setValueAtTime(this.getEffectiveVolume('music'), ctx.currentTime);
        this.musicGainNode.connect(ctx.destination);

        // Tocar música de menu usando BiomeMusic
        this.biomeMusic.playBiomeMusic('menu');
    }

    // Música de gameplay (começa com Plains)
    playGameplayMusic() {
        if (this.currentMusic === 'gameplay') return;

        this.stopMusic();
        this.synthesizer.resume();
        this.initBiomeMusic();

        this.currentMusic = 'gameplay';

        // Criar gain node para controlar volume da música
        const ctx = this.synthesizer.audioContext;
        this.musicGainNode = ctx.createGain();
        this.musicGainNode.gain.setValueAtTime(this.getEffectiveVolume('music'), ctx.currentTime);
        this.musicGainNode.connect(ctx.destination);

        // Começar com música de Plains (primeiro bioma)
        this.biomeMusic.playBiomeMusic('plains');
    }

    // Trocar música para bioma específico
    playBiomeMusic(biomeName) {
        if (!this.biomeMusic || this.currentMusic !== 'gameplay') return;

        this.synthesizer.resume();

        // Parar osciladores antigos
        this.musicOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // Já parado
            }
        });
        this.musicOscillators = [];

        // Tocar nova música de bioma
        this.biomeMusic.playBiomeMusic(biomeName);
    }

    // Música de vitória - fanfarra épica
    playVictoryMusic() {
        if (this.currentMusic === 'victory') return;

        this.stopMusic();
        this.synthesizer.resume();

        this.currentMusic = 'victory';

        const ctx = this.synthesizer.audioContext;
        const now = ctx.currentTime;

        this.musicGainNode = ctx.createGain();
        this.musicGainNode.gain.setValueAtTime(this.getEffectiveVolume('music'), now);
        this.musicGainNode.connect(ctx.destination);

        // Fanfarra vitoriosa (não loop)
        const fanfare = [
            { freq: 523.25, duration: 0.4 },  // C5
            { freq: 523.25, duration: 0.4 },  // C5
            { freq: 659.25, duration: 0.4 },  // E5
            { freq: 783.99, duration: 0.6 },  // G5
            { freq: 1046.50, duration: 1.2 }  // C6 (final longo)
        ];

        let time = 0;
        fanfare.forEach(note => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(this.musicGainNode);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.freq, ctx.currentTime + time);

            gain.gain.setValueAtTime(0, ctx.currentTime + time);
            gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + time + 0.05);
            gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + time + note.duration - 0.2);
            gain.gain.linearRampToValueAtTime(0, ctx.currentTime + time + note.duration);

            osc.start(ctx.currentTime + time);
            osc.stop(ctx.currentTime + time + note.duration);

            this.musicOscillators.push(osc);

            time += note.duration;
        });
    }
}

// Instância singleton global
export const soundManager = new SoundManager();
