import { game } from './game.js';
import { CONFIG } from './config.js';
import { Random } from './utils/Random.js';
import { Player } from './entities/Player.js';

// ============================================
// MENU E CONTROLES
// ============================================

export function setupMenuHandlers() {
    document.getElementById('start1PBtn').addEventListener('click', () => startGame(false));
    document.getElementById('start2PBtn').addEventListener('click', () => startGame(true));
    document.getElementById('instructionsBtn').addEventListener('click', () => {
        const instructions = document.getElementById('instructions');
        instructions.classList.toggle('hidden');
    });
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
}

export function startGame(twoPlayerMode = false) {
    // Gerar seed aleatório
    game.seed = Math.floor(Math.random() * 1000000);
    console.log('Seed:', game.seed);

    // Definir modo de jogo
    game.twoPlayerMode = twoPlayerMode;

    // Inicializar random
    game.random = new Random(game.seed);

    // Esconder menu e mostrar HUD + botão de pausa
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('pauseBtn').classList.remove('hidden');

    // Inicializar jogo
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

    // Criar jogador(es) - começar no ar e cair sobre a plataforma inicial do chunk 0
    const spawnY = game.height - 400; // Bem acima da plataforma para cair

    game.player = new Player(100, spawnY, 1);

    if (twoPlayerMode) {
        game.player2 = new Player(200, spawnY, 2);
        document.getElementById('p2-hud').style.display = 'block';
        console.log('2 Player Mode activated!');
    } else {
        game.player2 = null;
        document.getElementById('p2-hud').style.display = 'none';
    }

    // Atualizar HUD
    document.getElementById('p1-score').textContent = game.player.score;
    document.getElementById('p1-hat').textContent = game.player.hatCount;
    document.getElementById('p1-hat').style.color = '#4CAF50';
    if (twoPlayerMode) {
        document.getElementById('p2-score').textContent = game.player2.score;
        document.getElementById('p2-hat').textContent = game.player2.hatCount;
        document.getElementById('p2-hat').style.color = '#4CAF50';
    }
    document.getElementById('distance').textContent = game.distance;

    // Iniciar loop
    game.state = 'playing';
    game.lastTime = performance.now();
}

export function showGameOver() {
    game.state = 'gameover';

    const menu = document.getElementById('menu');

    if (game.twoPlayerMode) {
        // Modo 2 jogadores: mostrar pontuação individual e total
        const p1Score = game.player.score;
        const p2Score = game.player2.score;
        const totalScore = p1Score + p2Score;

        // Calcular pontos de cada categoria (estatísticas globais)
        const coinPoints = game.stats.coinsCollected * 10;
        const enemyPoints = game.stats.enemiesDefeated * 50;
        const modifierPoints = game.stats.modifiersCollected * 25;
        const distancePoints = game.distance;

        menu.innerHTML = `
            <h1>GAME OVER</h1>
            <div style="text-align: left; display: inline-block; margin: 20px 0;">
                <p style="font-size: 18px; margin: 10px 0;"><strong>📊 Score Breakdown:</strong></p>
                <p style="font-size: 16px; margin: 8px 0;">💰 Coins: ${game.stats.coinsCollected} × 10 = ${coinPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">👹 Enemies: ${game.stats.enemiesDefeated} × 50 = ${enemyPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">⚡ Modifiers: ${game.stats.modifiersCollected} × 25 = ${modifierPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">📏 Distance: ${game.distance}m = ${distancePoints} pts</p>
                <hr style="margin: 15px 0; border-color: #00ffff;">
                <p style="font-size: 20px; margin: 10px 0; color: #00d9ff;"><strong>🎮 Player 1: ${p1Score} points</strong></p>
                <p style="font-size: 20px; margin: 10px 0; color: #ff6b6b;"><strong>🎮 Player 2: ${p2Score} points</strong></p>
                <hr style="margin: 15px 0; border-color: #00ffff;">
                <p style="font-size: 24px; margin: 10px 0; color: #00ffff;"><strong>🏆 TOTAL: ${totalScore} points</strong></p>
            </div>
            <button id="playAgainBtn">🔄 Play Again</button>
            <button id="backToMenuBtn">🏠 Back to Menu</button>
        `;
    } else {
        // Modo 1 jogador: mostrar pontuação única
        const coinPoints = game.stats.coinsCollected * 10;
        const enemyPoints = game.stats.enemiesDefeated * 50;
        const modifierPoints = game.stats.modifiersCollected * 25;
        const distancePoints = game.distance;

        menu.innerHTML = `
            <h1>GAME OVER</h1>
            <div style="text-align: left; display: inline-block; margin: 20px 0;">
                <p style="font-size: 18px; margin: 10px 0;"><strong>📊 Score Breakdown:</strong></p>
                <p style="font-size: 16px; margin: 8px 0;">💰 Coins: ${game.stats.coinsCollected} × 10 = ${coinPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">👹 Enemies: ${game.stats.enemiesDefeated} × 50 = ${enemyPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">⚡ Modifiers: ${game.stats.modifiersCollected} × 25 = ${modifierPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">📏 Distance: ${game.distance}m = ${distancePoints} pts</p>
                <hr style="margin: 15px 0; border-color: #00ffff;">
                <p style="font-size: 22px; margin: 10px 0; color: #00ffff;"><strong>🏆 TOTAL: ${game.player.score} points</strong></p>
            </div>
            <button id="playAgainBtn">🔄 Play Again</button>
            <button id="backToMenuBtn">🏠 Back to Menu</button>
        `;
    }

    menu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('pauseBtn').classList.add('hidden');

    // Configurar event listeners dos botões
    setupGameOverButtons();
}

// ============================================
// SHOW VICTORY (completou 2000m)
// ============================================
export function showVictory() {
    game.state = 'victory';
    game.gameEndTime = Date.now();

    const menu = document.getElementById('menu');

    // Calcular tempo total de jogo
    const totalTimeMs = game.gameEndTime - game.gameStartTime;
    const totalSeconds = Math.floor(totalTimeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    if (game.twoPlayerMode) {
        // Modo 2 jogadores
        const p1Score = game.player.score;
        const p2Score = game.player2.score;
        const totalScore = p1Score + p2Score;

        const coinPoints = game.stats.coinsCollected * 10;
        const enemyPoints = game.stats.enemiesDefeated * 50;
        const modifierPoints = game.stats.modifiersCollected * 25;
        const distancePoints = game.distance;

        menu.innerHTML = `
            <h1 style="color: #ffd700; text-shadow: 0 0 20px #ffd700;">🏆 VICTORY! 🏆</h1>
            <h2 style="color: #00ffff; margin: 10px 0;">You've escaped the universe!</h2>
            <div style="text-align: left; display: inline-block; margin: 20px 0;">
                <p style="font-size: 24px; margin: 15px 0; color: #ffd700;"><strong>⏱️ Time: ${formattedTime}</strong></p>
                <hr style="margin: 15px 0; border-color: #ffd700;">
                <p style="font-size: 18px; margin: 10px 0;"><strong>📊 Score Breakdown:</strong></p>
                <p style="font-size: 16px; margin: 8px 0;">💰 Coins: ${game.stats.coinsCollected} × 10 = ${coinPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">👹 Enemies: ${game.stats.enemiesDefeated} × 50 = ${enemyPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">⚡ Modifiers: ${game.stats.modifiersCollected} × 25 = ${modifierPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">📏 Distance: ${game.distance}m = ${distancePoints} pts</p>
                <hr style="margin: 15px 0; border-color: #00ffff;">
                <p style="font-size: 20px; margin: 10px 0; color: #00d9ff;"><strong>🎮 Player 1: ${p1Score} points</strong></p>
                <p style="font-size: 20px; margin: 10px 0; color: #ff6b6b;"><strong>🎮 Player 2: ${p2Score} points</strong></p>
                <hr style="margin: 15px 0; border-color: #ffd700;">
                <p style="font-size: 24px; margin: 10px 0; color: #ffd700;"><strong>🏆 TOTAL: ${totalScore} points</strong></p>
            </div>
            <button id="playAgainBtn">🔄 Play Again</button>
            <button id="backToMenuBtn">🏠 Back to Menu</button>
        `;
    } else {
        // Modo 1 jogador
        const coinPoints = game.stats.coinsCollected * 10;
        const enemyPoints = game.stats.enemiesDefeated * 50;
        const modifierPoints = game.stats.modifiersCollected * 25;
        const distancePoints = game.distance;

        menu.innerHTML = `
            <h1 style="color: #ffd700; text-shadow: 0 0 20px #ffd700;">🏆 VICTORY! 🏆</h1>
            <h2 style="color: #00ffff; margin: 10px 0;">You've escaped the universe!</h2>
            <div style="text-align: left; display: inline-block; margin: 20px 0;">
                <p style="font-size: 24px; margin: 15px 0; color: #ffd700;"><strong>⏱️ Time: ${formattedTime}</strong></p>
                <hr style="margin: 15px 0; border-color: #ffd700;">
                <p style="font-size: 18px; margin: 10px 0;"><strong>📊 Score Breakdown:</strong></p>
                <p style="font-size: 16px; margin: 8px 0;">💰 Coins: ${game.stats.coinsCollected} × 10 = ${coinPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">👹 Enemies: ${game.stats.enemiesDefeated} × 50 = ${enemyPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">⚡ Modifiers: ${game.stats.modifiersCollected} × 25 = ${modifierPoints} pts</p>
                <p style="font-size: 16px; margin: 8px 0;">📏 Distance: ${game.distance}m = ${distancePoints} pts</p>
                <hr style="margin: 15px 0; border-color: #ffd700;">
                <p style="font-size: 22px; margin: 10px 0; color: #ffd700;"><strong>🏆 TOTAL: ${game.player.score} points</strong></p>
            </div>
            <button id="playAgainBtn">🔄 Play Again</button>
            <button id="backToMenuBtn">🏠 Back to Menu</button>
        `;
    }

    menu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('pauseBtn').classList.add('hidden');

    // Configurar event listeners dos botões
    setupGameOverButtons(); // Mesmos botões que game over
}

// ============================================
// PAUSE GAME
// ============================================
export function pauseGame() {
    if (game.state !== 'playing') return;

    game.state = 'paused';
    const menu = document.getElementById('menu');

    menu.innerHTML = `
        <h1>⏸️ PAUSED</h1>
        <p style="font-size: 18px; margin: 20px 0; color: #00ffff;">Game is paused</p>
        <button id="resumeBtn">▶️ Resume</button>
        <button id="restartFromPauseBtn">🔄 Restart</button>
        <button id="quitBtn">🏠 Quit to Menu</button>
    `;

    menu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('pauseBtn').classList.add('hidden');

    setupPauseMenuButtons();
}

// ============================================
// RESUME GAME
// ============================================
export function resumeGame() {
    game.state = 'playing';
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    document.getElementById('pauseBtn').classList.remove('hidden');
    game.lastTime = performance.now();
}

// ============================================
// RESTART GAME
// ============================================
export function restartGame() {
    // Esconder menu primeiro
    document.getElementById('menu').classList.add('hidden');

    // Reiniciar no mesmo modo atual
    startGame(game.twoPlayerMode);
}

// ============================================
// SETUP PAUSE MENU BUTTONS
// ============================================
function setupPauseMenuButtons() {
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartFromPauseBtn');
    const quitBtn = document.getElementById('quitBtn');

    if (resumeBtn) {
        resumeBtn.addEventListener('click', resumeGame);
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', restartGame);
    }

    if (quitBtn) {
        quitBtn.addEventListener('click', () => location.reload());
    }
}

// ============================================
// SETUP GAME OVER BUTTONS
// ============================================
function setupGameOverButtons() {
    const playAgainBtn = document.getElementById('playAgainBtn');
    const backToMenuBtn = document.getElementById('backToMenuBtn');

    if (playAgainBtn) {
        playAgainBtn.addEventListener('click', restartGame);
    }

    if (backToMenuBtn) {
        backToMenuBtn.addEventListener('click', () => location.reload());
    }
}

// Expor funções globalmente para serem chamadas pelo Player e main
window.showGameOver = showGameOver;
window.showVictory = showVictory;
