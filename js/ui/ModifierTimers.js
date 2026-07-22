import { game } from '../game.js';

const MODIFIER_UI = [
    { type: 'jump', property: 'jumpBoostTime', name: 'MOON LEGS', icon: '&#8593;', color: '#20e0f4' },
    { type: 'speed', property: 'speedBoostTime', name: 'TURBO BEAN', icon: '&#9889;', color: '#b8f236' },
    { type: 'shield', property: 'shieldTime', name: 'NOPE SHIELD', icon: '&#9670;', color: '#ffdc38' },
    { type: 'reverse', property: 'reverseControlsTime', name: 'WRONG WAY', icon: '&#8644;', color: '#ff4f5e', bad: true },
    { type: 'ice', property: 'icyFloorTime', name: 'SOAP SHOES', icon: '&#10052;', color: '#6ff7ff', bad: true },
    { type: 'doublejump', property: 'doubleJumpTime', name: 'EXTRA BOING', icon: '&#8657;', color: '#d97bff' },
    { type: 'magnet', property: 'magnetTime', name: 'COIN CRUSH', icon: 'U', color: '#ffdc38' },
    { type: 'tiny', property: 'tinyPlayerTime', name: 'POCKET MODE', icon: '&#9662;', color: '#ff72bd', bad: true },
    { type: 'heavy', property: 'heavyTime', name: 'CHONK MODE', icon: '&#8595;', color: '#ff8a3d', bad: true },
    { type: 'bouncy', property: 'bouncyTime', name: 'FULL BOING', icon: 'O', color: '#ff72bd' },
    { type: 'timewarp', property: 'timeWarpTime', name: 'TIME CRIME', icon: '&#9201;', color: '#b37aff', bad: true }
];

function collectActiveModifiers() {
    const players = [game.player, game.player2].filter(player =>
        player && !player.dying && !player.completelyDead
    );

    return MODIFIER_UI.filter(modifier =>
        players.some(player => player[modifier.property] > 0)
    );
}

function renderCards(root, timers) {
    root.innerHTML = timers.map(timer => `
        <article class="modifier-card${timer.bad ? ' is-bad' : ''}" data-modifier-key="${timer.type}" style="--effect:${timer.color}">
            <span class="modifier-icon" aria-hidden="true">${timer.icon}</span>
            <strong class="modifier-name">${timer.name}</strong>
        </article>
    `).join('');
}

export function drawModifierTimers() {
    const root = document.getElementById('modifierHud');
    if (!root) return;

    if (game.state !== 'playing') {
        root.classList.add('hidden');
        root.replaceChildren();
        root.dataset.signature = '';
        return;
    }

    const timers = collectActiveModifiers();
    if (timers.length === 0) {
        root.classList.add('hidden');
        root.replaceChildren();
        root.dataset.signature = '';
        return;
    }

    const signature = timers.map(timer => timer.type).join('|');
    if (root.dataset.signature !== signature) {
        renderCards(root, timers);
        root.dataset.signature = signature;
    }

    root.classList.remove('hidden');
}
