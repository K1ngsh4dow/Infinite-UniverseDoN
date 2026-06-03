
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Heart, Zap, Shield, Swords, Dna, Package, Repeat, Skull, User, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getFriendlyAIError } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { generateAbilities, Ability } from '@/ai/flows/generate-ability-flow';
import { generateEnemy, Enemy, EnemyMove } from '@/ai/flows/generate-enemy-flow';

// Game State Types
type GamePhase = 'LOADING' | 'COMBAT' | 'REWARD' | 'GAME_OVER' | 'OFFLINE';
interface PlayerState {
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    block: number;
}
interface EnemyState extends Enemy {
    health: number;
    nextMove: EnemyMove | null;
}

// Basic starting cards
const STRIKE_CARD: Ability = {
    name: 'Strike', type: 'Attack', cost: 1,
    description: 'Deal 6 damage.',
    effects: { damage: 6 },
    imagePrompt: 'a simple grey card with a fist icon'
};
const DEFEND_CARD: Ability = {
    name: 'Defend', type: 'Skill', cost: 1,
    description: 'Gain 5 block.',
    effects: { block: 5 },
    imagePrompt: 'a simple grey card with a shield icon'
};

const CardComponent = ({ card, onPlay, canPlay }: { card: Ability, onPlay: () => void, canPlay: boolean }) => (
    <Card
        className={cn(
            "w-48 h-64 flex flex-col cursor-pointer transition-all duration-200 select-none",
            "bg-card border-2 hover:border-primary hover:-translate-y-2",
            !canPlay && "opacity-50 cursor-not-allowed bg-muted"
        )}
        onClick={canPlay ? onPlay : undefined}
    >
        <CardHeader className="p-3">
            <CardTitle className="text-base flex justify-between items-center">
                <span>{card.name}</span>
                <span className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">{card.cost}</span>
            </CardTitle>
            <CardDescription className="text-xs">{card.type}</CardDescription>
        </CardHeader>
        <CardContent className="p-3 text-sm flex-grow">
            {card.description}
        </CardContent>
        <CardFooter className="p-3 text-xs text-muted-foreground border-t">
            Quantum Ascent
        </CardFooter>
    </Card>
);

const RewardCard = ({ card, onSelect }: { card: Ability, onSelect: () => void }) => (
     <Card
        className="w-52 h-72 flex flex-col cursor-pointer transition-all duration-200 select-none bg-card border-2 hover:border-green-500 hover:scale-105"
        onClick={onSelect}
    >
        <CardHeader className="p-3">
            <CardTitle className="text-lg flex justify-between items-center">
                <span>{card.name}</span>
                <span className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground text-base font-bold">{card.cost}</span>
            </CardTitle>
            <CardDescription className="text-sm">{card.type}</CardDescription>
        </CardHeader>
        <CardContent className="p-3 text-sm flex-grow">
            {card.description}
        </CardContent>
        <CardFooter className="p-3 text-xs text-muted-foreground border-t">
            New Ability
        </CardFooter>
    </Card>
);


export function QuantumAscent() {
    const [gamePhase, setGamePhase] = useState<GamePhase>('LOADING');
    const [player, setPlayer] = useState<PlayerState>({ health: 80, maxHealth: 80, energy: 3, maxEnergy: 3, block: 0 });
    const [enemy, setEnemy] = useState<EnemyState | null>(null);
    const [deck, setDeck] = useState<Ability[]>([]);
    const [hand, setHand] = useState<Ability[]>([]);
    const [drawPile, setDrawPile] = useState<Ability[]>([]);
    const [discardPile, setDiscardPile] = useState<Ability[]>([]);
    const [rewardChoices, setRewardChoices] = useState<Ability[]>([]);
    const [floor, setFloor] = useState(1);
    
    const { toast } = useToast();
    const isOnline = useOnlineStatus();

    const shuffle = (array: Ability[]) => array.sort(() => Math.random() - 0.5);

    const startNewTurn = useCallback((currentDrawPile: Ability[], currentDiscardPile: Ability[]) => {
        let newDraw = [...currentDrawPile];
        if (newDraw.length < 5) {
            newDraw = shuffle([...newDraw, ...currentDiscardPile]);
            setDiscardPile([]);
        }
        
        const newHand = newDraw.slice(0, 5);
        const remainingDraw = newDraw.slice(5);
        
        setHand(newHand);
        setDrawPile(remainingDraw);
        setPlayer(p => ({ ...p, energy: p.maxEnergy, block: 0 }));
    }, []);
    
    const setupNewEnemy = useCallback(async () => {
        try {
            const newEnemyData = await generateEnemy({ theme: 'quantum anomalies', difficulty: 'easy' });
            const nextMove = newEnemyData.moveSet[Math.floor(Math.random() * newEnemyData.moveSet.length)];
            setEnemy({ ...newEnemyData, health: newEnemyData.maxHealth, nextMove });
        } catch (e) {
            toast({ title: "Failed to generate enemy", description: getFriendlyAIError(e), variant: "destructive" });
        }
    }, [toast]);

    useEffect(() => {
        if (!isOnline) {
            setGamePhase('OFFLINE');
            return;
        }

        const initialDeck = [...Array(5).fill(STRIKE_CARD), ...Array(5).fill(DEFEND_CARD)];
        setDeck(initialDeck);
        const shuffledDeck = shuffle([...initialDeck]);
        startNewTurn(shuffledDeck, []);
        setupNewEnemy();
        setGamePhase('COMBAT');
    }, [isOnline, toast, startNewTurn, setupNewEnemy]);

    const playCard = (card: Ability, cardIndex: number) => {
        if (player.energy < card.cost || gamePhase !== 'COMBAT') return;

        // Apply card effects
        let newPlayerState = { ...player, energy: player.energy - card.cost };
        if (card.effects.damage && enemy) {
            setEnemy(e => e ? ({ ...e, health: Math.max(0, e.health - (card.effects.damage || 0)) }) : null);
        }
        if (card.effects.block) {
            newPlayerState.block += card.effects.block;
        }
        setPlayer(newPlayerState);

        // Move card from hand to discard
        const newHand = hand.filter((_, i) => i !== cardIndex);
        setHand(newHand);
        setDiscardPile(d => [...d, card]);
    };
    
    useEffect(() => {
        if (enemy && enemy.health <= 0 && gamePhase === 'COMBAT') {
            setGamePhase('LOADING');
            setFloor(f => f + 1);
            generateAbilities({ theme: 'quantum chaos', count: 3 })
                .then(res => {
                    setRewardChoices(res.abilities);
                    setGamePhase('REWARD');
                })
                .catch(e => {
                    toast({ title: 'Failed to generate rewards', description: getFriendlyAIError(e), variant: 'destructive' });
                    // Still proceed to next combat
                    selectReward(STRIKE_CARD);
                });
        }
    }, [enemy, gamePhase, toast]);

    const selectReward = (card: Ability) => {
        setGamePhase('LOADING');
        const newDeck = [...deck, card];
        setDeck(newDeck);
        const newDiscard = [...discardPile, ...hand];
        setDiscardPile(newDiscard);
        setHand([]);
        
        setupNewEnemy().then(() => {
            startNewTurn(drawPile, newDiscard);
            setGamePhase('COMBAT');
        });
    };
    
    const endTurn = () => {
        if (gamePhase !== 'COMBAT' || !enemy || !enemy.nextMove) return;

        // Enemy action
        const move = enemy.nextMove;
        let damageToPlayer = 0;
        if (move.type === 'Attack') {
             damageToPlayer = move.value - player.block;
        }
        
        const newHealth = player.health - Math.max(0, damageToPlayer);

        if (newHealth <= 0) {
            setPlayer(p => ({ ...p, health: 0 }));
            setGamePhase('GAME_OVER');
            return;
        }
        setPlayer(p => ({...p, health: newHealth}));
        
        // Prepare enemy for next turn
        const nextMove = enemy.moveSet[Math.floor(Math.random() * enemy.moveSet.length)];
        setEnemy(e => e ? ({ ...e, nextMove }) : null);
        
        // Start player's new turn
        const newDrawPile = [...drawPile];
        const newDiscardPile = [...discardPile, ...hand];
        setHand([]);
        startNewTurn(newDrawPile, newDiscardPile);
    };

    if (gamePhase === 'OFFLINE') {
        return <div className="h-full w-full flex flex-col items-center justify-center bg-black/80 text-white space-y-4">
            <WifiOff className="h-20 w-20 text-destructive" />
            <h2 className="text-4xl font-headline">Connection Lost</h2>
            <p className="text-muted-foreground">Quantum Ascent requires an internet connection to generate anomalies.</p>
        </div>;
    }

    if (gamePhase === 'LOADING') {
        return <div className="h-full w-full flex items-center justify-center bg-black/80 text-white"><Loader2 className="h-10 w-10 animate-spin mr-4" /> Generating Quantum Anomaly...</div>;
    }
    
    if (gamePhase === 'GAME_OVER') {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black/80 text-white space-y-4">
                <Skull className="h-20 w-20 text-destructive" />
                <h2 className="text-4xl font-headline">Run Failed</h2>
                <p className="text-muted-foreground">You reached floor {floor}.</p>
                <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
        );
    }
    
    if (gamePhase === 'REWARD') {
         return (
            <div className="h-full w-full flex flex-col items-center justify-center bg-black/80 text-white space-y-6 p-4">
                <h2 className="text-3xl font-headline">Victory!</h2>
                <p className="text-muted-foreground">Select a new ability to add to your deck.</p>
                <div className="flex gap-6">
                    {rewardChoices.length > 0 
                        ? rewardChoices.map((card, i) => <RewardCard key={i} card={card} onSelect={() => selectReward(card)} />)
                        : <Loader2 className="h-10 w-10 animate-spin" />
                    }
                </div>
            </div>
        );
    }

    // Main Combat UI
    return (
        <div className="h-full w-full bg-slate-900 text-white flex flex-col p-4 space-y-4 overflow-hidden">
            {/* Top Bar: Enemy + Floor */}
            <div className="flex-shrink-0 flex justify-between items-start">
                <Card className="bg-slate-800 border-slate-700 text-white w-1/3">
                    <CardHeader className="p-3">
                        <CardTitle className="text-lg">{enemy?.name || 'Loading...'}</CardTitle>
                        {enemy && <Progress value={(enemy.health / enemy.maxHealth) * 100} className="h-2 bg-red-900 border-red-700 [&>div]:bg-red-500" />}
                        <CardDescription>{enemy?.health} / {enemy?.maxHealth} HP</CardDescription>
                    </CardHeader>
                    {enemy?.nextMove && <CardFooter className="p-3 bg-slate-700/50 text-sm">Intent: {enemy.nextMove.description}</CardFooter>}
                </Card>
                <div className="text-center font-bold text-lg">Floor {floor}</div>
            </div>

            {/* Middle: Battle area */}
            <div className="flex-grow flex justify-between items-center px-16">
                <div className="flex flex-col items-center gap-2">
                    <User className="h-24 w-24 text-blue-300" />
                    <p className="font-semibold">The Ascendant</p>
                </div>
                
                <Swords className="h-16 w-16 text-slate-500" />

                <div className="flex flex-col items-center gap-2">
                    <Dna className="h-24 w-24 text-purple-400" />
                    <p className="font-semibold">{enemy?.name || 'Anomaly'}</p>
                </div>
            </div>
            
            {/* Bottom Bar: Player + Hand */}
            <div className="flex-shrink-0 space-y-4">
                 {/* Player Hand */}
                <div className="flex justify-center items-end gap-4 h-72">
                    {hand.map((card, i) => (
                        <CardComponent key={i} card={card} onPlay={() => playCard(card, i)} canPlay={player.energy >= card.cost} />
                    ))}
                </div>
                {/* Player Stats & Controls */}
                <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2 text-lg font-bold text-red-400">
                            <Heart /> {player.health}/{player.maxHealth}
                        </div>
                        {player.block > 0 && <div className="flex items-center gap-2 text-lg font-bold text-blue-400"><Shield /> {player.block}</div>}
                    </div>

                    <div className="flex gap-4 items-center">
                        <div className="flex items-center justify-center h-16 w-16 rounded-full border-4 border-yellow-500 bg-slate-900">
                            <span className="text-4xl font-bold text-yellow-400">{player.energy}</span>
                            <Zap className="h-6 w-6 text-yellow-500 -ml-1" />
                        </div>
                         <div className="flex gap-2">
                             <div className="text-center">
                                <Package className="mx-auto" />
                                <span className="text-xs">{drawPile.length} Draw</span>
                            </div>
                             <div className="text-center">
                                <Repeat className="mx-auto" />
                                <span className="text-xs">{discardPile.length} Discard</span>
                            </div>
                         </div>
                    </div>

                    <Button size="lg" onClick={endTurn}>End Turn</Button>
                </div>
            </div>
        </div>
    );
}
