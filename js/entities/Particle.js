import { game } from '../game.js';
import { worldToIso } from '../utils/Isometric.js';

// ============================================
// PARTICLE - Sistema 3D Isométrico
// ============================================
export class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.z = 0; // Altura inicial
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6 - 2;
        this.vz = Math.random() * 3 + 1; // Velocidade vertical 3D
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
        this.size = Math.random() * 4 + 2;
        this.rotation = Math.random() * Math.PI * 2; // Rotação inicial
        this.rotationSpeed = (Math.random() - 0.5) * 0.3; // Velocidade de rotação
    }

    update() {
        // Movimento 3D
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        // Gravidade afeta Z
        this.vz -= 0.4;

        // Quando atinge o chão (z <= 0), quica um pouco
        if (this.z <= 0) {
            this.z = 0;
            this.vz *= -0.4; // Quique com perda de energia
            this.vx *= 0.8; // Fricção
            this.vy *= 0.8;
        }

        // Rotação contínua
        this.rotation += this.rotationSpeed;

        this.life--;
    }

    draw(ctx) {
        const alpha = this.life / this.maxLife;

        // Converter para isométrico
        const isoPos = worldToIso(this.x, this.y, this.z);
        const screenX = isoPos.isoX - game.camera.x;
        const screenY = isoPos.isoY - game.camera.y;

        // Salvar contexto para rotação
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.rotation);

        // Desenhar partícula com efeito 3D
        ctx.globalAlpha = alpha;

        // Formato baseado na distância (losango isométrico)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size);
        ctx.lineTo(this.size, 0);
        ctx.lineTo(0, this.size);
        ctx.lineTo(-this.size, 0);
        ctx.closePath();
        ctx.fill();

        // Brilho no centro
        const brightness = this.adjustBrightness(this.color, 60);
        ctx.fillStyle = brightness;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.restore();
    }

    adjustBrightness(color, amount) {
        // Se a cor está em formato rgb/rgba
        if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g);
            if (match) {
                let r = parseInt(match[0]);
                let g = parseInt(match[1]);
                let b = parseInt(match[2]);

                r = Math.max(0, Math.min(255, r + amount));
                g = Math.max(0, Math.min(255, g + amount));
                b = Math.max(0, Math.min(255, b + amount));

                return `rgb(${r}, ${g}, ${b})`;
            }
        }

        // Se a cor está em formato hexadecimal
        const hex = color.replace('#', '');
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);

        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));

        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}
