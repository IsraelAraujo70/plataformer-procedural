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
}

export function startGame(twoPlayerMode = false) {
    // Gerar seed aleatório
    game.seed = Math.floor(Math.random() * 1000000);
    console.log('Seed:', game.seed);

    // Definir modo de jogo
    game.twoPlayerMode = twoPlayerMode;

    // Inicializar random
    game.random = new Random(game.seed);

    // Esconder menu
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    // Inicializar jogo
    game.chunks.clear();
    game.coins = [];
    game.enemies = [];
    game.modifiers = [];
    game.particles = [];
    game.floatingTexts = [];
    game.score = 0;
    game.lives = 3;
    game.distance = 0;
    game.difficulty = 0;
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
    document.getElementById('p1-lives').textContent = game.player.lives;
    if (twoPlayerMode) {
        document.getElementById('p2-score').textContent = game.player2.score;
        document.getElementById('p2-lives').textContent = game.player2.lives;
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
            <button onclick="location.reload()">Play Again</button>
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
            <button onclick="location.reload()">Play Again</button>
        `;
    }

    menu.classList.remove('hidden');
    document.getElementById('hud').classList.add('hidden');
}

// Expor showGameOver globalmente para ser chamado pelo Player
window.showGameOver = showGameOver;
