
import React, { useRef, useEffect, useCallback } from 'react';
import { Entity, GameState, LevelData, Vector } from '../types';
import { TILE_SIZE, GRAVITY, JUMP_FORCE, MOVE_SPEED, FRICTION, COLORS } from '../constants';
import { soundManager } from '../soundManager';

interface GameCanvasProps {
    level: LevelData;
    onComplete: () => void;
    onGameOver: () => void;
    onScoreChange: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ level, onComplete, onGameOver, onScoreChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    
    // Game State Refs
    const player = useRef<Entity>({
        id: 'player',
        type: 'PLAYER',
        pos: { x: level.startPos.x * TILE_SIZE, y: level.startPos.y * TILE_SIZE },
        vel: { x: 0, y: 0 },
        width: TILE_SIZE * 0.8,
        height: TILE_SIZE * 1.2,
        color: COLORS.PLAYER_BODY,
        isGrounded: false,
        facing: 'RIGHT'
    });

    const keys = useRef<{ [key: string]: boolean }>({});
    const camera = useRef<Vector>({ x: 0, y: 0 });
    const coins = useRef<Vector[]>(level.coins.map(c => ({...c})));
    const enemies = useRef<Entity[]>(level.enemies.map((e, idx) => ({
        id: `enemy-${idx}`,
        type: 'ENEMY',
        pos: { x: e.x * TILE_SIZE, y: e.y * TILE_SIZE },
        vel: { x: -1, y: 0 },
        width: TILE_SIZE * 0.8,
        height: TILE_SIZE * 0.8,
        color: COLORS.ENEMY,
        facing: 'LEFT'
    })));

    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };

    const checkCollision = (a: Entity | Vector & {width: number, height: number}, b: Entity | Vector & {width: number, height: number}) => {
        const aX = 'pos' in a ? a.pos.x : a.x;
        const aY = 'pos' in a ? a.pos.y : a.y;
        const bX = 'pos' in b ? b.pos.x : b.x;
        const bY = 'pos' in b ? b.pos.y : b.y;

        return aX < bX + b.width &&
               aX + a.width > bX &&
               aY < bY + b.height &&
               aY + a.height > bY;
    };

    const update = useCallback(() => {
        const p = player.current;

        // Player Controls
        if (keys.current['ArrowLeft'] || keys.current['a']) {
            p.vel.x = -MOVE_SPEED;
            p.facing = 'LEFT';
        } else if (keys.current['ArrowRight'] || keys.current['d']) {
            p.vel.x = MOVE_SPEED;
            p.facing = 'RIGHT';
        } else {
            p.vel.x *= FRICTION;
        }

        if ((keys.current['ArrowUp'] || keys.current['w'] || keys.current[' ']) && p.isGrounded) {
            p.vel.y = JUMP_FORCE;
            p.isGrounded = false;
            soundManager.playJump();
        }

        // Apply Gravity
        p.vel.y += GRAVITY;
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

        // Boundary checks
        if (p.pos.x < 0) p.pos.x = 0;
        if (p.pos.y > level.height * TILE_SIZE) {
            onGameOver();
            return;
        }

        // Tile Collisions
        const wasGrounded = p.isGrounded;
        p.isGrounded = false;
        level.blocks.forEach(block => {
            const b = { x: block.x * TILE_SIZE, y: block.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
            if (checkCollision(p, b)) {
                const pMidX = p.pos.x + p.width/2;
                const pMidY = p.pos.y + p.height/2;
                const bMidX = b.x + b.width/2;
                const bMidY = b.y + b.height/2;

                const dx = pMidX - bMidX;
                const dy = pMidY - bMidY;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                if (absDx > absDy) {
                    if (dx > 0) p.pos.x = b.x + b.width;
                    else p.pos.x = b.x - p.width;
                    p.vel.x = 0;
                } else {
                    if (dy > 0) {
                        p.pos.y = b.y + b.height;
                        p.vel.y = 0.1;
                    } else {
                        p.pos.y = b.y - p.height;
                        p.vel.y = 0;
                        p.isGrounded = true;
                    }
                }
            }
        });

        // Enemy Update & Collision
        enemies.current = enemies.current.filter(enemy => {
            if (enemy.dead) return false;
            enemy.pos.x += enemy.vel.x;
            const hasWall = level.blocks.some(b => 
                checkCollision(enemy, { x: b.x * TILE_SIZE, y: b.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE })
            );
            if (hasWall) enemy.vel.x *= -1;

            if (checkCollision(p, enemy)) {
                if (p.vel.y > 0 && p.pos.y + p.height < enemy.pos.y + enemy.height / 2) {
                    p.vel.y = JUMP_FORCE / 1.5;
                    onScoreChange(100);
                    return false;
                } else {
                    onGameOver();
                }
            }
            return true;
        });

        // Coin Collision
        coins.current = coins.current.filter(coin => {
            const cRect = { x: coin.x * TILE_SIZE, y: coin.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE };
            if (checkCollision(p, cRect)) {
                onScoreChange(50);
                return false;
            }
            return true;
        });

        // Goal Collision
        const goalRect = { x: level.goal.x * TILE_SIZE, y: level.goal.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 2 };
        if (checkCollision(p, goalRect)) {
            onComplete();
            return;
        }

        // Camera Logic
        const canvas = canvasRef.current;
        if (canvas) {
            camera.current.x = p.pos.x - canvas.width / 2;
            if (camera.current.x < 0) camera.current.x = 0;
            const maxCam = level.width * TILE_SIZE - canvas.width;
            if (camera.current.x > maxCam) camera.current.x = maxCam;
        }

        draw();
        requestRef.current = requestAnimationFrame(update);
    }, [level, onComplete, onGameOver, onScoreChange]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.fillStyle = level.theme === 'GRASS' ? '#87CEEB' : (level.theme === 'CAVE' ? '#111' : '#001a33');
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-camera.current.x, -camera.current.y);

        if (level.theme === 'GRASS') {
             ctx.fillStyle = 'rgba(255,255,255,0.3)';
             ctx.fillRect(500, 100, 100, 40);
             ctx.fillRect(1200, 150, 150, 60);
        }

        level.blocks.forEach(b => {
            ctx.fillStyle = level.theme === 'GRASS' ? (b.y === 14 ? COLORS.GRASS_DIRT : COLORS.GRASS_TOP) : COLORS.CAVE_WALL;
            ctx.fillRect(b.x * TILE_SIZE, b.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.strokeRect(b.x * TILE_SIZE, b.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });

        ctx.fillStyle = COLORS.GOAL;
        ctx.fillRect(level.goal.x * TILE_SIZE, level.goal.y * TILE_SIZE - TILE_SIZE, TILE_SIZE, TILE_SIZE * 2);

        ctx.fillStyle = COLORS.COIN;
        coins.current.forEach(c => {
            ctx.beginPath();
            ctx.arc(c.x * TILE_SIZE + TILE_SIZE/2, c.y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/3, 0, Math.PI * 2);
            ctx.fill();
        });

        enemies.current.forEach(e => {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.pos.x, e.pos.y, e.width, e.height);
            ctx.fillStyle = '#fff';
            ctx.fillRect(e.pos.x + 2, e.pos.y + 4, 4, 4);
            ctx.fillRect(e.pos.x + e.width - 6, e.pos.y + 4, 4, 4);
        });

        const p = player.current;
        ctx.fillStyle = COLORS.PLAYER_BODY;
        ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
        ctx.fillStyle = COLORS.PLAYER_SHIRT;
        ctx.fillRect(p.pos.x, p.pos.y + p.height * 0.5, p.width, p.height * 0.5);
        ctx.fillStyle = COLORS.PLAYER_HEADPHONES;
        ctx.fillRect(p.pos.x - 2, p.pos.y + 4, 4, 12);
        ctx.fillRect(p.pos.x + p.width - 2, p.pos.y + 4, 4, 12);
        ctx.fillRect(p.pos.x - 2, p.pos.y, p.width + 4, 4);
        ctx.fillStyle = '#000';
        const eyeX = p.facing === 'RIGHT' ? p.pos.x + p.width * 0.6 : p.pos.x + p.width * 0.2;
        ctx.fillRect(eyeX, p.pos.y + 10, 4, 4);
        ctx.fillRect(eyeX + 6, p.pos.y + 10, 4, 4);
        ctx.fillRect(eyeX + 2, p.pos.y + 18, 6, 2);

        ctx.restore();
    }, [level.theme, level.blocks, level.goal.x, level.goal.y]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        requestRef.current = requestAnimationFrame(update);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [update]);

    return (
        <canvas 
            ref={canvasRef} 
            width={800} 
            height={480} 
            className="border-4 border-white shadow-2xl bg-sky-200"
        />
    );
};

export default GameCanvas;
