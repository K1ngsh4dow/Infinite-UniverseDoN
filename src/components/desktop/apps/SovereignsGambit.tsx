
'use client';

import React, { useState, useMemo } from 'react';
import { Chess, type Square } from 'chess.js';
import { GameBoard } from '@/components/p2p-chess/GameBoard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useSpark } from '@/context/SparkContext';
import { type UIBoardState } from '@/components/desktop/apps/ChessGame';
import { motion } from 'framer-motion';

interface NarrativeChoice {
    text: string;
    move: { from: Square; to: Square; };
    targetNodeId: string;
    sparkCost?: number;
}

interface NarrativeNode {
    id: string;
    fen: string;
    narration: string;
    choices: NarrativeChoice[];
    isEnd?: boolean;
}

const narrativeTree: Record<string, NarrativeNode> = {
    start: {
        id: 'start',
        fen: 'r1b1k2r/pp2qppp/2n1p3/3p4/2P1n3/P1N1PN2/1P3PPP/R2QKB1R w KQkq - 0 10',
        narration: "The lines have buckled. The Black Queen probes your defenses, her knights a constant, unnerving threat. Your own pieces are scattered. A choice must be made.",
        choices: [
            { text: "Assert control of the center. (cxd5)", move: { from: 'c4', to: 'd5' }, targetNodeId: 'center_control' },
            { text: "Develop your bishop, challenging the knight. (Bd2)", move: { from: 'f1', to: 'd2' }, targetNodeId: 'bishop_develop' }
        ],
    },
    center_control: {
        id: 'center_control',
        fen: 'r1b1k2r/pp2qppp/2n1p3/3P4/4n3/P1N1PN2/1P3PPP/R2QKB1R b KQkq - 0 10',
        narration: "You seize the center, but the exchange has left your King's flank vulnerable. The enemy knight retreats, but it's a feint. A new attack is coming.",
        choices: [
            { text: "Fortify with the rook. (Rb1)", move: { from: 'a1', to: 'b1' }, targetNodeId: 'rook_fortify' },
            { text: "A desperate gambit. Offer the pawn. (d6)", sparkCost: 5, move: { from: 'd5', to: 'd6' }, targetNodeId: 'pawn_gambit' }
        ],
    },
    bishop_develop: {
        id: 'bishop_develop',
        fen: 'r1b1k2r/pp2qppp/2n1p3/3p4/2P1n3/P1N1PN2/1P1B1PPP/R2QKB1R b KQkq - 1 10',
        narration: "A solid, if predictable, move. The enemy ignores your bishop, their queen sliding silently into a more aggressive position. The pressure mounts.",
        choices: [
            { text: "Challenge the queen directly. (Qc2)", move: { from: 'd1', to: 'c2' }, targetNodeId: 'challenge_queen' },
            { text: "Continue development, ignoring the threat. (Be2)", move: { from: 'c1', to: 'e2' }, targetNodeId: 'end_checkmate' }
        ],
    },
    rook_fortify: {
        id: 'rook_fortify',
        fen: 'r1b1k2r/pp2qppp/2n1p3/3P4/4n3/P1N1PN2/1P3PPP/1R1QKB1R b Kkq - 0 11',
        narration: "The fortress holds... for now. You have survived the onslaught, but the board is locked in a tense, fragile balance. A draw. A victory of sorts.",
        isEnd: true,
        choices: []
    },
    pawn_gambit: {
        id: 'pawn_gambit',
        fen: 'r1b1k2r/pp2qppp/2n1p3/8/4n3/P1N1PN2/1P3PPP/R2QKB1R w KQkq - 0 11',
        narration: "A bold sacrifice! It buys you time, space... a chance. The board is rewritten in your favor. You have a clear path to victory.",
        isEnd: true,
        choices: []
    },
     challenge_queen: {
        id: 'challenge_queen',
        fen: 'r1b1k2r/pp2qppp/2n1p3/3p4/2P1n3/P1N1PN2/1PQB1PPP/R3KB1R b KQkq - 2 11',
        narration: "Your challenge is met with cold indifference. The enemy calculates faster than you can hope. A checkmate in three is now unavoidable.",
        isEnd: true,
        choices: []
    },
    end_checkmate: {
        id: 'end_checkmate',
        fen: 'r1b1k2r/pp3ppp/2n1pq2/3p4/2P1n3/P1N1PN2/1P1B1PPP/R2QKB1R w KQkq - 0 12',
        narration: "You focused on development while ignoring the immediate danger. A fatal mistake. The king has fallen.",
        isEnd: true,
        choices: []
    }
};

const pieceTypeMap: { [key in 'p' | 'r' | 'n' | 'b' | 'q' | 'k']: UIBoardState[0][0] extends infer P | null ? P extends object ? P['type'] : never : never } = {
    p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king'
};

const pieceColorMap: { [key in 'w' | 'b']: UIBoardState[0][0] extends infer P | null ? P extends object ? P['color'] : never : never } = {
    w: 'white', b: 'black'
};

const convertBoard = (board: (({ type: "p" | "r" | "n" | "b" | "q" | "k", color: 'w' | 'b' }) | null)[][]): UIBoardState => {
    return board.map(row => 
        row.map(piece => 
            piece ? { type: pieceTypeMap[piece.type], color: pieceColorMap[piece.color] } : null
        )
    );
};


export function SovereignsGambit() {
    const [currentNodeId, setCurrentNodeId] = useState('start');
    const { spendSpark } = useSpark();

    const currentNode = useMemo(() => narrativeTree[currentNodeId], [currentNodeId]);
    const game = useMemo(() => new Chess(currentNode.fen), [currentNode.fen]);
    
    const handleChoice = (choice: NarrativeChoice) => {
        if (choice.sparkCost) {
            if (!spendSpark(choice.sparkCost)) return;
        }
        setCurrentNodeId(choice.targetNodeId);
    };

    const handleRestart = () => {
        setCurrentNodeId('start');
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full bg-slate-900 text-white p-4 gap-4">
            <div className="lg:col-span-2">
                 <GameBoard boardState={convertBoard(game.board())} game={game} onPlayerMove={() => {}} />
            </div>
            <Card className="bg-slate-800 border-slate-700 flex flex-col h-full">
                <CardHeader>
                    <CardTitle>Sovereign's Gambit</CardTitle>
                    <CardDescription>The fate of your kingdom rests on your next move.</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow space-y-4">
                    <motion.p
                        key={currentNode.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-muted-foreground italic"
                    >
                        {currentNode.narration}
                    </motion.p>
                    <div className="space-y-2">
                        {currentNode.choices.map((choice, index) => (
                             <Button key={index} variant="outline" className="w-full justify-start text-left h-auto" onClick={() => handleChoice(choice)}>
                                <div className="flex flex-col">
                                    <span>{choice.text}</span>
                                    {choice.sparkCost && <span className="text-xs text-yellow-400">{choice.sparkCost} SPARK required</span>}
                                </div>
                             </Button>
                        ))}
                    </div>
                </CardContent>
                {currentNode.isEnd && (
                     <CardFooter>
                        <Button onClick={handleRestart} className="w-full">Play Again</Button>
                    </CardFooter>
                )}
            </Card>
        </div>
    );
}
