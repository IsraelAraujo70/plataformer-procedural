import { game } from './game.js';
import { CONFIG } from './config.js?v=player-scale-1';
import { Random } from './utils/Random.js';
import { Player } from './entities/Player.js?v=run-cycle-1';
import { resetContinueFlag } from './ui/ContinueModal.js';

export function setupMenuHandlers() {
    document.getElementById('start1PBtn').addEventListener('click', () => {
        game.soundManager?.playButtonClick();
        startGame(false);
    });

    document.getElementById('start2PBtn').addEventListener('click', () => {
        game.soundManager?.playButtonClick();
        startGame(true);
    });

    document.getElementById('instructionsBtn').addEventListener('click', () => {
        game.soundManager?.playButtonClick();
        document.getElementById('instructions').classList.toggle('hidden');
        document.getElementById('audioSettings').classList.add('hidden');
    });

    document.getElementById('audioBtn').addEventListener('click', () => {
        game.soundManager?.playButtonClick();
        document.getElementById('audioSettings').classList.toggle('hidden');
        document.getElementById('instructions').classList.add('hidden');
    });

    document.getElementById('pauseBtn').addEventListener('click', () => {
        game.soundManager?.playButtonClick();
        pauseGame();
    });

    document.querySelectorAll('[data-close-panel]').forEach(button => {
        button.addEventListener('click', () => {
            game.soundManager?.playButtonClick();
            document.getElementById(button.dataset.closePanel)?.classList.add('hidden');
        });
    });

    setupAudioControls();
}

function setupAudioControls() {
    const masterVolumeSlider = document.getElementById('masterVolume');
    const musicVolumeSlider = document.getElementById('musicVolume');
    const sfxVolumeSlider = document.getElementById('sfxVolume');
    const muteBtn = document.getElementById('muteBtn');
    const closeAudioBtn = document.getElementById('closeAudioBtn');

    if (game.soundManager) {
        masterVolumeSlider.value = game.soundManager.masterVolume * 100;
        musicVolumeSlider.value = game.soundManager.musicVolume * 100;
        sfxVolumeSlider.value = game.soundManager.sfxVolume * 100;
        updateVolumeDisplays();
    }

    masterVolumeSlider.addEventListener('input', event => {
        game.soundManager?.setMasterVolume(event.target.value / 100);
        updateVolumeDisplays();
    });

    musicVolumeSlider.addEventListener('input', event => {
        game.soundManager?.setMusicVolume(event.target.value / 100);
        updateVolumeDisplays();
    });

    sfxVolumeSlider.addEventListener('input', event => {
        game.soundManager?.setSfxVolume(event.target.value / 100);
        updateVolumeDisplays();
        game.soundManager?.playButtonHover();
    });

    muteBtn.addEventListener('click', () => {
        const isMuted = game.soundManager?.toggleMute();
        muteBtn.textContent = isMuted ? 'UNMUTE THE UNIVERSE' : 'MUTE THE UNIVERSE';
        game.soundManager?.playButtonClick();
    });

    closeAudioBtn.addEventListener('click', () => {
        game.soundManager?.playButtonClick();
        document.getElementById('audioSettings').classList.add('hidden');
    });

    document.querySelectorAll('#menu button').forEach(button => {
        button.addEventListener('mouseenter', () => game.soundManager?.playButtonHover());
    });
}

function updateVolumeDisplays() {
    document.getElementById('masterVolumeValue').textContent = `${Math.round(game.soundManager.masterVolume * 100)}%`;
    document.getElementById('musicVolumeValue').textContent = `${Math.round(game.soundManager.musicVolume * 100)}%`;
    document.getElementById('sfxVolumeValue').textContent = `${Math.round(game.soundManager.sfxVolume * 100)}%`;
}

export function startGame(twoPlayerMode = false) {
    game.seed = Math.floor(Math.random() * 1000000);
    game.twoPlayerMode = twoPlayerMode;
    game.random = new Random(game.seed);

    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('pauseBtn').classList.remove('hidden');

    game.chunks.clear();
    game.chunkAnchors.clear();
    game.coins = [];
    game.enemies = [];
    game.modifiers = [];
    game.droppingHats = [];
    game.particles = [];
    game.floatingTexts = [];
    game.score = 0;
    game.distance = 0;
    game.difficulty = 0;
    game.gameStartTime = Date.now();
    game.gameEndTime = 0;
    game.victoryTriggered = false;
    game.blackHoleSuctionProgress = 0;
    game.stats = {
        coinsCollected: 0,
        enemiesDefeated: 0,
        modifiersCollected: 0,
        lastDistance: 0
    };

    resetContinueFlag();

    const spawnY = game.height - 400;
    game.player = new Player(100, spawnY, 1);

    if (twoPlayerMode) {
        game.player2 = new Player(200, spawnY, 2);
        document.getElementById('p2-hud').style.display = 'grid';
    } else {
        game.player2 = null;
        document.getElementById('p2-hud').style.display = 'none';
    }

    document.getElementById('p1-score').textContent = game.player.score;
    document.getElementById('p1-hat').textContent = game.player.hatCount;
    document.getElementById('p1-hat').style.color = '#b8f236';

    if (twoPlayerMode) {
        document.getElementById('p2-score').textContent = game.player2.score;
        document.getElementById('p2-hat').textContent = game.player2.hatCount;
        document.getElementById('p2-hat').style.color = '#b8f236';
    }

    document.getElementById('distance').textContent = game.distance;
    game.soundManager?.playGameplayMusic();
    game.state = 'playing';
    game.lastTime = performance.now();
}

function createScoreCard(label, cardClass, stats, distancePoints, score) {
    const coinPoints = stats.coinsCollected * 10;
    const enemyPoints = stats.enemiesDefeated * 50;
    const modifierPoints = stats.modifiersCollected * 25;

    return `
        <article class="score-card ${cardClass}">
            <h2>${label}</h2>
            <div class="score-list">
                <div class="score-row"><span>Coins politely borrowed</span><b>${stats.coinsCollected} &times; 10 = ${coinPoints}</b></div>
                <div class="score-row"><span>Enemies inconvenienced</span><b>${stats.enemiesDefeated} &times; 50 = ${enemyPoints}</b></div>
                <div class="score-row"><span>Mystery boxes trusted</span><b>${stats.modifiersCollected} &times; 25 = ${modifierPoints}</b></div>
                <div class="score-row"><span>Metres of poor judgment</span><b>${distancePoints} = ${distancePoints}</b></div>
            </div>
            <div class="score-total"><span>${label} total</span><strong>${score} pts</strong></div>
        </article>
    `;
}

function showEndState({ victory = false, formattedTime = '' } = {}) {
    const menu = document.getElementById('menu');
    const isTwoPlayer = game.twoPlayerMode && game.player2;
    const title = victory ? 'VICTORY!' : 'GAME OVER';
    const kicker = victory ? 'Official escape certificate' : 'Official splat assessment';
    const subtitle = victory
        ? "You've escaped the universe. The universe is taking this personally."
        : 'Gravity has submitted its final report. It was extremely smug.';

    let scoreCards;
    let teamTotal = '';

    if (isTwoPlayer) {
        const p1Distance = Math.floor(game.player.x / 32);
        const p2Distance = Math.floor(game.player2.x / 32);
        scoreCards = `
            ${createScoreCard('P1 · BLUE BEAN', 'p1', game.player.stats, p1Distance, game.player.score)}
            ${createScoreCard('P2 · RED BEAN', 'p2', game.player2.stats, p2Distance, game.player2.score)}
        `;
        teamTotal = `<div class="team-total"><span>Combined chaos</span><strong>${game.player.score + game.player2.score} pts</strong></div>`;
    } else {
        scoreCards = createScoreCard('RUN RECEIPT', 'p1', game.stats, game.distance, game.player.score);
    }

    menu.classList.remove('menu-screen');
    menu.innerHTML = `
        <main class="state-shell${victory ? ' is-victory' : ''}" data-stamp="${victory ? 'SOMEHOW LEGAL' : 'GRAVITY APPROVED'}">
            <p class="state-kicker">${kicker}</p>
            <h1>${title}</h1>
            <p class="state-subtitle">${subtitle}</p>
            ${victory ? `<div class="state-time"><span>Survival time</span><strong>${formattedTime}</strong></div>` : ''}
            <section class="score-grid${isTwoPlayer ? '' : ' is-single'}" aria-label="Score breakdown">${scoreCards}</section>
            ${teamTotal}
            <div class="state-actions">
                <button id="playAgainBtn" class="game-button game-button-primary">REPEAT THE MISTAKE</button>
                <button id="backToMenuBtn" class="text-button">Retreat to menu</button>
            </div>
        </main>
    `;

    menu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('modifierHud')?.classList.add('hidden');
    document.getElementById('pauseBtn').classList.add('hidden');
    setupGameOverButtons();
}

export function showGameOver() {
    game.state = 'gameover';
    game.soundManager?.playGameOver();
    game.soundManager?.stopMusic();
    showEndState();
}

export function showVictory() {
    game.state = 'victory';
    game.gameEndTime = Date.now();
    game.soundManager?.playVictory();
    game.soundManager?.playVictoryMusic();

    const totalSeconds = Math.floor((game.gameEndTime - game.gameStartTime) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    showEndState({ victory: true, formattedTime: `${minutes}:${seconds.toString().padStart(2, '0')}` });
}

export function pauseGame() {
    if (game.state !== 'playing') return;

    game.state = 'paused';
    const menu = document.getElementById('menu');
    menu.classList.remove('menu-screen');
    menu.innerHTML = `
        <main class="state-shell pause-shell" data-stamp="PANIC BREAK">
            <p class="state-kicker">Emergency courage maintenance</p>
            <h1>PAUSED.</h1>
            <p class="state-subtitle">Courage is temporarily buffering.</p>
            <div class="pause-actions">
                <button id="resumeBtn" class="game-button game-button-primary">RESUME THE BAD IDEA</button>
                <button id="restartFromPauseBtn" class="game-button game-button-hot">RESTART THE BAD IDEA</button>
                <button id="quitBtn" class="text-button">ESCAPE TO MENU</button>
            </div>
        </main>
    `;

    menu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('modifierHud')?.classList.add('hidden');
    document.getElementById('pauseBtn').classList.add('hidden');
    setupPauseMenuButtons();
}

export function resumeGame() {
    game.state = 'playing';
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('pauseBtn').classList.remove('hidden');
    game.lastTime = performance.now();
}

export function restartGame() {
    document.getElementById('menu').classList.add('hidden');
    startGame(game.twoPlayerMode);
}

function setupPauseMenuButtons() {
    document.getElementById('resumeBtn')?.addEventListener('click', resumeGame);
    document.getElementById('restartFromPauseBtn')?.addEventListener('click', restartGame);
    document.getElementById('quitBtn')?.addEventListener('click', () => location.reload());
}

function setupGameOverButtons() {
    document.getElementById('playAgainBtn')?.addEventListener('click', restartGame);
    document.getElementById('backToMenuBtn')?.addEventListener('click', () => location.reload());
}

window.showGameOver = showGameOver;
window.showVictory = showVictory;
