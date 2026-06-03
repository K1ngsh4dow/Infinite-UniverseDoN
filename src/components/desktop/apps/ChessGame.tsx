
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { GameBoard } from '@/components/p2p-chess/GameBoard';
import { GameChat } from '@/components/p2p-chess/GameChat';
import { useWallet } from '@/context/WalletContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PREMINED_WALLETS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { ArrowRight, UserCheck, Cpu, Crown, RotateCcw, Coins, Bot, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { type Square, Chess, Piece } from 'chess.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useOnlineStatus } from '@/hooks/use-online-status';

export interface UIPiece {
  type: 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';
  color: 'white' | 'black';
}

export type UIBoardState = (UIPiece | null)[][];

type GameMode = 'ai' | 'p2p';
type GameState = 'lobby' | `in_game_${GameMode}`;

const opponentAddress = Object.keys(PREMINED_WALLETS)[0] || 'don_addr_0b6ffce4ccb3aeacbdd420bbd68fe54d41662ffc8a2f584a';
const opponentName = "Master AI";

const pieceTypeMap: { [key in Piece['type']]: UIPiece['type'] } = {
    p: 'pawn', r: 'rook', n: 'knight', b: 'bishop', q: 'queen', k: 'king'
};

const pieceColorMap: { [key in Piece['color']]: UIPiece['color'] } = {
    w: 'white', b: 'black'
};

const convertBoard = (board: (Piece | null)[][]): UIBoardState => {
    return board.map(row => 
        row.map(piece => 
            piece ? { type: pieceTypeMap[piece.type], color: pieceColorMap[piece.color] } : null
        )
    );
};

export const ChessGame = () => {
    const [gameState, setGameState] = useState<GameState>('lobby');
    const [game, setGame] = useState(() => new Chess());
    const [boardState, setBoardState] = useState<UIBoardState>(convertBoard(game.board()));
    const [messages, setMessages] = useState<{ player: string; text: string; timestamp: number }[]>([]);
    const [gameOver, setGameOver] = useState<string | null>(null);
    const [wager, setWager] = useState(10);
    const isOnline = useOnlineStatus();

    const { address: playerAddress, isReady, debit, credit } = useWallet();
    const { toast } = useToast();

    const addMessage = useCallback((player: string, text: string) => {
        setMessages(prev => [...prev, { player, text, timestamp: Date.now() }]);
    }, []);
    
    const updateBoardAndState = useCallback((updatedGame: Chess, currentWager: number) => {
        setBoardState(convertBoard(updatedGame.board()));
        if (updatedGame.isGameOver()) {
            const playerWon = updatedGame.turn() === 'b';
            
            if (updatedGame.isCheckmate()) {
                if (playerWon) {
                    if (currentWager > 0) credit('DoN', currentWager * 2, `Chess Winnings vs ${opponentName}`);
                    setGameOver(`Checkmate! You won ${currentWager * 2} DoN!`);
                    addMessage('[SYS]', `Checkmate! You won ${currentWager * 2} DoN.`);
                } else {
                    setGameOver(`Checkmate! ${opponentName} wins. You lost ${currentWager} DoN.`);
                    addMessage('[SYS]', `Checkmate! ${opponentName} wins.`);
                }
            } else if (updatedGame.isDraw() || updatedGame.isStalemate() || updatedGame.isThreefoldRepetition()) {
                if (currentWager > 0) credit('DoN', currentWager, 'Chess Draw - Wager Returned');
                setGameOver(`Draw! Your wager of ${currentWager} DoN has been returned.`);
                addMessage('[SYS]', 'The game is a draw. Wager returned.');
            }
        }
    }, [addMessage, credit]);

    const handlePlayerMove = useCallback((from: Square, to: Square) => {
        if (game.turn() !== 'w' || gameOver) return;

        const gameCopy = new Chess(game.fen());
        const move = gameCopy.move({ from, to, promotion: 'q' });

        if (move) {
            setGame(gameCopy);
            addMessage(playerAddress || 'Player', `moved ${move.piece === 'p' ? 'pawn' : pieceTypeMap[move.piece]} from ${from} to ${to}`);
            updateBoardAndState(gameCopy, gameState === 'in_game_p2p' ? wager : 0);
        }
    }, [game, gameOver, playerAddress, addMessage, updateBoardAndState, gameState, wager]);
    
    // Opponent AI Logic
    useEffect(() => {
        if (gameState.startsWith('in_game') && game.turn() === 'b' && !gameOver) {
            const timeout = setTimeout(() => {
                const gameCopy = new Chess(game.fen());
                const moves = gameCopy.moves({ verbose: true });
                if (moves.length > 0) {
                    const captureMoves = moves.filter(m => m.flags.includes('c'));
                    
                    let move;
                    if (captureMoves.length > 0) {
                        move = captureMoves[Math.floor(Math.random() * captureMoves.length)];
                    } else {
                        move = moves[Math.floor(Math.random() * moves.length)];
                    }

                    const moveResult = gameCopy.move(move.san);
                    setGame(gameCopy);
                    addMessage(opponentName, `moved ${moveResult.piece === 'p' ? 'pawn' : pieceTypeMap[moveResult.piece]} from ${moveResult.from} to ${moveResult.to}`);
                    updateBoardAndState(gameCopy, gameState === 'in_game_p2p' ? wager : 0);
                }
            }, 750);
            return () => clearTimeout(timeout);
        }
    }, [game, gameOver, addMessage, updateBoardAndState, gameState, wager]);

    const handlePlayerMessage = (text: string) => {
        addMessage(playerAddress || 'Player', text);
        // Simulate AI response
        setTimeout(() => {
            const responses = ["Acknowledged.", "Interesting...", "I see.", "A bold statement.", "Focus on the game."];
            const response = responses[Math.floor(Math.random() * responses.length)];
            addMessage(opponentName, response);
        }, 1000);
    }

    const startGame = (mode: GameMode) => {
        let currentWager = 0;
        if (mode === 'p2p') {
            if (!isOnline) {
                toast({ title: "You are offline", description: "Wager matches require an internet connection.", variant: "destructive" });
                return;
            }
            if (wager <= 0) {
                toast({ title: "Invalid Wager", description: "Wager must be greater than zero.", variant: "destructive" });
                return;
            }
            if (!debit('DoN', wager, `Chess Wager vs ${opponentName}`)) return;
            currentWager = wager;
        }

        const newGame = new Chess();
        setGame(newGame);
        setBoardState(convertBoard(newGame.board()));
        const welcomeMessage = mode === 'p2p' 
            ? `New game started for ${currentWager} DoN. White to move.`
            : 'New AI simulation started. White to move.';
        setMessages([{ player: '[SYS]', text: welcomeMessage, timestamp: Date.now() }]);
        setGameOver(null);
        setGameState(`in_game_${mode}`);
    };
    
     const handleResetGame = () => {
        setGameState('lobby');
        setGameOver(null);
        setMessages([]);
        setWager(10);
    };

    if (gameState === 'lobby') {
        return (
            <div className="flex flex-col h-full bg-background">
                <header className="p-4 text-center border-b">
                    <h2 className="font-headline text-2xl font-bold">Strategic Command</h2>
                    <p className="text-sm text-muted-foreground">Select a simulation mode.</p>
                </header>
                <ScrollArea className="flex-grow">
                <div className="p-4 md:p-6 space-y-6">
                    <Card className="w-full">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5"/>AI Simulation</CardTitle>
                            <CardDescription>Practice your skills against the onboard OS AI. No cost, no risk. Available offline.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Button className="w-full" variant="secondary" onClick={() => startGame('ai')}>
                                Start Simulation
                             </Button>
                        </CardContent>
                    </Card>
                    <Card className="w-full" disabled={!isOnline}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5"/>Live Wager</CardTitle>
                            <CardDescription>Challenge the Master AI in a high-stakes match. An internet connection is required. (P2P coming soon)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="wager-input-window" className="flex items-center gap-2 text-sm"><Coins className="h-4 w-4"/> Wager Amount (DoN)</Label>
                                <Input
                                    id="wager-input-window"
                                    type="number"
                                    value={wager}
                                    onChange={(e) => setWager(Math.max(0, parseInt(e.target.value, 10) || 0))}
                                    min="1"
                                    disabled={!isOnline}
                                />
                            </div>
                            <Button className="w-full" onClick={() => startGame('p2p')} disabled={!isOnline}>
                                Begin Live Wager <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                             {!isOnline && <p className="text-xs text-center text-destructive pt-2">Online connection required for wagers.</p>}
                        </CardContent>
                    </Card>
                </div>
                </ScrollArea>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col h-full bg-background">
             {gameOver && (
                <AlertDialog open={!!gameOver} onOpenChange={(open) => !open && handleResetGame()}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Game Over</AlertDialogTitle>
                            <AlertDialogDescription>{gameOver}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                             <AlertDialogAction onClick={handleResetGame}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Return to Lobby
                             </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start p-4 flex-grow overflow-hidden">
                <div className="lg:col-span-2">
                    <GameBoard boardState={boardState} game={game} onPlayerMove={handlePlayerMove} />
                </div>
                <div className="space-y-4 h-full flex flex-col">
                    <Card>
                        <CardHeader className="p-4">
                            <CardTitle className="text-base">Game Info</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 space-y-2 text-xs">
                            <p className="font-semibold">White (You):</p>
                            <p className="font-mono text-xs break-all text-muted-foreground">{playerAddress}</p>
                            <p className="font-semibold pt-1">Black (Opponent):</p>
                            <p className="font-mono text-xs break-all text-muted-foreground">{opponentAddress}</p>
                             <p className="font-semibold pt-1">Current Turn:</p>
                            <p className="text-muted-foreground capitalize">{game.turn() === 'w' ? 'White (Your turn)' : 'Black'}</p>
                        </CardContent>
                    </Card>
                    <div className="flex-grow min-h-0">
                        <GameChat messages={messages} onSendMessage={handlePlayerMessage} />
                    </div>
                </div>
            </div>
        </div>
    );
}
