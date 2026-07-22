const PLAYER_SPRITE_SOURCES = {
    1: './assets/characters/player-1-animation.png',
    2: './assets/characters/player-2-animation.png'
};

const PLAYER_RUN_SPRITE_SOURCES = {
    1: './assets/characters/player-1-run-cycle.png',
    2: './assets/characters/player-2-run-cycle.png'
};

const PLAYER_FRAME_BOUNDS = {
    1: [
        [75, 243, 273, 322],
        [410, 251, 267, 313],
        [760, 248, 302, 318],
        [1136, 256, 287, 310],
        [1466, 204, 318, 323],
        [1815, 281, 285, 289]
    ],
    2: [
        [74, 199, 277, 329],
        [411, 205, 269, 321],
        [762, 204, 308, 324],
        [1142, 210, 288, 316],
        [1474, 161, 324, 326],
        [1824, 234, 290, 296]
    ]
};

const PLAYER_RUN_FRAME_BOUNDS = {
    1: [
        [35, 237, 252, 252],
        [313, 237, 252, 252],
        [575, 219, 252, 252],
        [848, 204, 252, 252],
        [1117, 215, 252, 252],
        [1360, 239, 252, 252],
        [1621, 240, 252, 252],
        [1906, 240, 252, 252]
    ],
    2: [
        [39, 218, 252, 252],
        [315, 213, 252, 252],
        [595, 211, 252, 252],
        [860, 197, 252, 252],
        [1131, 218, 252, 252],
        [1395, 223, 252, 252],
        [1635, 216, 252, 252],
        [1900, 214, 252, 252]
    ]
};

const spriteImages = new Map();
const runSpriteImages = new Map();

export function getCharacterSprite(playerNumber) {
    if (!spriteImages.has(playerNumber)) {
        const image = new Image();
        image.decoding = 'async';
        image.src = PLAYER_SPRITE_SOURCES[playerNumber] || PLAYER_SPRITE_SOURCES[1];
        spriteImages.set(playerNumber, image);
    }

    return spriteImages.get(playerNumber);
}

export function getCharacterFrameBounds(playerNumber, frameIndex) {
    const frames = PLAYER_FRAME_BOUNDS[playerNumber] || PLAYER_FRAME_BOUNDS[1];
    return frames[Math.max(0, Math.min(frameIndex, frames.length - 1))];
}

export function getCharacterRunSprite(playerNumber) {
    if (!runSpriteImages.has(playerNumber)) {
        const image = new Image();
        image.decoding = 'async';
        image.src = PLAYER_RUN_SPRITE_SOURCES[playerNumber] || PLAYER_RUN_SPRITE_SOURCES[1];
        runSpriteImages.set(playerNumber, image);
    }

    return runSpriteImages.get(playerNumber);
}

export function getCharacterRunFrameBounds(playerNumber, frameIndex) {
    const frames = PLAYER_RUN_FRAME_BOUNDS[playerNumber] || PLAYER_RUN_FRAME_BOUNDS[1];
    return frames[Math.max(0, Math.min(frameIndex, frames.length - 1))];
}
