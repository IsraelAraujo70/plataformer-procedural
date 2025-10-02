import { game } from './game.js';
import { toggleDevMode, handleDevModeKeys } from './devMode.js';

// ============================================
// CONTROLES DE TECLADO
// ============================================

export function setupInputHandlers() {
    document.addEventListener('keydown', (e) => {
        game.keys[e.key] = true;

        // Detectar F3 para toggle dev mode
        if (e.key === 'F3') {
            e.preventDefault();
            toggleDevMode();
            return;
        }

        // Detectar sequência D-E-V
        const now = Date.now();
        if (now - game.devMode.lastKeyTime > 1000) {
            game.devMode.keySequence = [];
        }
        game.devMode.keySequence.push(e.key.toUpperCase());
        game.devMode.lastKeyTime = now;

        if (game.devMode.keySequence.join('') === 'DEV') {
            toggleDevMode();
            game.devMode.keySequence = [];
            return;
        }

        // Comandos de dev mode
        handleDevModeKeys(e.key);

        // Pause
        if (e.key === 'p' || e.key === 'P') {
            if (game.state === 'playing') {
                game.state = 'paused';
                const menu = document.getElementById('menu');
                menu.innerHTML = `
                    <h1>PAUSADO</h1>
                    <button onclick="window.resumeGame()">Continuar</button>
                    <button onclick="location.reload()">Menu Principal</button>
                `;
                menu.classList.remove('hidden');
            }
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });
}

// Função global para resumir o jogo
window.resumeGame = function() {
    game.state = 'playing';
    document.getElementById('menu').classList.add('hidden');
    game.lastTime = performance.now();
};
