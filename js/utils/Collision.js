import { CONFIG } from '../config.js?v=player-scale-1';

export function intersectsAabb(first, second) {
    return first.x < second.x + second.width &&
        first.x + first.width > second.x &&
        first.y < second.y + second.height &&
        first.y + first.height > second.y;
}

export function getPlayerPickupBounds(player) {
    const scale = player.height / CONFIG.PLAYER_HEIGHT;
    const paddingX = CONFIG.PLAYER_PICKUP_PADDING_X * scale;
    const paddingTop = CONFIG.PLAYER_PICKUP_PADDING_TOP * scale;

    return {
        x: player.x - paddingX,
        y: player.y - paddingTop,
        width: player.width + paddingX * 2,
        height: player.height + paddingTop
    };
}

export function intersectsPlayerPickup(item, player) {
    return intersectsAabb(item, getPlayerPickupBounds(player));
}
