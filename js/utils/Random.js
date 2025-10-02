// ============================================
// PRNG - Gerador de números pseudo-aleatórios determinístico
// ============================================
export class Random {
    constructor(seed) {
        this.seed = seed >>> 0; // Garante uint32
    }

    // Mulberry32 - PRNG rápido e simples
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    range(min, max) {
        return min + this.next() * (max - min);
    }

    int(min, max) {
        return Math.floor(this.range(min, max + 1));
    }

    choice(array) {
        return array[this.int(0, array.length - 1)];
    }
}
