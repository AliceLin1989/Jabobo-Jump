
import React, { useRef, useEffect, useCallback } from 'react';
import { Entity, GameState, LevelData, Vector, CharacterType } from '../types';
import { TILE_SIZE, GRAVITY, FRICTION, COLORS, CHARACTERS } from '../constants';
import { soundManager } from '../soundManager';

interface GameCanvasProps {
    level: LevelData;
    charType: CharacterType;
    onComplete: () => void;
    onGameOver: () => void;
    onScoreChange: (score: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ level, charType, onComplete, onGameOver, onScoreChange }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestRef = useRef<number>();
    const stats = CHARACTERS[charType];
    
    const player = useRef<Entity>({
        id: 'player',
        type: 'PLAYER',
        pos: { x: level.startPos.x * TILE_SIZE, y: level.startPos.y * TILE_SIZE },
        vel: { x: 0, y: 0 },
        width: TILE_SIZE * 0.8,
        height: TILE_SIZE * 1.2,
        color: stats.colorBody,
        isGrounded: false,
        facing: 'RIGHT',
        isBig: false
    });

    const keys = useRef<{ [key: string]: boolean }>({});
    const camera = useRef<Vector>({ x: 0, y: 0 });
    const coins = useRef<Vector[]>(level.coins.map(c => ({...c})));
    const powerups = useRef<Vector[]>(level.powerups?.map(p => ({...p})) || []);
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

    const checkCollision = (a: any, b: any) => {
        const aX = a.pos ? a.pos.x : a.x;
        const aY = a.pos ? a.pos.y : a.y;
        const bX = b.pos ? b.pos.x : b.x;
        const bY = b.pos ? b.pos.y : b.y;
        return aX < bX + b.width && aX + a.width > bX && aY < bY + b.height && aY + a.height > bY;
    };

    const update = useCallback(() => {
        const p = player.current;

        // Character Physics
        if (keys.current['ArrowLeft'] || keys.current['a']) {
            p.vel.x = -stats.moveSpeed;
            p.facing = 'LEFT';
        } else if (keys.current['ArrowRight'] || keys.current['d']) {
            p.vel.x = stats.moveSpeed;
            p.facing = 'RIGHT';
        } else {
            p.vel.x *= FRICTION;
        }

        if ((keys.current['ArrowUp'] || keys.current['w'] || keys.current[' ']) && p.isGrounded) {
            p.vel.y = stats.jumpForce;
            p.isGrounded = false;
            soundManager.playJump();
        }

        p.vel.y += GRAVITY;
        p.pos.x += p.vel.x;
        p.pos.y += p.vel.y;

        if (p.pos.x < 0) p.pos.x = 0;
        if (p.pos.y > level.height * TILE_SIZE) {
            onGameOver();
            return;
        }

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

                if (Math.abs(dx) > Math.abs(dy)) {
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

        // Enemies
        enemies.current = enemies.current.filter(enemy => {
            enemy.pos.x += enemy.vel.x;
            const hasWall = level.blocks.some(b => checkCollision(enemy, { x: b.x * TILE_SIZE, y: b.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE }));
            if (hasWall) enemy.vel.x *= -1;

            if (checkCollision(p, enemy)) {
                if (p.vel.y > 0 && p.pos.y + p.height < enemy.pos.y + enemy.height / 2) {
                    p.vel.y = stats.jumpForce / 1.5;
                    onScoreChange(100);
                    return false;
                } else {
                    if (p.isBig) {
                        p.isBig = false;
                        p.width = TILE_SIZE * 0.8;
                        p.height = TILE_SIZE * 1.2;
                        p.pos.y -= 10; // Bump up to avoid sticking
                        onScoreChange(-1); // Trigger shrink sound
                        return false; // Enemy vanishes on hit if player big? Or just shrink?
                    } else {
                        onGameOver();
                    }
                }
            }
            return true;
        });

        // Coins
        coins.current = coins.current.filter(coin => {
            if (checkCollision(p, { x: coin.x * TILE_SIZE, y: coin.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE })) {
                onScoreChange(50);
                return false;
            }
            return true;
        });

        // Powerups (Growth)
        powerups.current = powerups.current.filter(pu => {
            if (checkCollision(p, { x: pu.x * TILE_SIZE, y: pu.y * TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE })) {
                if (!p.isBig) {
                    p.isBig = true;
                    p.width = TILE_SIZE * 1.2;
                    p.height = TILE_SIZE * 1.8;
                    p.pos.y -= TILE_SIZE * 0.6; // Push up so they don't fall through floor
                    onScoreChange(200);
                } else {
                    onScoreChange(500); // Extra points if already big
                }
                return false;
            }
            return true;
        });

        if (checkCollision(p, { x: level.goal.x * TILE_SIZE, y: level.goal.y * TILE_SIZE - TILE_SIZE, width: TILE_SIZE, height: TILE_SIZE * 2 })) {
            onComplete();
            return;
        }

        const canvas = canvasRef.current;
        if (canvas) {
            camera.current.x = p.pos.x - canvas.width / 2;
            camera.current.x = Math.max(0, Math.min(camera.current.x, level.width * TILE_SIZE - canvas.width));
        }

        draw();
        requestRef.current = requestAnimationFrame(update);
    }, [level, onComplete, onGameOver, onScoreChange, stats]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        ctx.fillStyle = level.theme === 'GRASS' ? '#87CEEB' : '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(-camera.current.x, -camera.current.y);

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

        // Draw Power-up Disks
        ctx.fillStyle = COLORS.POWERUP;
        powerups.current.forEach(pu => {
            ctx.fillRect(pu.x * TILE_SIZE + 4, pu.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(pu.x * TILE_SIZE + 8, pu.y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        });

        enemies.current.forEach(e => {
            ctx.fillStyle = e.color;
            ctx.fillRect(e.pos.x, e.pos.y, e.width, e.height);
        });

        const p = player.current;
        ctx.fillStyle = stats.colorBody;
        ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
        ctx.fillStyle = stats.colorShirt;
        ctx.fillRect(p.pos.x, p.pos.y + p.height * 0.5, p.width, p.height * 0.5);
        ctx.fillStyle = COLORS.PLAYER_HEADPHONES;
        ctx.fillRect(p.pos.x - 2, p.pos.y + 4, 4, 12);
        ctx.fillRect(p.pos.x + p.width - 2, p.pos.y + 4, 4, 12);
        ctx.fillRect(p.pos.x - 2, p.pos.y, p.width + 4, 4);

        ctx.restore();
    }, [level.theme, level.blocks, level.goal.x, level.goal.y, stats]);

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
        <canvas ref={canvasRef} width={800} height={480} className="border-4 border-white shadow-2xl bg-sky-200" />
    );
};

export default GameCanvas;
