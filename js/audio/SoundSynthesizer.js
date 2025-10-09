// ============================================
// SOUND SYNTHESIZER - Gera sons procedurais usando Web Audio API
// ============================================

export class SoundSynthesizer {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume audio context (necessário para alguns navegadores)
    resume() {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // ============================================
    // SONS DO PLAYER
    // ============================================

    // Som de pulo - bounce com pitch subindo
    jump() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        // Onda quadrada para som "retro"
        oscillator.type = 'square';

        // Pitch sobe rapidamente (200Hz -> 400Hz)
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);

        // Envelope: attack rápido, decay curto
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }

    // Som de aterrissagem - thump baixo
    land() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';

        // Pitch desce (150Hz -> 50Hz) - som grave
        oscillator.frequency.setValueAtTime(150, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        oscillator.start(now);
        oscillator.stop(now + 0.1);
    }

    // Som de dano - efeito de "hit" descendente
    damage() {
        const now = this.audioContext.currentTime;

        // Oscilador principal
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Ruído branco para "impacto"
        const noiseBuffer = this.createNoiseBuffer(0.05);
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();

        noiseSource.buffer = noiseBuffer;

        oscillator.connect(gainNode);
        noiseSource.connect(noiseGain);
        gainNode.connect(this.audioContext.destination);
        noiseGain.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';

        // Pitch desce dramaticamente (600Hz -> 100Hz)
        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.2);

        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        // Ruído curto no início
        noiseGain.gain.setValueAtTime(0.15, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        oscillator.start(now);
        oscillator.stop(now + 0.2);
        noiseSource.start(now);
    }

    // Som de morte - descida dramática com vibrato
    death() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'triangle';

        // Pitch desce lentamente (400Hz -> 50Hz)
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);

        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.linearRampToValueAtTime(0.1, now + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        oscillator.start(now);
        oscillator.stop(now + 0.5);
    }

    // ============================================
    // SONS DE COLLECTIBLES
    // ============================================

    // Som de moeda - "bling" agudo e curto
    coin() {
        const now = this.audioContext.currentTime;

        // Dois tons para efeito "bling"
        for (let i = 0; i < 2; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';

            const startTime = now + (i * 0.05);
            const freq = i === 0 ? 800 : 1200;

            oscillator.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.1);
        }
    }

    // Som de chapéu coletado - "pop" positivo
    hatCollect() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';

        // Pitch sobe rapidamente (400Hz -> 800Hz)
        oscillator.frequency.setValueAtTime(400, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.08);

        gainNode.gain.setValueAtTime(0.25, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        oscillator.start(now);
        oscillator.stop(now + 0.15);
    }

    // Som de modificador - arpejo ascendente misterioso
    modifier() {
        const now = this.audioContext.currentTime;

        const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5 (acorde A maior)

        notes.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'triangle';

            const startTime = now + (i * 0.04);

            oscillator.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0.15, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.2);
        });
    }

    // ============================================
    // SONS DE COMBATE
    // ============================================

    // Som de pisar em inimigo - "squish"
    stomp() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        // Ruído para efeito de "squish"
        const noiseBuffer = this.createNoiseBuffer(0.08);
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();

        noiseSource.buffer = noiseBuffer;

        oscillator.connect(gainNode);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        gainNode.connect(this.audioContext.destination);
        noiseGain.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';

        // Pitch desce rápido (300Hz -> 80Hz)
        oscillator.frequency.setValueAtTime(300, now);
        oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        // Filtro passa-baixa para o ruído
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.08);

        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        oscillator.start(now);
        oscillator.stop(now + 0.12);
        noiseSource.start(now);
    }

    // Som de tiro de inimigo - "pew"
    shoot() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'square';

        // Pitch desce rápido (1000Hz -> 200Hz)
        oscillator.frequency.setValueAtTime(1000, now);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.08);

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        oscillator.start(now);
        oscillator.stop(now + 0.08);
    }

    // Som de projétil acertando - impacto
    projectileHit() {
        const now = this.audioContext.currentTime;

        const noiseBuffer = this.createNoiseBuffer(0.06);
        const noiseSource = this.audioContext.createBufferSource();
        const noiseGain = this.audioContext.createGain();
        const noiseFilter = this.audioContext.createBiquadFilter();

        noiseSource.buffer = noiseBuffer;

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.audioContext.destination);

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(500, now);

        noiseGain.gain.setValueAtTime(0.2, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        noiseSource.start(now);
    }

    // ============================================
    // SONS ESPECIAIS
    // ============================================

    // Som de escudo quebrando - vidro quebrando
    shieldBreak() {
        const now = this.audioContext.currentTime;

        // Múltiplos tons altos para efeito de vidro
        for (let i = 0; i < 5; i++) {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'triangle';

            const freq = 1500 + Math.random() * 1000;
            const startTime = now + (i * 0.02);

            oscillator.frequency.setValueAtTime(freq, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(freq * 0.5, startTime + 0.15);

            gainNode.gain.setValueAtTime(0.08, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.15);
        }
    }

    // Som de swap (troca de posição) - "whoosh"
    swap() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sawtooth';

        // Pitch sobe e desce rapidamente
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.2);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.2);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0.25, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        oscillator.start(now);
        oscillator.stop(now + 0.2);
    }

    // Som de vitória - fanfarra ascendente
    victory() {
        const now = this.audioContext.currentTime;

        // Sequência de notas vitoriosas (C-E-G-C maior)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'sine';

            const startTime = now + (i * 0.15);

            oscillator.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0.25, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.4);
        });
    }

    // Som de game over - arpejo descendente triste
    gameOver() {
        const now = this.audioContext.currentTime;

        // Sequência descendente (menor = triste)
        const notes = [440, 392, 349.23, 329.63]; // A4, G4, F4, E4

        notes.forEach((freq, i) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.type = 'triangle';

            const startTime = now + (i * 0.2);

            oscillator.frequency.setValueAtTime(freq, startTime);

            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

            oscillator.start(startTime);
            oscillator.stop(startTime + 0.5);
        });
    }

    // ============================================
    // SONS DE UI
    // ============================================

    // Som de clique de botão - click curto
    buttonClick() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';

        oscillator.frequency.setValueAtTime(600, now);
        oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        oscillator.start(now);
        oscillator.stop(now + 0.05);
    }

    // Som de hover em botão - tick suave
    buttonHover() {
        const now = this.audioContext.currentTime;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(500, now);

        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.03);

        oscillator.start(now);
        oscillator.stop(now + 0.03);
    }

    // ============================================
    // HELPERS
    // ============================================

    // Criar buffer de ruído branco
    createNoiseBuffer(duration) {
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }
}
