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
    // PLAINS - Aventura alegre e pastoral (EXPANDIDA)
    // ============================================
    playPlainsMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.4; // 150 BPM
        let time = 0;

        // ===== SEÇÃO 1: INTRODUÇÃO (5 compassos com transição suave) =====
        // Introdução suave com arpejo e acordes graduais
        const intro = [
            { chord: [261.63, 329.63, 392.00], bass: 130.81, arp: [261.63, 329.63, 392.00, 523.25], melody: null },
            { chord: [392.00, 493.88, 587.33], bass: 196.00, arp: [392.00, 493.88, 587.33, 783.99], melody: null },
            { chord: [440.00, 523.25, 659.25], bass: 220.00, arp: [440.00, 523.25, 659.25, 880.00], melody: [880.00, 783.99] }, // Começa melodia suave
            { chord: [349.23, 440.00, 523.25], bass: 174.61, arp: [349.23, 440.00, 523.25, 698.46], melody: [698.46, 659.25, 587.33, 523.25] }, // Melodia mais presente
            { chord: [392.00, 493.88, 587.33], bass: [196.00, 220.00, 246.94, 261.63], arp: null, melody: [783.99, 659.25, 587.33, 659.25], transition: true } // Compasso de transição
        ];

        intro.forEach((bar, idx) => {
            const volume = 0.015 + (idx * 0.004); // Volume crescente gradual

            // Bass
            if (Array.isArray(bar.bass)) {
                // Walking bass no último compasso
                bar.bass.forEach((freq, i) => {
                    this.createNote(freq, now + time + (i * beatLength), beatLength * 0.8, 'triangle', 0.045);
                });
            } else {
                const bassWave = bar.transition ? 'triangle' : 'sine';
                const bassVol = bar.transition ? 0.045 : 0.03 + (idx * 0.004);
                this.createNote(bar.bass, now + time, beatLength * 4, bassWave, bassVol);
            }

            // Chord atmosférico
            this.createChord(bar.chord, now + time, beatLength * 4, 'sine', volume);

            // Arpejo introdutório
            if (bar.arp) {
                bar.arp.forEach((freq, i) => {
                    this.createNote(freq, now + time + (i * beatLength), beatLength * 0.9, 'triangle', 0.025 + (idx * 0.004));
                });
            }

            // Melodia (entra gradualmente a partir do 3º compasso)
            if (bar.melody) {
                bar.melody.forEach((freq, i) => {
                    const melodyVol = bar.transition ? 0.04 : 0.03;
                    const melodyWave = bar.transition ? 'square' : 'sine';
                    const noteDuration = bar.melody.length === 2 ? beatLength * 2 : beatLength * 0.8;
                    const noteStart = bar.melody.length === 2 ? i * beatLength * 2 : i * beatLength;
                    this.createNote(freq, now + time + noteStart, noteDuration, melodyWave, melodyVol);
                });
            }

            // Adicionar contra-melodia suave no compasso de transição
            if (bar.transition) {
                const counter = [587.33, 523.25, 493.88, 523.25];
                counter.forEach((freq, i) => {
                    this.createNote(freq, now + time + (i * beatLength), beatLength * 0.8, 'triangle', 0.025);
                });

                // Hihat suave nos 4 beats
                for (let i = 0; i < 4; i++) {
                    this.createNote(8000, now + time + (i * beatLength), 0.03, 'square', 0.007);
                }
            }

            time += beatLength * 4;
        });

        // ===== SEÇÃO 2: VERSO PRINCIPAL (8 compassos) =====
        // Progressão expandida: C-G-Am-F-C-Em-F-G (I-V-vi-IV-I-iii-IV-V)
        const verse = [
            { chord: [261.63, 329.63, 392.00], bass: [130.81, 146.83, 164.81, 174.61], melody: [523.25, 587.33, 659.25, 587.33], counter: [392.00, 440.00, 523.25, 440.00] },
            { chord: [392.00, 493.88, 587.33], bass: [196.00, 220.00, 246.94, 261.63], melody: [783.99, 659.25, 587.33, 659.25], counter: [587.33, 523.25, 493.88, 523.25] },
            { chord: [440.00, 523.25, 659.25], bass: [220.00, 246.94, 261.63, 293.66], melody: [880.00, 783.99, 659.25, 783.99], counter: [659.25, 587.33, 523.25, 587.33] },
            { chord: [349.23, 440.00, 523.25], bass: [174.61, 196.00, 220.00, 233.08], melody: [698.46, 659.25, 587.33, 523.25], counter: [523.25, 493.88, 440.00, 392.00] },

            { chord: [261.63, 329.63, 392.00], bass: [130.81, 146.83, 164.81, 174.61], melody: [523.25, 659.25, 783.99, 659.25], counter: [392.00, 493.88, 587.33, 493.88] },
            { chord: [329.63, 392.00, 493.88], bass: [164.81, 174.61, 196.00, 220.00], melody: [659.25, 783.99, 880.00, 783.99], counter: [493.88, 587.33, 659.25, 587.33] },
            { chord: [349.23, 440.00, 523.25], bass: [174.61, 196.00, 220.00, 233.08], melody: [698.46, 783.99, 880.00, 783.99], counter: [523.25, 587.33, 659.25, 587.33] },
            { chord: [392.00, 493.88, 587.33], bass: [196.00, 220.00, 246.94, 261.63], melody: [783.99, 880.00, 1046.50, 880.00], counter: [587.33, 659.25, 783.99, 659.25] }
        ];

        verse.forEach((bar, idx) => {
            // Walking bass (4 notas por compasso)
            bar.bass.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 0.8, 'triangle', 0.05);
            });

            // Chord sustentado
            this.createChord(bar.chord, now + time, beatLength * 4, 'sine', 0.022);

            // Melodia principal
            bar.melody.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 0.8, 'square', 0.045);
            });

            // Contra-melodia (harmonia)
            bar.counter.forEach((freq, i) => {
                this.createNote(freq, now + time + (i * beatLength), beatLength * 0.8, 'triangle', 0.028);
            });

            // Percussão - hihat (chhh)
            for (let i = 0; i < 4; i++) {
                const noiseStart = now + time + (i * beatLength);
                this.createNote(8000 + Math.random() * 2000, noiseStart, 0.03, 'square', 0.008);
            }

            // Percussão - kick (bump) em tempo forte
            if (idx % 2 === 0) {
                this.createNote(60, now + time, 0.08, 'sine', 0.06);
                this.createNote(60, now + time + (beatLength * 2), 0.08, 'sine', 0.06);
            }

            time += beatLength * 4;
        });

        // ===== SEÇÃO 3: BRIDGE/VARIAÇÃO (8 compassos) =====
        // Mudança de atmosfera com acordes sus4 e variações climáticas
        const bridge = [
            // Parte 1: Subida climática (4 compassos)
            { chord: [261.63, 349.23, 392.00], bass: 130.81, arp: [523.25, 698.46, 783.99, 1046.50, 783.99, 698.46, 523.25, 698.46], melody: [1046.50, 987.77, 880.00, 783.99], counter: [783.99, 659.25, 587.33, 523.25], isLast: false }, // Csus4
            { chord: [293.66, 392.00, 440.00], bass: 146.83, arp: [587.33, 783.99, 880.00, 1174.66, 880.00, 783.99, 587.33, 783.99], melody: [1174.66, 1046.50, 987.77, 880.00], counter: [880.00, 783.99, 659.25, 587.33], isLast: false }, // Dsus4
            { chord: [349.23, 440.00, 523.25], bass: 174.61, arp: [698.46, 880.00, 1046.50, 1396.91, 1046.50, 880.00, 698.46, 880.00], melody: [1396.91, 1318.51, 1174.66, 1046.50], counter: [1046.50, 987.77, 880.00, 783.99], isLast: false }, // F
            { chord: [392.00, 493.88, 587.33], bass: 196.00, arp: [783.99, 987.77, 1174.66, 1567.98, 1174.66, 987.77, 783.99, 987.77], melody: [1567.98, 1396.91, 1318.51, 1174.66], counter: [1174.66, 1046.50, 987.77, 880.00], isLast: false }, // G (pico)

            // Parte 2: Variação e descida (4 compassos)
            { chord: [261.63, 329.63, 392.00], bass: [130.81, 164.81, 196.00, 220.00], arp: [1046.50, 783.99, 659.25, 523.25, 659.25, 783.99, 1046.50, 783.99], melody: [1046.50, 1174.66, 1318.51, 1174.66], counter: [783.99, 880.00, 987.77, 880.00], isLast: false }, // C (com walking bass)
            { chord: [220.00, 261.63, 329.63], bass: [110.00, 130.81, 164.81, 174.61], arp: [880.00, 659.25, 523.25, 440.00, 523.25, 659.25, 880.00, 659.25], melody: [880.00, 1046.50, 1174.66, 1046.50], counter: [659.25, 783.99, 880.00, 783.99], isLast: false }, // Am
            { chord: [349.23, 440.00, 523.25], bass: [174.61, 196.00, 220.00, 233.08], arp: [698.46, 880.00, 1046.50, 1396.91, 1046.50, 880.00, 698.46, 880.00], melody: [1396.91, 1318.51, 1174.66, 1046.50], counter: [1046.50, 987.77, 880.00, 783.99], isLast: false }, // F (reprise)
            { chord: [392.00, 493.88, 587.33], bass: 196.00, arp: [783.99, 659.25, 587.33, 523.25, 392.00, 329.63, 261.63, 329.63], melody: [783.99, 659.25, 587.33, 523.25], counter: [587.33, 523.25, 440.00, 392.00], isLast: true }  // G → transição descendente para loop
        ];

        bridge.forEach((bar, idx) => {
            const volumeFactor = bar.isLast ? 0.85 : 1.0; // Reduz volume no último compasso
            const isPart2 = idx >= 4; // Segunda parte do bridge (compassos 5-8)

            // Bass
            if (Array.isArray(bar.bass)) {
                // Walking bass (compassos 5 e 6)
                bar.bass.forEach((freq, i) => {
                    this.createNote(freq, now + time + (i * beatLength), beatLength * 0.8, 'triangle', 0.055 * volumeFactor);
                });
            } else {
                this.createNote(bar.bass, now + time, beatLength * 4, 'triangle', 0.055 * volumeFactor);
            }

            // Chord
            this.createChord(bar.chord, now + time, beatLength * 4, 'sine', 0.025 * volumeFactor);

            // Arpejo rápido (8 notas)
            bar.arp.forEach((freq, i) => {
                const noteVolume = bar.isLast ? 0.035 * (1 - i * 0.08) : 0.035; // Fade out no último
                this.createNote(freq, now + time + (i * beatLength * 0.5), beatLength * 0.45, 'triangle', noteVolume * volumeFactor);
            });

            // Melodia alta (climática)
            bar.melody.forEach((freq, i) => {
                const noteVolume = bar.isLast ? 0.04 * (1 - i * 0.15) : 0.04; // Fade out no último
                this.createNote(freq, now + time + (i * beatLength), beatLength * 0.9, 'sine', noteVolume * volumeFactor);
            });

            // Contra-melodia (harmonia rica)
            if (bar.counter) {
                bar.counter.forEach((freq, i) => {
                    const counterVolume = bar.isLast ? 0.028 * (1 - i * 0.12) : 0.028;
                    this.createNote(freq, now + time + (i * beatLength), beatLength * 0.9, 'triangle', counterVolume * volumeFactor);
                });
            }

            // Percussão energética
            if (!bar.isLast) {
                for (let i = 0; i < 8; i++) {
                    const noiseStart = now + time + (i * beatLength * 0.5);
                    const noiseVol = isPart2 ? 0.010 : 0.012; // Levemente reduzida na parte 2
                    this.createNote(7000 + Math.random() * 3000, noiseStart, 0.025, 'square', noiseVol);
                }
            } else {
                // Percussão mais espaçada no último compasso (fade out)
                for (let i = 0; i < 4; i++) {
                    const noiseStart = now + time + (i * beatLength);
                    this.createNote(7000 + Math.random() * 2000, noiseStart, 0.02, 'square', 0.008 * (1 - i * 0.2));
                }
            }

            // Kick reforçado
            if (!bar.isLast) {
                this.createNote(55, now + time, 0.1, 'sine', 0.07);
                this.createNote(55, now + time + (beatLength * 2), 0.1, 'sine', 0.07);
            } else {
                this.createNote(55, now + time, 0.1, 'sine', 0.05); // Kick mais suave no final
            }

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
    // DESERT - Exótico, árabe e contemplativo
    // ============================================
    playDesertMusic() {
        const now = this.ctx.currentTime;
        const beatLength = 0.42; // 143 BPM - ritmo moderado árabe
        let time = 0;

        // Escala Hijaz em D (D - Eb - F# - G - A - Bb - C# - D)
        // Característica da música árabe/persa
        const scale = {
            D: 293.66,
            Eb: 311.13,
            Fsharp: 369.99,
            G: 392.00,
            A: 440.00,
            Bb: 466.16,
            Csharp: 554.37,
            Dhigh: 587.33
        };

        // ===== INTRODUÇÃO (2 compassos) =====
        // Drone D constante (típico da música árabe)
        this.createNote(scale.D / 2, now + time, beatLength * 16, 'sine', 0.045);

        // Flauta ney introdutória (melodia contemplativa)
        const intro = [scale.D, scale.Fsharp, scale.G, scale.A];
        intro.forEach((freq, i) => {
            this.createNote(freq, now + time + (i * beatLength * 2), beatLength * 1.8, 'sine', 0.045);
        });
        time += beatLength * 8;

        // ===== SEÇÃO 1: MELODIA PRINCIPAL (4 compassos) =====
        const melodySection1 = [
            // Compasso 1 - frase ascendente
            { notes: [scale.D, scale.Eb, scale.Fsharp, scale.G], durations: [1, 0.5, 0.5, 2] },
            // Compasso 2 - ornamentação
            { notes: [scale.A, scale.G, scale.Fsharp, scale.G, scale.A], durations: [0.75, 0.5, 0.5, 0.5, 1.75] },
            // Compasso 3 - subida para registro agudo
            { notes: [scale.Bb, scale.A, scale.Bb, scale.Csharp], durations: [0.75, 0.5, 0.75, 2] },
            // Compasso 4 - descida ornamentada
            { notes: [scale.Dhigh, scale.Csharp, scale.Bb, scale.A, scale.G], durations: [1, 0.75, 0.5, 0.75, 1] }
        ];

        melodySection1.forEach(bar => {
            let barTime = 0;
            bar.notes.forEach((freq, i) => {
                const duration = bar.durations[i] * beatLength;

                // Flauta ney principal
                this.createNote(freq, now + time + barTime, duration, 'sine', 0.050);

                // Vibrato sutil (característica da flauta ney)
                const vibrato = this.ctx.createOscillator();
                const vibratoGain = this.ctx.createGain();
                vibrato.connect(vibratoGain);
                vibratoGain.connect(this.manager.musicGainNode);

                vibrato.frequency.setValueAtTime(freq, now + time + barTime);
                vibrato.frequency.setValueAtTime(freq * 1.008, now + time + barTime + duration/3);
                vibrato.frequency.setValueAtTime(freq, now + time + barTime + 2*duration/3);

                vibratoGain.gain.setValueAtTime(0, now + time + barTime);
                vibratoGain.gain.linearRampToValueAtTime(0.020, now + time + barTime + 0.02);
                vibratoGain.gain.linearRampToValueAtTime(0, now + time + barTime + duration);

                vibrato.start(now + time + barTime);
                vibrato.stop(now + time + barTime + duration);
                this.manager.musicOscillators.push(vibrato);

                barTime += duration;
            });
            time += beatLength * 4;
        });

        // ===== SEÇÃO 2: VARIAÇÃO COM OUD (4 compassos) =====
        // Drone continua
        this.createNote(scale.D / 2, now + time, beatLength * 16, 'sine', 0.045);

        const oudMelody = [
            // Compasso 1 - arpejo característico
            { notes: [scale.D, scale.A, scale.D, scale.Fsharp, scale.A], durations: [0.75, 0.5, 0.5, 0.75, 1.5] },
            // Compasso 2 - resposta melódica
            { notes: [scale.G, scale.Fsharp, scale.Eb, scale.D], durations: [1, 1, 1, 1] },
            // Compasso 3 - tensão crescente
            { notes: [scale.D, scale.Fsharp, scale.A, scale.Bb, scale.Csharp], durations: [0.5, 0.5, 0.75, 0.75, 1.5] },
            // Compasso 4 - resolução
            { notes: [scale.Dhigh, scale.Bb, scale.A, scale.G, scale.Fsharp], durations: [1.25, 0.5, 0.75, 0.75, 0.75] }
        ];

        oudMelody.forEach(bar => {
            let barTime = 0;
            bar.notes.forEach((freq, i) => {
                const duration = bar.durations[i] * beatLength;

                // Oud (som triangular/cordas dedilhadas)
                this.createNote(freq, now + time + barTime, duration, 'triangle', 0.045);
                // Harmônico da corda
                this.createNote(freq * 2, now + time + barTime, duration * 0.3, 'sine', 0.018);

                barTime += duration;
            });
            time += beatLength * 4;
        });

        // ===== SEÇÃO 3: CLÍMAX COM PERCUSSÃO (4 compassos) =====
        const climax = [
            // Compasso 1
            { notes: [scale.Dhigh, scale.Csharp, scale.Dhigh, scale.A], durations: [0.75, 0.5, 1, 1.75], percussion: true },
            // Compasso 2
            { notes: [scale.Bb, scale.Csharp, scale.Dhigh, scale.Csharp, scale.Bb], durations: [0.5, 0.5, 1, 1, 1], percussion: true },
            // Compasso 3
            { notes: [scale.A, scale.G, scale.Fsharp, scale.G, scale.A, scale.Bb], durations: [0.5, 0.5, 0.5, 0.5, 1, 1], percussion: true },
            // Compasso 4 - resolução final
            { notes: [scale.A, scale.G, scale.Fsharp, scale.D], durations: [1, 1, 1, 1], percussion: false }
        ];

        climax.forEach((bar, barIdx) => {
            let barTime = 0;

            // Drone continua
            this.createNote(scale.D / 2, now + time, beatLength * 4, 'sine', 0.045);

            // Melodia principal
            bar.notes.forEach((freq, i) => {
                const duration = bar.durations[i] * beatLength;

                // Flauta dupla (oitavas)
                this.createNote(freq, now + time + barTime, duration, 'sine', 0.050);
                this.createNote(freq * 2, now + time + barTime, duration, 'sine', 0.028);

                barTime += duration;
            });

            // Percussão árabe (darbuka pattern)
            if (bar.percussion) {
                // Dum (grave) - beats 1 e 3
                this.createNote(80, now + time, 0.08, 'sine', 0.060);
                this.createNote(80, now + time + (beatLength * 2), 0.08, 'sine', 0.060);

                // Tak (agudo) - padrão rítmico
                const takPattern = [1, 1.5, 2.5, 3, 3.5];
                takPattern.forEach(beat => {
                    this.createNote(800 + Math.random() * 400, now + time + (beat * beatLength), 0.04, 'square', 0.020);
                });
            }

            time += beatLength * 4;
        });

        // ===== CONCLUSÃO (2 compassos - fade suave) =====
        // Drone final
        this.createNote(scale.D / 2, now + time, beatLength * 8, 'sine', 0.045);

        // Flauta conclusiva (descida gradual)
        const outro = [scale.A, scale.G, scale.Fsharp, scale.D];
        outro.forEach((freq, i) => {
            const volume = 0.045 * (1 - i * 0.15); // Fade out
            this.createNote(freq, now + time + (i * beatLength * 2), beatLength * 1.8, 'sine', volume);
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
