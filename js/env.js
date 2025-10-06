// ============================================
// ENVIRONMENT CONFIGURATION
// ============================================

/**
 * Configuração de variáveis de ambiente
 * Para desenvolvimento local, as variáveis são definidas manualmente aqui.
 * Para produção com bundler (Vite, Webpack), use import.meta.env ou process.env
 */

export const ENV = {
    // GameDistribution Game ID
    // ID de teste padrão (substitua pelo seu em produção)
    GD_GAME_ID: import.meta?.env?.VITE_GD_GAME_ID || '4f3d7d38d24b740c95da2b03dc122e2e',

    // Modo de desenvolvimento
    IS_DEV: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
};

// Log de configuração (apenas em dev)
if (ENV.IS_DEV) {
    console.log('🔧 Environment Configuration:', {
        gameId: ENV.GD_GAME_ID,
        isDev: ENV.IS_DEV,
        hostname: window.location.hostname
    });
}
