// ============================================
// REWARDED ADS SYSTEM (GameDistribution)
// ============================================

import { ENV } from '../env.js';

class RewardedAdsManager {
    constructor() {
        this.gdsdk = null;
        this.isInitialized = false;
        this.isAdReady = false;
        this.lastAdTime = 0;
        this.adCooldown = 30000; // 30 segundos entre ads (em ms)

        // Configuração - Game ID carregado do .env
        // Para alterar: edite o arquivo .env na raiz do projeto
        this.gameId = ENV.GD_GAME_ID;

        console.log('🎮 GameDistribution SDK configured with Game ID:', this.gameId);
    }

    /**
     * Inicializar SDK do GameDistribution
     */
    async init() {
        return new Promise((resolve, reject) => {
            if (this.isInitialized) {
                resolve();
                return;
            }

            // Verificar se o SDK foi carregado
            if (typeof window.GD_OPTIONS === 'undefined' && typeof window.gdsdk === 'undefined') {
                console.warn('⚠️ GameDistribution SDK not loaded (may be blocked by ad blocker)');
                console.warn('ℹ️ Running in fallback mode - ads will be disabled');
                // Resolver mesmo assim para não quebrar o jogo
                this.isInitialized = false; // Marcar como não inicializado
                resolve(); // Mas permitir que o jogo continue
                return;
            }

            try {
                // GameDistribution SDK usa eventos globais
                // Escutar eventos SDK_READY e SDK_ERROR
                window.addEventListener('SDK_READY', () => {
                    this.isInitialized = true;
                    console.log('✅ GameDistribution SDK initialized successfully!');
                    resolve();
                });

                window.addEventListener('SDK_ERROR', (event) => {
                    console.error('❌ SDK Error:', event.detail);
                    // Não rejeitar - continuar em modo fallback
                    this.isInitialized = false;
                    resolve();
                });

                // Timeout de 5 segundos - se não inicializar, continuar sem ads
                setTimeout(() => {
                    if (!this.isInitialized) {
                        console.warn('⏱️ SDK initialization timeout - continuing without ads');
                        resolve();
                    }
                }, 5000);

                // O SDK já foi carregado pelo script tag e deve auto-inicializar
                console.log('⏳ Waiting for GameDistribution SDK to initialize...');

            } catch (error) {
                console.error('Failed to initialize GameDistribution SDK:', error);
                // Não rejeitar - permitir que o jogo continue sem ads
                this.isInitialized = false;
                resolve();
            }
        });
    }

    /**
     * Verificar se pode mostrar um anúncio (cooldown)
     */
    canShowAd() {
        const now = Date.now();
        const timeSinceLastAd = now - this.lastAdTime;
        return timeSinceLastAd >= this.adCooldown;
    }

    /**
     * Mostrar anúncio com recompensa
     * @param {Function} onReward - Callback chamado quando o player completa o anúncio
     * @param {Function} onFailed - Callback chamado quando o anúncio falha ou é fechado
     */
    showRewardedAd(onReward, onFailed) {
        // Fallback: Se SDK não inicializou, avisar o usuário
        if (!this.isInitialized) {
            console.warn('⚠️ Ad SDK not available (may be blocked by ad blocker)');
            console.info('💡 Tip: Disable ad blocker and reload page to enable ads');

            // Mostrar mensagem para o usuário
            const message = 'Ads are currently unavailable.\n\n' +
                          'This may be due to:\n' +
                          '• Ad blocker enabled\n' +
                          '• Network issues\n' +
                          '• SDK not loaded\n\n' +
                          'The game will continue without the revive option.';

            if (onFailed) onFailed(message);
            return;
        }

        if (!this.canShowAd()) {
            const remainingTime = Math.ceil((this.adCooldown - (Date.now() - this.lastAdTime)) / 1000);
            console.warn(`Ad cooldown active. Wait ${remainingTime}s`);
            if (onFailed) onFailed(`Please wait ${remainingTime}s before watching another ad`);
            return;
        }

        console.log('🎬 Showing rewarded ad...');
        this.lastAdTime = Date.now();

        // Chamar showAd do GameDistribution SDK
        if (window.gdsdk && typeof window.gdsdk.showAd === 'function') {
            window.gdsdk.showAd('rewarded').then(() => {
                console.log('✅ Rewarded ad completed successfully!');
                if (onReward) onReward();
            }).catch((error) => {
                console.error('❌ Rewarded ad failed:', error);
                if (onFailed) onFailed('Failed to show ad: ' + error);
            });
        } else {
            console.error('❌ showAd function not available in SDK');
            const message = 'Ad system is not available.\nPlease disable ad blocker and reload the page.';
            if (onFailed) onFailed(message);
        }
    }

    /**
     * Pré-carregar anúncio (recomendado para melhor UX)
     */
    preloadAd() {
        if (!this.isInitialized) {
            console.warn('Cannot preload ad: SDK not initialized');
            return;
        }

        // GameDistribution SDK já faz preload automaticamente
        // Mas podemos usar este método para verificar disponibilidade
        console.log('Preloading rewarded ad...');
        this.isAdReady = true;
    }
}

// Singleton instance
export const rewardedAdsManager = new RewardedAdsManager();
