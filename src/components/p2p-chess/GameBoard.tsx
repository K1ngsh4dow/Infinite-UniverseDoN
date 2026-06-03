
'use client';

import React, { useState, useMemo } from 'react';
import { type UIPiece, type UIBoardState } from '@/components/desktop/apps/ChessGame';
import { cn } from '@/lib/utils';
import { type Chess, type Square } from 'chess.js';

// Simple SVG components for chess pieces
const King = ({ color }: { color: string }) => <svg viewBox="0 0 45 45"><g fill={color} stroke="black" strokeWidth="1.5"><path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8 M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" strokeLinecap="round" strokeLinejoin="round" /><path d="M 22.5 25 C 22.5 25 27 17.5 25.5 14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18 17.5 22.5,25 22.5,25 Z" fill={color} /><path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 10.5,13 6.5,19.5 C 3.5,25.5 11.5,30 11.5,30 L 11.5,37" strokeLinecap="round" strokeLinejoin="round" fill={color} /></g></svg>;
const Queen = ({ color }: { color: string }) => <svg viewBox="0 0 45 45"><g fill={color} stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 11.5,14.5 A 25 25 0 0 1 33.5,14.5 L 31,25 L 14,25 L 11.5,14.5" /><path d="M 12,37 C 17.5,40.5 27.5,40.5 33,37 L 33,30 C 33,30 40.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 10.5,13 6.5,19.5 C 3.5,25.5 12,30 12,30 L 12,37" /><path d="M 11.5,14.5 A 25 25 0 0 1 33.5,14.5" fill="none" /><circle cx="6" cy="12" r="2.75" /><circle cx="14" cy="9" r="2.75" /><circle cx="22.5" cy="8" r="2.75" /><circle cx="31" cy="9" r="2.75" /><circle cx="39" cy="12" r="2.75" /></g></svg>;
const Rook = ({ color }: { color: string }) => <svg viewBox="0 0 45 45"><g fill={color} stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" /><path d="M 34,14 L 31,17 L 14,17 L 11,14" /><path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" fill={color} stroke="none" /><path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" fill="none" /><path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5" /></g></svg>;
const Bishop = ({ color }: { color: string }) => <svg viewBox="0 0 45 45"><g fill={color} stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.26,39.24 36,39 L 9,39 C 7.74,39.24 6.68,38.97 6,38 C 7.35,36.54 9,36 9,36" /><path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 L 30,30 C 30,30 32.5,25.5 27.5,19.5 C 22.5,13.5 22.5,13.5 22.5,13.5 C 22.5,13.5 22.5,13.5 17.5,19.5 C 12.5,25.5 15,30 15,30 L 15,32" /><path d="M 25 18 A 2.5 2.5 0 1 1 20 18 A 2.5 2.5 0 1 1 25 18 z" /><path d="M 22.5,13.5 L 22.5,11.5" /><circle cx="22.5" cy="10" r="1.5" /></g></svg>;
const Knight = ({ color }: { color: string }) => <svg viewBox="0 0 45 45"><g fill={color} stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M 22,10 C 22.74,9.24 24.3,7.73 24.5,6.5 C 24.5,6.5 27,8.5 26,11.5 C 26,11.5 29.5,10.5 31,11.5 C 31,11.5 30.5,14.5 28,14.5 C 28,14.5 29,18 27,18 C 27,18 24.5,19.5 23,19 C 23,19 22.5,21.5 21,22 C 21,22 19.5,23.5 18,22 C 18,22 15,23 15,21 C 15,21 13.5,22.5 13.5,20.5 C 13.5,20.5 10.5,19.5 11,18 C 11,18 10.5,16 12.5,15 C 12.5,15 12,13.5 13.5,12.5 C 13.5,12.5 13.5,10.5 16,10.5 C 16,10.5 19,10.5 22,10" /><path d="M 15 21 L 15 30 L 30 30 L 30 21" /><path d="M 15 30 S 17 32 22.5 32 S 30 30 30 30" /><path d="M 12 35 L 33 35 L 33 38 L 12 38 L 12 35" /></g></svg>;
const Pawn = ({ color }: { color: string }) => <svg viewBox="0 0 45 45"><g fill={color} stroke="black" strokeWidth="1.5"><path d="M 22.5,9 C 22.5,9 24.5,9 25.5,11.5 C 25.5,11.5 24.5,13 22.5,13 C 20.5,13 19.5,11.5 19.5,11.5 C 20.5,9 22.5,9 22.5,9" /><path d="M 22.5,13 C 22.5,13 22.5,14 22.5,15 C 22.5,15 25,16 25,18 C 25,20 22.5,21 22.5,21 C 22.5,21 20,20 20,18 C 20,16 22.5,15 22.5,15" strokeLinecap="round" /><path d="M 22.5,21 C 22.5,21 22.5,22 22.5,23" strokeLinecap="round" /><path d="M 22.5,23 C 21.5,24.5 20,26 20,28 L 25,28 C 25,26 23.5,24.5 22.5,23" /><path d="M 20,28 L 20,32 L 25,32 L 25,28" /><path d="M 20,32 L 18,34 L 27,34 L 25,32" /><path d="M 18,34 L 18,38 L 27,38 L 27,34" /><path d="M 18,38 L 27,38" fill="none" /></g></svg>;

const PieceComponent = ({ piece }: { piece: UIPiece }) => {
  const color = piece.color === 'white' ? '#FFFFFF' : '#333333';
  switch (piece.type) {
    case 'king': return <King color={color} />;
    case 'queen': return <Queen color={color} />;
    case 'rook': return <Rook color={color} />;
    case 'bishop': return <Bishop color={color} />;
    case 'knight': return <Knight color={color} />;
    case 'pawn': return <Pawn color={color} />;
    default: return null;
  }
};

interface GameBoardProps {
    boardState: UIBoardState;
    game: Chess;
    playerColor?: 'white' | 'black';
    onPlayerMove: (from: Square, to: Square) => void;
}

export const GameBoard = ({ boardState, game, playerColor = 'white', onPlayerMove }: GameBoardProps) => {
    const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

    const legalMovesForSelectedPiece = useMemo(() => {
        if (!selectedSquare) return new Set();
        const moves = game.moves({ square: selectedSquare, verbose: true });
        return new Set(moves.map(move => move.to));
    }, [selectedSquare, game]);

    const handleSquareClick = (row: number, col: number) => {
        if (game.isGameOver()) return;
        const square = (String.fromCharCode(97 + col) + (8 - row)) as Square;
        
        // If a piece is already selected, try to move it
        if (selectedSquare) {
            // Check if the clicked square is a legal move
            if (legalMovesForSelectedPiece.has(square)) {
                onPlayerMove(selectedSquare, square);
                setSelectedSquare(null); // Deselect after moving
            } else {
                 // If clicked on another piece of the same color, select it instead
                 const piece = game.get(square);
                 if (piece && piece.color === playerColor[0]) {
                     setSelectedSquare(square);
                 } else {
                     setSelectedSquare(null); // Deselect if clicked on empty or opponent piece
                 }
            }
        } else {
            // If no piece is selected, select one if it's the player's turn and their piece
            const piece = game.get(square);
            if (piece && piece.color === playerColor[0] && game.turn() === playerColor[0]) {
                setSelectedSquare(square);
            }
        }
    };
    
    return (
        <div className="aspect-square w-full max-w-2xl mx-auto bg-card border shadow-lg rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 h-full">
                {boardState.map((row, rowIndex) =>
                    row.map((piece, colIndex) => {
                        const isLight = (rowIndex + colIndex) % 2 === 0;
                        const square = (String.fromCharCode(97 + colIndex) + (8 - rowIndex)) as Square;
                        const isSelected = selectedSquare === square;
                        const isLegalMove = legalMovesForSelectedPiece.has(square);

                        return (
                            <div
                                key={`${rowIndex}-${colIndex}`}
                                className={cn(
                                    'relative flex items-center justify-center cursor-pointer transition-colors duration-200',
                                    isLight ? 'bg-muted/50' : 'bg-muted',
                                    'hover:bg-primary/20',
                                    isSelected && 'bg-primary/30',
                                )}
                                onClick={() => handleSquareClick(rowIndex, colIndex)}
                            >
                                <div className={cn('relative w-full h-full p-1 transition-transform duration-200')}>
                                    {piece && <PieceComponent piece={piece} />}
                                </div>
                                {isLegalMove && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-1/3 h-1/3 rounded-full bg-primary/50"></div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
