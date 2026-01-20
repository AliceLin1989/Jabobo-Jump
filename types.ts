
export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    LEVEL_COMPLETE = 'LEVEL_COMPLETE',
    GAME_OVER = 'GAME_OVER',
    LOADING = 'LOADING'
}

export type EntityType = 'PLAYER' | 'ENEMY' | 'COIN' | 'GOAL' | 'BLOCK' | 'POWERUP';

export interface Vector {
    x: number;
    y: number;
}

export interface Entity {
    id: string;
    type: EntityType;
    pos: Vector;
    vel: Vector;
    width: number;
    height: number;
    color: string;
    isGrounded?: boolean;
    facing?: 'LEFT' | 'RIGHT';
    health?: number;
    dead?: boolean;
}

export interface LevelData {
    id: number;
    name: string;
    theme: 'GRASS' | 'CAVE' | 'SKY';
    width: number;
    height: number;
    blocks: Vector[];
    enemies: Vector[];
    coins: Vector[];
    goal: Vector;
    startPos: Vector;
}

export interface GameStatus {
    score: number;
    lives: number;
    currentLevel: number;
    state: GameState;
}
