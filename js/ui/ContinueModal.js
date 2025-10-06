import { game } from '../game.js';
import { rewardedAdsManager } from '../ads/RewardedAds.js';
import { CONFIG } from '../config.js';

// ============================================
// CONTINUE MODAL - UI para Rewarded Ads
// ============================================

let currentPlayer = null; // Referência ao jogador que morreu
let hasUsedContinue = false; // Prevenir múltiplos continues na mesma sessão

/**
 * Mostrar modal de continuação após morte
 * @param {Player} player - Jogador que morreu
 */
export function showContinueModal(player) {
    // LOG CRÍTICO: Rastrear quem está chamando isso
    console.log('🔍 showContinueModal called!', {
        player: player,
        gameState: game.state,
        stackTrace: new Error().stack
    });

    // VALIDAÇÃO CRÍTICA: Verificar se player é válido
    if (!player) {
        console.error('❌ showContinueModal called with null/undefined player! BLOCKED');
        return;
    }

    // Verificar se o jogo foi iniciado (evitar modal aparecer no menu)
    if (game.state !== 'playing' && game.state !== 'paused') {
        console.log('⚠️ Game not started yet (state: ' + game.state + '), skipping continue modal');
        return; // NÃO chamar proceedToGameOver se não há jogo ativo
    }

    // Verificar se já usou continue nesta sessão
    if (hasUsedContinue) {
        console.log('Continue already used this session, game over');
        proceedToGameOver(player);
        return;
    }

    currentPlayer = player;

    // Pausar o jogo
    const previousState = game.state;
    game.state = 'paused';

    // Mostrar modal
    const modal = document.getElementById('continueModal');
    modal.classList.remove('hidden');

    console.log('✅ Continue modal shown for player', player.playerNumber);
}

/**
 * Fechar modal e prosseguir para game over
 */
function hideContinueModal() {
    const modal = document.getElementById('continueModal');
    modal.classList.add('hidden');

    // Esconder mensagem de loading se estiver visível
    const loadingMsg = document.querySelector('.ad-loading');
    if (loadingMsg) loadingMsg.classList.add('hidden');
}

/**
 * Prosseguir para game over (sem ressurreição)
 */
function proceedToGameOver(player) {
    hideContinueModal();

    // Validar player antes de modificar
    if (!player) {
        console.error('❌ proceedToGameOver called with null player!');
        game.state = 'gameover';
        if (window.showGameOver) {
            window.showGameOver();
        }
        return;
    }

    // Marcar para game over
    player.shouldTriggerGameOver = true;
    player.completelyDead = true;

    // Disparar game over
    game.state = 'gameover';
    if (window.showGameOver) {
        window.showGameOver();
    }
}

/**
 * Ressuscitar o jogador após assistir o anúncio
 */
function revivePlayer(player) {
    console.log('Reviving player', player.playerNumber);

    // Restaurar estado do jogador
    player.dying = false;
    player.deathAnimTime = 0;
    player.completelyDead = false;
    player.shouldTriggerGameOver = false;

    // Dar 1 chapéu de vida
    player.hatCount = 1;

    // Teleportar para última posição segura
    player.x = player.lastSafeX;
    player.y = player.lastSafeY;
    player.vx = 0;
    player.vy = 0;

    // Invulnerabilidade temporária (3 segundos)
    player.invulnerable = true;
    player.invulnerableTime = 180; // 3 segundos a 60fps

    // Efeito visual de ressurreição
    if (window.createParticles) {
        window.createParticles(player.x + player.width / 2, player.y + player.height / 2, '#4CAF50', 50);
    }
    if (window.createFloatingText) {
        window.createFloatingText('REVIVED!', player.x + player.width / 2, player.y, '#4CAF50');
    }

    // Marcar que continue foi usado
    hasUsedContinue = true;

    // Retomar o jogo
    game.state = 'playing';
    hideContinueModal();

    console.log('Player revived successfully!');
}

/**
 * Configurar event listeners do modal
 */
export function setupContinueModal() {
    const watchAdBtn = document.getElementById('watchAdBtn');
    const giveUpBtn = document.getElementById('giveUpBtn');
    const loadingMsg = document.querySelector('.ad-loading');

    // Botão "Watch Ad to Revive"
    watchAdBtn.addEventListener('click', () => {
        console.log('Player clicked "Watch Ad"');

        // Validar se há player
        if (!currentPlayer) {
            console.error('❌ No player reference when trying to watch ad!');
            alert('Error: No player found. Please restart the game.');
            hideContinueModal();
            return;
        }

        // Mostrar mensagem de loading
        loadingMsg.classList.remove('hidden');
        watchAdBtn.disabled = true;

        // Tentar mostrar anúncio
        rewardedAdsManager.showRewardedAd(
            // onReward - anúncio completado com sucesso
            () => {
                console.log('Ad completed successfully!');
                if (currentPlayer) {
                    revivePlayer(currentPlayer);
                } else {
                    console.error('❌ Player reference lost during ad!');
                    hideContinueModal();
                }
            },
            // onFailed - anúncio falhou ou foi fechado
            (error) => {
                console.error('Ad failed:', error);

                // Esconder loading
                loadingMsg.classList.add('hidden');
                watchAdBtn.disabled = false;

                // Mostrar mensagem de erro
                alert('Failed to load ad: ' + error + '\nPlease try again or give up.');
            }
        );
    });

    // Botão "Give Up"
    giveUpBtn.addEventListener('click', () => {
        console.log('Player clicked "Give Up"');

        // Validar se há player
        if (!currentPlayer) {
            console.error('❌ No player reference when giving up!');
            hideContinueModal();
            // Forçar game over mesmo sem player
            game.state = 'gameover';
            if (window.showGameOver) {
                window.showGameOver();
            }
            return;
        }

        proceedToGameOver(currentPlayer);
    });
}

/**
 * Resetar flag de continue usado (chamar quando iniciar novo jogo)
 */
export function resetContinueFlag() {
    hasUsedContinue = false;
    console.log('Continue flag reset - player can use continue again');
}
