import { game } from './game.js';
import { toggleDevMode, handleDevModeKeys } from './devMode.js';
import { pauseGame } from './menu.js';

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
            pauseGame();
        }
    });

    document.addEventListener('keyup', (e) => {
        game.keys[e.key] = false;
    });
}
