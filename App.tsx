
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameStatus } from './types';
import GameCanvas from './components/GameCanvas';
import { getLevelNarration } from './geminiService';
import { LEVELS } from './levels';
import { soundManager } from './soundManager';

const App: React.FC = () => {
    const [status, setStatus] = useState<GameStatus>({
        score: 0,
        lives: 3,
        currentLevel: 0,
        state: GameState.MENU
    });
    const [tip, setTip] = useState<string>("Ready to drop the beat?");
    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        const muted = soundManager.toggleMute();
        setIsMuted(muted);
    };

    const startGame = async () => {
        setStatus(prev => ({ ...prev, state: GameState.LOADING }));
        const currentLevelData = LEVELS[status.currentLevel];
        const narration = await getLevelNarration(currentLevelData.name, currentLevelData.theme);
        setTip(narration);
        
        // Short delay for the "loading" feel and to show the tip
        setTimeout(() => {
            setStatus(prev => ({ ...prev, state: GameState.PLAYING }));
            soundManager.playLevelStart();
            soundManager.startBGM();
        }, 2000);
    };

    const handleLevelComplete = useCallback(() => {
        soundManager.stopBGM();
        if (status.currentLevel + 1 < LEVELS.length) {
            setStatus(prev => ({
                ...prev,
                currentLevel: prev.currentLevel + 1,
                state: GameState.LEVEL_COMPLETE
            }));
        } else {
            setStatus(prev => ({ ...prev, state: GameState.MENU, currentLevel: 0 }));
            alert("Game Completed! You're a Legend!");
        }
    }, [status.currentLevel]);

    const handleGameOver = useCallback(() => {
        soundManager.stopBGM();
        soundManager.playGameOver();
        setStatus(prev => ({ ...prev, state: GameState.GAME_OVER }));
    }, []);

    const resetGame = () => {
        setStatus({
            score: 0,
            lives: 3,
            currentLevel: 0,
            state: GameState.MENU
        });
    };

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center">
            {/* Global Controls */}
            <button 
                onClick={toggleMute}
                className="absolute top-4 right-4 z-50 bg-white/10 hover:bg-white/20 p-2 border border-white/30 text-white rounded"
            >
                {isMuted ? '🔈 (Muted)' : '🔊 (Sound On)'}
            </button>

            {/* Header / HUD */}
            {status.state === GameState.PLAYING && (
                <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 pointer-events-none">
                    <div className="bg-black/50 p-4 border-2 border-white text-white">
                        <p className="text-sm">BEAT: {status.score}</p>
                        <p className="text-sm mt-1">LIVES: {status.lives}</p>
                    </div>
                    <div className="bg-black/50 p-4 border-2 border-white text-white">
                        <p className="text-sm uppercase">{LEVELS[status.currentLevel].name}</p>
                    </div>
                </div>
            )}

            {/* Menu Screens */}
            {status.state === GameState.MENU && (
                <div className="text-center bg-zinc-900 border-4 border-yellow-400 p-12 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]">
                    <h1 className="text-4xl text-white mb-8 tracking-tighter">BEAT'S<br/>PIXEL ADVENTURE</h1>
                    <div className="mb-8 flex justify-center">
                        <CharacterPreview />
                    </div>
                    <button 
                        onClick={startGame}
                        className="bg-yellow-400 hover:bg-yellow-300 text-black px-8 py-4 text-xl font-bold transition-transform active:scale-95"
                    >
                        START GAME
                    </button>
                    <p className="mt-6 text-white text-xs opacity-50">USE ARROWS TO MOVE & JUMP</p>
                </div>
            )}

            {status.state === GameState.LOADING && (
                <div className="text-center text-white px-8">
                    <div className="animate-bounce mb-8">
                        <CharacterPreview scale={2} />
                    </div>
                    <h2 className="text-xl mb-4 text-yellow-400">LOADING...</h2>
                    <p className="text-sm italic opacity-75 max-w-md">"{tip}"</p>
                </div>
            )}

            {status.state === GameState.PLAYING && (
                <GameCanvas 
                    level={LEVELS[status.currentLevel]} 
                    onComplete={handleLevelComplete}
                    onGameOver={handleGameOver}
                    onScoreChange={(s) => {
                        if (s === 50) soundManager.playCoin();
                        if (s === 100) soundManager.playStomp();
                        setStatus(prev => ({...prev, score: prev.score + s}));
                    }}
                />
            )}

            {status.state === GameState.LEVEL_COMPLETE && (
                <div className="text-center bg-black/80 p-12 border-4 border-green-500">
                    <h2 className="text-3xl text-green-500 mb-8">LEVEL CLEARED!</h2>
                    <button 
                        onClick={startGame}
                        className="bg-green-500 text-white px-8 py-4 text-xl transition-all hover:bg-green-400"
                    >
                        NEXT LEVEL
                    </button>
                </div>
            )}

            {status.state === GameState.GAME_OVER && (
                <div className="text-center bg-black/80 p-12 border-4 border-red-500">
                    <h2 className="text-3xl text-red-500 mb-8">GAME OVER</h2>
                    <button 
                        onClick={resetGame}
                        className="bg-red-500 text-white px-8 py-4 text-xl transition-all hover:bg-red-400"
                    >
                        RETRY
                    </button>
                </div>
            )}
        </div>
    );
};

const CharacterPreview: React.FC<{scale?: number}> = ({ scale = 1.5 }) => {
    return (
        <div style={{ width: 48 * scale, height: 64 * scale }} className="relative mx-auto">
            {/* Simple CSS Pixel Art representation for UI */}
            <div className="absolute inset-0 bg-white rounded-md" style={{ border: `${4*scale}px solid #222` }}>
                 {/* Headphones band */}
                 <div className="absolute -top-1 left-0 w-full h-2 bg-zinc-800 rounded-full"></div>
                 {/* Face area */}
                 <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 flex flex-col items-center justify-around">
                    <div className="flex w-full justify-around">
                        <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                        <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                    </div>
                    <div className="w-2 h-1 bg-black rounded-full"></div>
                 </div>
                 {/* Yellow shirt */}
                 <div className="absolute bottom-0 left-0 w-full h-1/2 bg-yellow-400"></div>
                 {/* Ear pads */}
                 <div className="absolute top-1/4 -left-2 w-3 h-6 bg-zinc-800 rounded-md"></div>
                 <div className="absolute top-1/4 -right-2 w-3 h-6 bg-zinc-800 rounded-md"></div>
            </div>
        </div>
    );
}

export default App;
