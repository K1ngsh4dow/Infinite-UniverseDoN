
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getFriendlyAIError } from '@/lib/utils';
import { generateLifeEvent, GenerateLifeEventOutput } from '@/ai/flows/generate-life-event-flow';
import { User, Heart, Utensils, Users, Gamepad2, BrainCircuit, Loader2, Save, Zap, Pause, Play, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// State Types
interface Echo {
    name: string;
    personality: string;
    needs: {
        energy: number;
        hunger: number;
        social: number;
        fun: number;
    };
}
type GamePhase = 'SETUP' | 'SIMULATING' | 'PAUSED';
interface LogEntry {
    timestamp: number;
    message: string;
}

const STORAGE_KEY = 'echoes-of-infinity-save';

export function EchoesOfInfinity() {
    const { toast } = useToast();
    const isOnline = useOnlineStatus();
    
    const [phase, setPhase] = useState<GamePhase>('SETUP');
    const [echo, setEcho] = useState<Echo | null>(null);
    const [log, setLog] = useState<LogEntry[]>([]);
    const [isLoadingEvent, setIsLoadingEvent] = useState(false);

    const [newName, setNewName] = useState('');
    const [newPersonality, setNewPersonality] = useState('');
    
    const gameTickRef = useRef<NodeJS.Timeout>();
    const eventCooldownRef = useRef(false);

    // Load game state from localStorage on mount
    useEffect(() => {
        try {
            const savedGame = localStorage.getItem(STORAGE_KEY);
            if (savedGame) {
                const { savedEcho, savedLog } = JSON.parse(savedGame);
                if (savedEcho) {
                    setEcho(savedEcho);
                    setLog(savedLog || []);
                    setPhase('PAUSED'); // Start paused to let user resume
                }
            }
        } catch (e) {
            console.error("Failed to load Echoes of Infinity save.", e);
        }
    }, []);
    
    const saveGame = useCallback(() => {
        if (!echo) return;
        try {
            const gameState = { savedEcho: echo, savedLog: log };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
            toast({ title: 'Game Saved', description: 'Your Echo\'s progress has been saved.' });
        } catch (e) {
            console.error("Failed to save Echoes of Infinity state.", e);
        }
    }, [echo, log, toast]);

    const addLogEntry = (message: string) => {
        setLog(prev => [{ timestamp: Date.now(), message }, ...prev.slice(0, 49)]);
    };

    const handleCreateEcho = () => {
        if (!newName.trim() || !newPersonality.trim()) {
            toast({ title: "Name and Personality are required.", variant: 'destructive' });
            return;
        }
        const newEcho: Echo = {
            name: newName,
            personality: newPersonality,
            needs: { energy: 80, hunger: 70, social: 60, fun: 75 },
        };
        setEcho(newEcho);
        setLog([]);
        addLogEntry(`Echo ${newName} has been instantiated.`);
        setPhase('SIMULATING');
    };
    
    const applyNeedChange = (need: keyof Echo['needs'], change: number) => {
        setEcho(prev => {
            if (!prev) return null;
            return {
                ...prev,
                needs: {
                    ...prev.needs,
                    [need]: Math.max(0, Math.min(100, prev.needs[need] + change)),
                }
            };
        });
    };

    // Game Loop
    useEffect(() => {
        if (phase !== 'SIMULATING') {
            if (gameTickRef.current) clearInterval(gameTickRef.current);
            return;
        }

        gameTickRef.current = setInterval(() => {
            if (!echo) return;
            
            // Decay needs
            applyNeedChange('energy', -0.5);
            applyNeedChange('hunger', -0.7);
            applyNeedChange('social', -0.4);
            applyNeedChange('fun', -0.6);

            // Trigger random AI event if not on cooldown
            if (isOnline && !eventCooldownRef.current && Math.random() < 0.1) {
                eventCooldownRef.current = true;
                setIsLoadingEvent(true);
                generateLifeEvent({ personality: echo.personality, needs: echo.needs })
                    .then(event => {
                        addLogEntry(`[EVENT] ${event.eventTitle}: ${event.eventDescription}`);
                        event.effects.forEach(effect => {
                            applyNeedChange(effect.need, effect.change);
                        });
                    })
                    .catch(e => {
                        console.error("Life event generation failed:", e);
                    })
                    .finally(() => {
                        setIsLoadingEvent(false);
                        // Set cooldown for 20 seconds
                        setTimeout(() => { eventCooldownRef.current = false; }, 20000);
                    });
            }
        }, 5000); // Tick every 5 seconds

        return () => clearInterval(gameTickRef.current);
    }, [phase, isOnline, echo]);

    const handlePlayerAction = (need: keyof Echo['needs'], amount: number, message: string) => {
        applyNeedChange(need, amount);
        addLogEntry(message);
    }

    if (phase === 'SETUP') {
        return (
            <div className="flex h-full items-center justify-center p-8 bg-muted">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle>Instantiate an Echo</CardTitle>
                        <CardDescription>Define the core personality of your new digital being.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="echo-name">Name</Label>
                            <Input id="echo-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g., Kael" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="echo-personality">Personality Prompt</Label>
                            <Textarea id="echo-personality" value={newPersonality} onChange={e => setNewPersonality(e.target.value)} placeholder="A melancholic artist who loves rain and jazz..." />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleCreateEcho} className="w-full" disabled={!isOnline}>
                            {isOnline ? <BrainCircuit className="mr-2 h-4 w-4" /> : <WifiOff className="mr-2 h-4 w-4" />}
                            {isOnline ? 'Instantiate' : 'Unavailable Offline'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }
    
    if (!echo) {
        return <div className="p-4">Loading Echo...</div>
    }
    
    const needsConfig = [
        { key: 'energy' as const, label: 'Energy', icon: Zap, color: 'bg-yellow-400', buttonLabel: 'Rest', verb: 'rested' },
        { key: 'hunger' as const, label: 'Hunger', icon: Utensils, color: 'bg-orange-400', buttonLabel: 'Feed', verb: 'ate a nutrient paste' },
        { key: 'social' as const, label: 'Social', icon: Users, color: 'bg-blue-400', buttonLabel: 'Socialize', verb: 'chatted with a friend' },
        { key: 'fun' as const, label: 'Fun', icon: Gamepad2, color: 'bg-pink-400', buttonLabel: 'Play', verb: 'played a game' }
    ];

    const getPulseColor = () => {
        const lowestNeed = Math.min(...Object.values(echo.needs));
        if (lowestNeed < 25) return 'animate-pulse border-red-500/80';
        if (lowestNeed < 50) return 'animate-pulse border-yellow-500/80';
        return 'border-primary/50';
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 h-full bg-background p-4 gap-4">
            {/* Left Panel: Actions & Info */}
            <div className="lg:col-span-1 flex flex-col gap-4">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl"><User />{echo.name}</CardTitle>
                        <CardDescription className="italic">"{echo.personality}"</CardDescription>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader><CardTitle className="text-lg">Player Actions</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                        {needsConfig.map(need => (
                            <Button key={need.key} variant="outline" onClick={() => handlePlayerAction(need.key, 25, `${echo.name} ${need.verb}.`)}>{need.buttonLabel}</Button>
                        ))}
                    </CardContent>
                </Card>
                 <Card className="mt-auto">
                    <CardHeader><CardTitle className="text-lg">System Control</CardTitle></CardHeader>
                    <CardContent className="flex flex-col gap-2">
                         <Button variant="secondary" className="w-full" onClick={() => setPhase(phase === 'SIMULATING' ? 'PAUSED' : 'SIMULATING')}>
                            {phase === 'SIMULATING' ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                            {phase === 'SIMULATING' ? 'Pause Simulation' : 'Resume Simulation'}
                        </Button>
                        <Button className="w-full" onClick={saveGame}><Save className="mr-2 h-4 w-4" /> Save & Exit</Button>
                    </CardContent>
                </Card>
            </div>

            {/* Center Panel: Echo Visualization & Needs */}
             <div className="lg:col-span-2 flex flex-col gap-4 items-center justify-center p-4">
                 <div className={cn("relative flex items-center justify-center w-64 h-64 rounded-full bg-muted border-4", getPulseColor())}>
                    <BrainCircuit className="h-32 w-32 text-primary" />
                    <div className="absolute top-0 right-0 p-2 bg-background/80 rounded-full text-xs text-muted-foreground flex items-center gap-1">
                        {isOnline ? (
                            <>
                                <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                                {phase === 'SIMULATING' ? 'Online' : 'Paused'}
                            </>
                        ) : (
                            <>
                                <span className="relative flex h-2 w-2"><span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span></span>
                                Offline
                            </>
                        )}
                        
                    </div>
                </div>
                 <Card className="w-full max-w-md">
                    <CardHeader><CardTitle>Echo Core Needs</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                         {needsConfig.map(need => (
                            <div key={need.key}>
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="flex items-center gap-2 text-sm">
                                        <need.icon className="h-4 w-4" />
                                        {need.label}
                                    </Label>
                                    <span className="text-sm font-mono text-muted-foreground">{Math.round(echo.needs[need.key])}%</span>
                                </div>
                                <Progress value={echo.needs[need.key]} className={`h-3 [&>div]:${need.color}`} />
                            </div>
                        ))}
                    </CardContent>
                 </Card>
            </div>

            {/* Right Panel: Event Log */}
            <div className="lg:col-span-1 flex flex-col h-full">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold">Event Log</h3>
                    {isLoadingEvent && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                </div>
                <ScrollArea className="flex-grow h-0 bg-muted rounded-lg">
                    <div className="p-3 space-y-3 text-sm">
                        {!isOnline && (
                             <div className="text-yellow-400 font-semibold">[SYSTEM] Offline: AI life events are paused.</div>
                        )}
                        {log.map(entry => (
                            <div key={entry.timestamp}>
                                <span className="text-muted-foreground mr-2">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                <span className={cn(entry.message.startsWith('[EVENT]') && 'font-semibold text-primary')}>{entry.message}</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
}
