
export const TILE_SIZE = 32;
export const GRAVITY = 0.5;
export const FRICTION = 0.8;

export const CHARACTERS = {
    BEAT: {
        name: 'Beat',
        moveSpeed: 5,
        jumpForce: -12,
        colorBody: '#FFFFFF',
        colorShirt: '#FFE000',
        desc: 'Balanced & Steady'
    },
    BASS: {
        name: 'Bass',
        moveSpeed: 7,
        jumpForce: -10,
        colorBody: '#444444',
        colorShirt: '#FF3B30',
        desc: 'Fast but Heavy'
    },
    TREBLE: {
        name: 'Treble',
        moveSpeed: 4,
        jumpForce: -15,
        colorBody: '#E0F7FA',
        colorShirt: '#00BCD4',
        desc: 'High Jumper'
    }
};

export const COLORS = {
    PLAYER_BODY: '#FFFFFF',
    PLAYER_SHIRT: '#FFE000',
    PLAYER_HEADPHONES: '#222222',
    GRASS_TOP: '#4CAF50',
    GRASS_DIRT: '#8B4513',
    CAVE_WALL: '#444444',
    CAVE_FLOOR: '#222222',
    SKY_CLOUD: '#FFFFFF',
    COIN: '#FFD700',
    POWERUP: '#FF00FF', // Special Magenta for Powerups
    ENEMY: '#FF3B30',
    GOAL: '#5856D6'
};
