
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';


// Ball and Clue definitions based on the GDD
const initialBalls = [
    { id: 1, number: 1, color: 'bg-yellow-400' },
    { id: 2, number: 2, color: 'bg-blue-500' },
    { id: 3, number: 3, color: 'bg-red-500' },
    { id: 4, number: 4, color: 'bg-purple-600' },
    { id: 5, number: 5, color: 'bg-orange-500' },
    { id: 6, number: 6, color: 'bg-green-600' },
    { id: 7, number: 7, color: 'bg-red-900' },
    { id: 8, number: 8, color: 'bg-gray-800' },
    { id: 9, number: 9, color: 'bg-yellow-400', stripe: true },
];

const clues = {
    1: "A matchbook from 'The Blue Dahlia Club'. Lily was here the night she vanished.",
    2: "A witness remembers her talking to a man in a gray fedora. Said he had 'dead eyes'.",
    3: "She left in a black sedan. License plate started with 'VX'.",
    4: "The car is registered to a shell corp: 'Phoenix Enterprises'. The name rings a bell... a dirty one.",
    5: "Phoenix is a front for Councilman Thorne. He was paying Lily's rent. This is bigger than a simple disappearance.",
    6: "Thorne's getting kickbacks on the new city development deal. Lily must have found out.",
    7: "A security guard at Thorne's office was paid to erase a week's worth of security footage. The week Lily went missing.",
    8: "The guard mentioned a 'delivery' to the old shipyards that night. Thorne's men were there. They weren't delivering flowers.",
    9: "It all clicks. Thorne. The shipyard. He didn't just silence her, he erased her. But he left a witness. Me. And now, I know where to find him.",
};

type GamePhase = 'MENU' | 'PLAYING' | 'GAME_OVER';

const BallComponent = ({ ball, position, isPocketed }: any) => {
    return (
        <motion.div
            className="absolute w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-white font-bold text-sm shadow-lg"
            style={{ 
                background: ball.color,
                ...position
            }}
            initial={{ opacity: 1, scale: 1 }}
            animate={{ opacity: isPocketed ? 0 : 1, scale: isPocketed ? 0 : 1 }}
            transition={{ duration: 0.5 }}
        >
            {ball.stripe && <div className="absolute w-full h-3 bg-white" />}
            <span className="relative z-10">{ball.number}</span>
        </motion.div>
    );
};

export function NineBallEnigma() {
    const [phase, setPhase] = useState<GamePhase>('MENU');
    const [balls, setBalls] = useState(initialBalls);
    const [pocketedBalls, setPocketedBalls] = useState<number[]>([]);
    const [currentClue, setCurrentClue] = useState<string | null>(null);
    const [turn, setTurn] = useState<'player' | 'opponent'>('player');

    const ballPositions = useMemo(() => {
        // Simple diamond rack position
        return {
            1: { top: '50%', left: '30%' },
            2: { top: 'calc(50% - 20px)', left: 'calc(30% + 35px)' },
            3: { top: 'calc(50% + 20px)', left: 'calc(30% + 35px)' },
            4: { top: 'calc(50% - 40px)', left: 'calc(30% + 70px)' },
            9: { top: '50%', left: 'calc(30% + 70px)' },
            5: { top: 'calc(50% + 40px)', left: 'calc(30% + 70px)' },
            6: { top: 'calc(50% - 60px)', left: 'calc(30% + 105px)' },
            7: { top: 'calc(50% - 20px)', left: 'calc(30% + 105px)' },
            8: { top: 'calc(50% + 20px)', left: 'calc(30% + 105px)' },
            // Ball 8 is missing from original GDD rack, let's add it. It should be in the middle of back row.
            // Let's re-rack based on a standard 9-ball setup.
            // 1 at top, 9 in middle.
            // 1: top of diamond
            // row 2: two balls
            // row 3: three balls (9 in middle)
            // row 4: two balls
            // row 5: one ball
            // This is complex, will stick to a simpler visual layout.
            // The GDD layout is a bit weird. Let's simplify.
            1: { top: '50%', left: '25%' },
            2: { top: 'calc(50% - 18px)', left: 'calc(25% + 31px)' },
            3: { top: 'calc(50% + 18px)', left: 'calc(25% + 31px)' },
            9: { top: '50%', left: 'calc(25% + 62px)' },
            4: { top: 'calc(50% - 36px)', left: 'calc(25% + 62px)'},
            5: { top: 'calc(50% + 36px)', left: 'calc(25% + 62px)'},
            6: { top: 'calc(50% - 18px)', left: 'calc(25% + 93px)'},
            7: { top: 'calc(50% + 18px)', left: 'calc(25% + 93px)'},
            8: { top: '50%', left: 'calc(25% + 124px)'},

        };
    }, []);

    const nextBallToHit = useMemo(() => {
        const remainingBalls = balls.filter(b => !pocketedBalls.includes(b.number));
        if (remainingBalls.length === 0) return null;
        return Math.min(...remainingBalls.map(b => b.number));
    }, [balls, pocketedBalls]);

    const handlePlayerTurn = useCallback(() => {
        if (turn !== 'player' || !nextBallToHit) return;
        
        const ballToPocket = nextBallToHit;
        
        setCurrentClue(clues[ballToPocket as keyof typeof clues]);
        setPocketedBalls(prev => [...prev, ballToPocket]);
        
        if (ballToPocket === 9) {
            setPhase('GAME_OVER');
        } else {
            setTurn('opponent');
        }
    }, [turn, nextBallToHit, setCurrentClue, setPocketedBalls, setPhase, setTurn]);

    useEffect(() => {
        if (turn === 'opponent' && phase === 'PLAYING') {
            const opponentTurnTimeout = setTimeout(() => {
                if (!nextBallToHit) return;
                const ballToPocket = nextBallToHit;
                setCurrentClue(clues[ballToPocket as keyof typeof clues]);
                setPocketedBalls(prev => [...prev, ballToPocket]);

                 if (ballToPocket === 9) {
                    setPhase('GAME_OVER');
                } else {
                    setTurn('player');
                }
            }, 2000);
            return () => clearTimeout(opponentTurnTimeout);
        }
    }, [turn, phase, nextBallToHit]);
    
    const startGame = () => {
        setBalls(initialBalls);
        setPocketedBalls([]);
        setCurrentClue("The game is set. Break the balls when you're ready.");
        setTurn('player');
        setPhase('PLAYING');
    }

    if (phase === 'MENU') {
        return (
            <div className="h-full w-full bg-black flex flex-col items-center justify-center p-8 text-white text-center" style={{backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '10px 10px'}}>
                <h1 className="text-5xl font-serif font-bold" style={{textShadow: '1px 1px 10px rgba(255,255,255,0.3)'}}>The Nine-Ball Enigma</h1>
                <p className="mt-4 text-gray-300 max-w-lg">A single game for the truth. Every pocketed ball reveals a clue. Don't miss.</p>
                <Button onClick={startGame} className="mt-8">Begin Game</Button>
            </div>
        )
    }

    if (phase === 'GAME_OVER') {
         return (
            <div className="h-full w-full bg-black flex flex-col items-center justify-center p-8 text-white text-center">
                <h1 className="text-4xl font-serif font-bold">Case Closed.</h1>
                <p className="mt-4 text-gray-300 max-w-lg">{currentClue}</p>
                <Button onClick={startGame} className="mt-8">Play Again</Button>
            </div>
        )
    }

    return (
        <div className="h-full w-full bg-gray-900 text-white flex flex-col overflow-hidden">
            {/* Game Table */}
            <div className="relative flex-grow bg-green-800 border-8 border-yellow-900 m-4 shadow-2xl">
                {/* Smoky Overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-50 mix-blend-overlay pointer-events-none" style={{
                    backgroundImage: 'url(https://www.transparenttextures.com/patterns/foggy-birds.png)'
                }}></div>
                {balls.map(ball => (
                    <BallComponent 
                        key={ball.id} 
                        ball={ball} 
                        position={ballPositions[ball.number as keyof typeof ballPositions]}
                        isPocketed={pocketedBalls.includes(ball.number)}
                    />
                ))}
            </div>

            {/* UI Bar */}
            <div className="flex-shrink-0 p-4 bg-black/50 border-t border-gray-700 grid grid-cols-3 gap-4 items-center">
                {/* Status */}
                <div className="text-left">
                    <h3 className="font-bold">TARGET</h3>
                    <p className="text-xl font-mono">{nextBallToHit ? `Ball ${nextBallToHit}` : "Game Over"}</p>
                </div>
                {/* Action Button */}
                <div className="text-center">
                    <Button 
                        onClick={handlePlayerTurn} 
                        disabled={turn !== 'player' || phase !== 'PLAYING'}
                        size="lg"
                    >
                        {turn === 'player' ? 'Take the Shot' : 'Opponent Thinking...'}
                    </Button>
                </div>
                {/* Clue Display */}
                <Card className="bg-gray-800 border-gray-700 text-white col-span-1">
                    <CardHeader className="p-2 flex-row items-center justify-between">
                         <h4 className="font-bold flex items-center gap-2"><BookOpen className="h-4 w-4"/> Case File</h4>
                    </CardHeader>
                    <CardContent className="p-2 text-xs h-16 overflow-y-auto">
                        <AnimatePresence>
                            <motion.p 
                                key={currentClue}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                            >
                                {currentClue}
                            </motion.p>
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
