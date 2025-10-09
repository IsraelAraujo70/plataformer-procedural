// ============================================
// BIOME MUSIC - Músicas únicas para cada bioma
// ============================================

export class BiomeMusic {
    constructor(soundManager) {
        this.manager = soundManager;
        this.ctx = soundManager.synthesizer.audioContext;
        this.currentBiome = null;
        this.loopTimeout = null;
    }

    // Helper para criar nota com envelope
    createNote(freq, startTime, duration, waveType = 'sine', volume = 0.04) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.manager.musicGainNode);

        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, startTime);

        // Envelope ADSR
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(volume * 0.7, startTime + duration - 0.1);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);

        osc.start(startTime);
        osc.stop(startTime + duration);

        this.manager.musicOscillators.push(osc);
        return { osc, gain };
    }

    // Helper para criar acorde
    createChord(freqs, startTime, duration, waveType = 'sine', volume = 0.025) {
        freqs.forEach(freq => {
            this.createNote(freq, startTime, duration, waveType, volume);
        });
    }

    // Helper para criar arpejo
    createArpeggio(freqs, startTime, noteLength, waveType = 'triangle', volume = 0.035) {
        freqs.forEach((freq, i) => {
            this.createNote(freq, startTime + (i * noteLength), noteLength, waveType, volume);
        });
    }

    // ============================================
    // PLAINS - Aventura alegre e pastoral
    // ============================================
    playPlainsMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.4; // 150 BPM

        // Progressão: I-V-vi-IV (C-G-Am-F)
        const progression = [
            // Compasso 1: C major
            { chord: [261.63, 329.63, 392.00], bass: 130.81, melody: [523.25, 587.33, 659.25, 587.33] },
            // Compasso 2: G major
            { chord: [392.00, 493.88, 587.33], bass: 196.00, melody: [783.99, 659.25, 587.33, 659.25] },
            // Compasso 3: A minor
            { chord: [440.00, 523.25, 659.25], bass: 220.00, melody: [880.00, 783.99, 659.25, 783.99] },
            // Compasso 4: F major
            { chord: [349.23, 440.00, 523.25], bass: 174.61, melody: [698.46, 659.25, 587.33, 523.25] }
        ];

        let time = 0;
        progression.forEach((bar, barIdx) => {
            // Bass (baixo walking)
            this.createNote(bar.bass, now + time, beatLength * 4, 'triangle', 0.05);

            // Chord (acorde sustentado)
            this.createChord(bar.chord, now + time, beatLength * 4, 'sine', 0.02);

            // Melody (melodia dançante)
            bar.melody.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 0.8, 'square', 0.045);
            });

            time += beatLength * 4;
        });

        // Loop
        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'plains') this.playPlainsMusic();
        }, totalDuration);
    }

    // ============================================
    // CAVE - Escuro, misterioso e tenso
    // ============================================
    playCaveMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.5; // 120 BPM - mais lento

        // Progressão menor sombria: Am-Em-Dm-Am
        const progression = [
            { chord: [220.00, 261.63, 329.63], bass: 110.00, melody: [440.00, 523.25, 440.00, 392.00] },
            { chord: [329.63, 392.00, 493.88], bass: 164.81, melody: [659.25, 587.33, 523.25, 493.88] },
            { chord: [293.66, 349.23, 440.00], bass: 146.83, melody: [587.33, 523.25, 493.88, 440.00] },
            { chord: [220.00, 261.63, 329.63], bass: 110.00, melody: [440.00, 392.00, 329.63, 293.66] }
        ];

        let time = 0;
        progression.forEach(bar => {
            // Bass pulsante (grave)
            for (let i = 0; i < 4; i++) {
                this.createNote(bar.bass, now + time + (i * beatLength), beatLength * 0.3, 'sine', 0.06);
            }

            // Chord atmosférico (pad)
            this.createChord(bar.chord, now + time, beatLength * 4, 'triangle', 0.015);

            // Melody ecoante
            bar.melody.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 1.5, 'sine', 0.03);
            });

            time += beatLength * 4;
        });

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'cave') this.playCaveMusic();
        }, totalDuration);
    }

    // ============================================
    // ICE - Cristalino, etéreo e frio
    // ============================================
    playIceMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.35; // 170 BPM - rápido e brilhante

        // Progressão: Dm-Bb-C-Am (tons frios)
        const progression = [
            { chord: [293.66, 349.23, 440.00], arp: [293.66, 440.00, 587.33, 880.00, 587.33, 440.00] },
            { chord: [233.08, 293.66, 349.23], arp: [233.08, 349.23, 466.16, 698.46, 466.16, 349.23] },
            { chord: [261.63, 329.63, 392.00], arp: [261.63, 392.00, 523.25, 783.99, 523.25, 392.00] },
            { chord: [220.00, 261.63, 329.63], arp: [220.00, 329.63, 440.00, 659.25, 440.00, 329.63] }
        ];

        let time = 0;
        progression.forEach(bar => {
            // Chord etéreo (background)
            this.createChord(bar.chord, now + time, beatLength * 6, 'sine', 0.018);

            // Arpejo cristalino
            bar.arp.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 0.9, 'triangle', 0.04);
            });

            time += beatLength * 6;
        });

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'ice') this.playIceMusic();
        }, totalDuration);
    }

    // ============================================
    // DESERT - Exótico, oriental e quente
    // ============================================
    playDesertMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.45; // 133 BPM

        // Escala árabe: E menor harmônico
        const melody1 = [329.63, 369.99, 415.30, 440.00, 493.88, 523.25, 587.33, 659.25];
        const melody2 = [659.25, 587.33, 523.25, 493.88, 440.00, 493.88, 523.25, 440.00];

        let time = 0;

        // Parte 1
        const drone = 164.81; // Drone em E
        this.createNote(drone, now + time, beatLength * 8, 'sine', 0.04);

        melody1.forEach((freq, i) => {
            this.createNote(freq, now + time + (i * beatLength), beatLength * 0.7, 'sawtooth', 0.035);
        });
        time += beatLength * 8;

        // Parte 2
        this.createNote(drone, now + time, beatLength * 8, 'sine', 0.04);

        melody2.forEach((freq, i) => {
            this.createNote(freq, now + time + (i * beatLength), beatLength * 0.7, 'sawtooth', 0.035);
            // Harmonia em terças
            this.createNote(freq * 1.25, now + time + (i * beatLength), beatLength * 0.7, 'triangle', 0.02);
        });
        time += beatLength * 8;

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'desert') this.playDesertMusic();
        }, totalDuration);
    }

    // ============================================
    // SKY - Aéreo, majestoso e flutuante
    // ============================================
    playSkyMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.5; // 120 BPM - majestoso

        // Progressão celestial: G-D-Em-C
        const progression = [
            { chord: [392.00, 493.88, 587.33], melody: [783.99, 880.00, 987.77, 880.00] },
            { chord: [587.33, 739.99, 880.00], melody: [1174.66, 1046.50, 987.77, 880.00] },
            { chord: [659.25, 783.99, 987.77], melody: [1318.51, 1174.66, 1046.50, 987.77] },
            { chord: [523.25, 659.25, 783.99], melody: [1046.50, 987.77, 880.00, 783.99] }
        ];

        let time = 0;
        progression.forEach(bar => {
            // Pad de acordes (atmosférico)
            this.createChord(bar.chord, now + time, beatLength * 4, 'sine', 0.025);

            // Melody soaring (voando alto)
            bar.melody.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 1.2, 'triangle', 0.04);
                // Harmonia oitava abaixo
                this.createNote(freq / 2, now + time + (i * beatLength), beatLength * 1.2, 'sine', 0.02);
            });

            time += beatLength * 4;
        });

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'sky') this.playSkyMusic();
        }, totalDuration);
    }

    // ============================================
    // APOCALYPSE - Caótico, agressivo e urgente
    // ============================================
    playApocalypseMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.25; // 240 BPM - RÁPIDO E AGRESSIVO

        // Progressão dissonante: Dm-Bb-F-C
        const riff = [
            293.66, 293.66, 293.66, 349.23,  // Dm riff
            233.08, 233.08, 233.08, 293.66,  // Bb
            349.23, 349.23, 349.23, 440.00,  // F
            261.63, 261.63, 349.23, 293.66   // C
        ];

        let time = 0;

        // Riff pesado e repetitivo
        riff.forEach((freq, i) => {
            this.createNote(freq, now + time, beatLength * 0.9, 'sawtooth', 0.05);
            // Octave doubling para peso
            this.createNote(freq / 2, now + time, beatLength * 0.9, 'square', 0.03);

            time += beatLength;
        });

        // Overlay caótico (ruído harmônico)
        for (let i = 0; i < 8; i++) {
            const randomFreq = 440 + Math.random() * 440;
            this.createNote(randomFreq, now + (i * beatLength * 2), beatLength * 0.3, 'square', 0.015);
        }

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'apocalypse') this.playApocalypseMusic();
        }, totalDuration);
    }

    // ============================================
    // MOON - Espacial, tranquilo e alien
    // ============================================
    playMoonMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.6; // 100 BPM - lento e espaçoso

        // Progressão ambígua: quartas e quintas
        const sequence = [
            { base: 220.00, intervals: [0, 3, 7, 10] },    // Am add9
            { base: 196.00, intervals: [0, 3, 7, 12] },    // G add9
            { base: 174.61, intervals: [0, 4, 7, 11] },    // F maj7
            { base: 164.81, intervals: [0, 3, 7, 10] }     // E min9
        ];

        let time = 0;
        sequence.forEach(seq => {
            // Chord espacial
            seq.intervals.forEach(interval => {
                const freq = seq.base * Math.pow(2, interval / 12);
                this.createNote(freq, now + time, beatLength * 4, 'sine', 0.022);
            });

            // Arpejo lento e etéreo
            seq.intervals.forEach((interval, i) => {
                const freq = seq.base * Math.pow(2, interval / 12) * 2;
                this.createNote(freq, now + time + (i * beatLength), beatLength * 1.5, 'triangle', 0.03);
            });

            time += beatLength * 4;
        });

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'moon') this.playMoonMusic();
        }, totalDuration);
    }

    // ============================================
    // BLACK_HOLE - Épico, final boss, intenso
    // ============================================
    playBlackHoleMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.3; // 200 BPM - INTENSO

        // Progressão épica e dramática
        const epicProgression = [
            { chord: [261.63, 311.13, 392.00], bass: 130.81, melody: [1046.50, 987.77, 880.00, 783.99] },
            { chord: [349.23, 415.30, 523.25], bass: 174.61, melody: [1396.91, 1318.51, 1174.66, 1046.50] },
            { chord: [392.00, 466.16, 587.33], bass: 196.00, melody: [1567.98, 1396.91, 1318.51, 1174.66] },
            { chord: [329.63, 392.00, 493.88], bass: 164.81, melody: [1318.51, 1174.66, 1046.50, 987.77] }
        ];

        let time = 0;
        epicProgression.forEach(bar => {
            // Bass poderoso (pulsante)
            for (let i = 0; i < 4; i++) {
                this.createNote(bar.bass, now + time + (i * beatLength * 2), beatLength * 0.4, 'square', 0.07);
            }

            // Chord épico (sustentado)
            this.createChord(bar.chord, now + time, beatLength * 8, 'sawtooth', 0.03);

            // Melody dramática
            bar.melody.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength * 2), beatLength * 1.8, 'triangle', 0.05);
                // Oitava abaixo para peso
                this.createNote(freq / 2, now + time + (i * beatLength * 2), beatLength * 1.8, 'square', 0.025);
            });

            time += beatLength * 8;
        });

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'black_hole') this.playBlackHoleMusic();
        }, totalDuration);
    }

    // ============================================
    // MENU - Alegre, convidativo, simples mas rico
    // ============================================
    playMenuMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.4;

        // Progressão: C-Am-F-G (clássica e amigável)
        const progression = [
            { chord: [261.63, 329.63, 392.00], melody: [523.25, 659.25, 523.25, 392.00] },
            { chord: [220.00, 261.63, 329.63], melody: [440.00, 523.25, 659.25, 523.25] },
            { chord: [349.23, 440.00, 523.25], melody: [698.46, 659.25, 587.33, 523.25] },
            { chord: [392.00, 493.88, 587.33], melody: [783.99, 659.25, 587.33, 523.25] }
        ];

        let time = 0;
        progression.forEach(bar => {
            // Bass
            this.createNote(bar.chord[0] / 2, now + time, beatLength * 4, 'triangle', 0.04);

            // Chord
            this.createChord(bar.chord, now + time, beatLength * 4, 'sine', 0.025);

            // Melody
            bar.melody.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 0.85, 'triangle', 0.04);
            });

            time += beatLength * 4;
        });

        const totalDuration = time * 1000;
        this.loopTimeout = setTimeout(() => {
            if (this.currentBiome === 'menu') this.playMenuMusic();
        }, totalDuration);
    }

    // ============================================
    // CONTROLE DE PLAYBACK
    // ============================================
    playBiomeMusic(biomeName) {
        // Limpar timeout anterior
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }

        this.currentBiome = biomeName;

        // Mapear nome do bioma para método
        const biomeMap = {
            'plains': () => this.playPlainsMusic(),
            'cave': () => this.playCaveMusic(),
            'ice': () => this.playIceMusic(),
            'desert': () => this.playDesertMusic(),
            'sky': () => this.playSkyMusic(),
            'apocalypse': () => this.playApocalypseMusic(),
            'moon': () => this.playMoonMusic(),
            'black_hole': () => this.playBlackHoleMusic(),
            'menu': () => this.playMenuMusic()
        };

        const playFunc = biomeMap[biomeName.toLowerCase()];
        if (playFunc) {
            playFunc();
        } else {
            console.warn(`Unknown biome: ${biomeName}`);
        }
    }

    stop() {
        if (this.loopTimeout) {
            clearTimeout(this.loopTimeout);
            this.loopTimeout = null;
        }
        this.currentBiome = null;
    }
}
