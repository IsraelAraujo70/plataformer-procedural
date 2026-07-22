import assert from 'node:assert/strict';
import { CONFIG } from '../js/config.js';
import { getPlayerPickupBounds, intersectsAabb, intersectsPlayerPickup } from '../js/utils/Collision.js';

assert.ok(CONFIG.PLAYER_WIDTH >= CONFIG.PLAYER_RENDER_HEIGHT * 0.48, 'Physical hitbox is too narrow for the new sprite');
assert.ok(CONFIG.PLAYER_HEIGHT >= CONFIG.PLAYER_RENDER_HEIGHT * 0.68, 'Physical hitbox is too short for the new sprite');
assert.ok(CONFIG.PLAYER_HEIGHT < CONFIG.PLAYER_RENDER_HEIGHT, 'Physical hitbox should exclude the hat and upper silhouette');
assert.ok(CONFIG.COIN_SIZE >= CONFIG.PLAYER_WIDTH * 0.6, 'Coin is too small relative to the player');

const player = { x: 100, y: 100, width: CONFIG.PLAYER_WIDTH, height: CONFIG.PLAYER_HEIGHT };
const pickupBounds = getPlayerPickupBounds(player);
const handTouchingCoin = {
    x: player.x - CONFIG.COIN_SIZE,
    y: player.y + 12,
    width: CONFIG.COIN_SIZE,
    height: CONFIG.COIN_SIZE
};

assert.equal(intersectsAabb(handTouchingCoin, player), false, 'Test coin should sit outside the physical body');
assert.equal(intersectsPlayerPickup(handTouchingCoin, player), true, 'Visible hand contact should collect the coin');
assert.equal(pickupBounds.height, CONFIG.PLAYER_HEIGHT + CONFIG.PLAYER_PICKUP_PADDING_TOP);

const tinyPlayer = {
    x: 100,
    y: 100,
    width: CONFIG.PLAYER_WIDTH * 0.5,
    height: CONFIG.PLAYER_HEIGHT * 0.5
};
const tinyBounds = getPlayerPickupBounds(tinyPlayer);
assert.equal(tinyBounds.width, pickupBounds.width * 0.5, 'Tiny pickup width should scale with the player');
assert.equal(tinyBounds.height, pickupBounds.height * 0.5, 'Tiny pickup height should scale with the player');

console.log(JSON.stringify({
    passed: true,
    physicalHitbox: [CONFIG.PLAYER_WIDTH, CONFIG.PLAYER_HEIGHT],
    renderedHeight: CONFIG.PLAYER_RENDER_HEIGHT,
    pickupBounds: [pickupBounds.width, pickupBounds.height],
    coinSize: CONFIG.COIN_SIZE
}, null, 2));
