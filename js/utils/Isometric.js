// ============================================
// SISTEMA DE PROJEÇÃO ISOMÉTRICA
// ============================================

/**
 * Sistema de conversão entre coordenadas 2D (mundo) e isométricas (tela)
 *
 * Projeção isométrica padrão:
 * - Ângulo: 30 graus (2:1 ratio)
 * - Eixo X aponta para direita-baixo
 * - Eixo Y aponta para esquerda-baixo
 * - Eixo Z aponta para cima
 */

export const ISO_CONFIG = {
    // Tile isométrico tem proporção 2:1 (largura:altura)
    TILE_WIDTH: 64,  // Largura do tile isométrico na tela
    TILE_HEIGHT: 32, // Altura do tile isométrico na tela

    // Escala de altura (z) para profundidade visual
    Z_SCALE: 0.5,

    // Offset global para centralizar o mundo
    OFFSET_X: 0,
    OFFSET_Y: 200,
};

/**
 * Converte coordenadas do mundo 2D (x, y, z) para coordenadas isométricas de tela
 * @param {number} x - Coordenada X do mundo (horizontal, direita)
 * @param {number} y - Coordenada Y do mundo (vertical, baixo no mundo 2D)
 * @param {number} z - Coordenada Z do mundo (altura/profundidade visual)
 * @returns {{isoX: number, isoY: number}}
 */
export function worldToIso(x, y, z = 0) {
    // Projeção isométrica clássica (30 graus)
    // isoX = (x - y) * cos(30°)
    // isoY = (x + y) * sin(30°) - z

    // Usando proporção 2:1 simplificada:
    const isoX = (x - y) * 0.5 + ISO_CONFIG.OFFSET_X;
    const isoY = (x + y) * 0.25 - z * ISO_CONFIG.Z_SCALE + ISO_CONFIG.OFFSET_Y;

    return { isoX, isoY };
}

/**
 * Converte coordenadas isométricas de tela para coordenadas do mundo 2D
 * @param {number} isoX - Coordenada X isométrica
 * @param {number} isoY - Coordenada Y isométrica
 * @returns {{x: number, y: number}}
 */
export function isoToWorld(isoX, isoY) {
    // Remoção de offset
    const adjX = isoX - ISO_CONFIG.OFFSET_X;
    const adjY = isoY - ISO_CONFIG.OFFSET_Y;

    // Conversão reversa
    const x = adjY + adjX;
    const y = adjY - adjX;

    return { x, y };
}

/**
 * Desenha um tile isométrico (losango/diamante)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} isoX - Posição X isométrica (centro do tile)
 * @param {number} isoY - Posição Y isométrica (centro do tile)
 * @param {string} color - Cor do tile
 */
export function drawIsoTile(ctx, isoX, isoY, color) {
    const hw = ISO_CONFIG.TILE_WIDTH / 2;  // Half width
    const hh = ISO_CONFIG.TILE_HEIGHT / 2; // Half height

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(isoX, isoY - hh);        // Topo
    ctx.lineTo(isoX + hw, isoY);        // Direita
    ctx.lineTo(isoX, isoY + hh);        // Baixo
    ctx.lineTo(isoX - hw, isoY);        // Esquerda
    ctx.closePath();
    ctx.fill();
}

/**
 * Desenha um cubo isométrico (bloco 3D)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Posição X do mundo
 * @param {number} y - Posição Y do mundo
 * @param {number} z - Posição Z do mundo (altura)
 * @param {number} width - Largura do cubo
 * @param {number} height - Altura do cubo
 * @param {number} depth - Profundidade do cubo
 * @param {string} colorTop - Cor da face superior
 * @param {string} colorLeft - Cor da face esquerda
 * @param {string} colorRight - Cor da face direita
 */
export function drawIsoCube(ctx, x, y, z, width, height, depth, colorTop, colorLeft, colorRight) {
    // Converter cantos do cubo para coordenadas isométricas
    const frontBottomLeft = worldToIso(x, y, z);
    const frontBottomRight = worldToIso(x + width, y, z);
    const backBottomLeft = worldToIso(x, y + depth, z);
    const frontTopLeft = worldToIso(x, y, z + height);
    const frontTopRight = worldToIso(x + width, y, z + height);
    const backTopLeft = worldToIso(x, y + depth, z + height);
    const backTopRight = worldToIso(x + width, y + depth, z + height);

    // Face superior (topo)
    ctx.fillStyle = colorTop;
    ctx.beginPath();
    ctx.moveTo(frontTopLeft.isoX, frontTopLeft.isoY);
    ctx.lineTo(frontTopRight.isoX, frontTopRight.isoY);
    ctx.lineTo(backTopRight.isoX, backTopRight.isoY);
    ctx.lineTo(backTopLeft.isoX, backTopLeft.isoY);
    ctx.closePath();
    ctx.fill();

    // Face esquerda
    ctx.fillStyle = colorLeft;
    ctx.beginPath();
    ctx.moveTo(frontBottomLeft.isoX, frontBottomLeft.isoY);
    ctx.lineTo(frontTopLeft.isoX, frontTopLeft.isoY);
    ctx.lineTo(backTopLeft.isoX, backTopLeft.isoY);
    ctx.lineTo(backBottomLeft.isoX, backBottomLeft.isoY);
    ctx.closePath();
    ctx.fill();

    // Face direita
    ctx.fillStyle = colorRight;
    ctx.beginPath();
    ctx.moveTo(frontBottomRight.isoX, frontBottomRight.isoY);
    ctx.lineTo(frontTopRight.isoX, frontTopRight.isoY);
    ctx.lineTo(backTopRight.isoX, backTopRight.isoY);
    ctx.lineTo(frontBottomLeft.isoX, frontBottomLeft.isoY);
    ctx.closePath();
    ctx.fill();
}

/**
 * Desenha uma sombra isométrica projetada no chão com gradiente radial
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Posição X do objeto
 * @param {number} y - Posição Y do objeto
 * @param {number} z - Altura do objeto
 * @param {number} width - Largura da sombra
 * @param {number} depth - Profundidade da sombra
 */
export function drawIsoShadow(ctx, x, y, z, width, depth) {
    // Sombra projetada no chão (z=0)
    const shadowFrontLeft = worldToIso(x, y, 0);
    const shadowFrontRight = worldToIso(x + width, y, 0);
    const shadowBackLeft = worldToIso(x, y + depth, 0);
    const shadowBackRight = worldToIso(x + width, y + depth, 0);

    // Centro da sombra
    const centerX = (shadowFrontLeft.isoX + shadowFrontRight.isoX + shadowBackLeft.isoX + shadowBackRight.isoX) / 4;
    const centerY = (shadowFrontLeft.isoY + shadowFrontRight.isoY + shadowBackLeft.isoY + shadowBackRight.isoY) / 4;

    // Opacidade baseada na altura (quanto mais alto, mais suave a sombra)
    const baseOpacity = Math.min(0.5, 0.5 - (z / 200));

    // Raio do gradiente baseado no tamanho do objeto
    const radius = Math.max(width, depth) * 0.6;

    // Criar gradiente radial
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, `rgba(0, 0, 0, ${baseOpacity})`);
    gradient.addColorStop(0.5, `rgba(0, 0, 0, ${baseOpacity * 0.6})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(shadowFrontLeft.isoX, shadowFrontLeft.isoY);
    ctx.lineTo(shadowFrontRight.isoX, shadowFrontRight.isoY);
    ctx.lineTo(shadowBackRight.isoX, shadowBackRight.isoY);
    ctx.lineTo(shadowBackLeft.isoX, shadowBackLeft.isoY);
    ctx.closePath();
    ctx.fill();
}

/**
 * Calcula a ordem de renderização (z-order) para sorting
 * Objetos mais "atrás" e mais "baixos" devem ser desenhados primeiro
 * @param {number} x - Posição X do mundo
 * @param {number} y - Posição Y do mundo
 * @param {number} z - Posição Z do mundo
 * @returns {number} - Valor de ordenação (maior = desenhar depois)
 */
export function calculateZOrder(x, y, z) {
    // Combinação de x + y determina profundidade isométrica
    // z negativo prioriza objetos no ar
    return (x + y) - z;
}

/**
 * Rotaciona um ponto em 3D ao redor do eixo Y (vertical)
 * @param {number} x - Posição X relativa ao centro
 * @param {number} z - Posição Z relativa ao centro
 * @param {number} angle - Ângulo de rotação em radianos
 * @returns {{x: number, z: number}} - Coordenadas rotacionadas
 */
export function rotateY(x, z, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: x * cos - z * sin,
        z: x * sin + z * cos
    };
}

/**
 * Desenha uma elipse rotacionada em 3D (útil para moedas, discos, etc)
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x - Posição X do mundo
 * @param {number} y - Posição Y do mundo
 * @param {number} z - Posição Z do mundo
 * @param {number} radius - Raio do objeto
 * @param {number} rotation - Ângulo de rotação em radianos
 * @param {string} color - Cor do objeto
 */
export function drawRotatedIsoCircle(ctx, x, y, z, radius, rotation, color) {
    const isoPos = worldToIso(x, y, z);

    // Calcular largura e altura da elipse baseado na rotação
    // Quando rotation = 0, vemos o círculo de frente (mais largo)
    // Quando rotation = π/2, vemos de lado (mais estreito)
    const width = radius * Math.abs(Math.cos(rotation));
    const height = radius * 0.5; // Sempre achatado verticalmente em isométrico

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(isoPos.isoX, isoPos.isoY, width, height, 0, 0, Math.PI * 2);
    ctx.fill();

    // Adicionar borda para dar profundidade
    const darkColor = adjustBrightness(color, -40);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Ajusta o brilho de uma cor hexadecimal
 * @param {string} color - Cor no formato #RRGGBB
 * @param {number} amount - Quantidade de ajuste (-255 a 255)
 * @returns {string} - Cor ajustada
 */
function adjustBrightness(color, amount) {
    const hex = color.replace('#', '');
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
