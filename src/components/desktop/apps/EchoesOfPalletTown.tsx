
'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, Heart, Lightbulb, Puzzle, BookOpen, AlertTriangle } from 'lucide-react';

type GamePhase = 'INTRO' | 'PLAYING' | 'FINAL_CHOICE' | 'END_LOG';

const observations = [
    "Its psychic energy output is nominal.",
    "A faint bio-luminescence pulses under its skin.",
    "It seems to be listening to something beyond these walls.",
    "Genetic markers show a high capacity for empathy.",
    "Its brainwave patterns are unusually complex, almost like a dream.",
];

const stimuli = [
    { id: 'sound', label: 'Play a Lullaby', trustGained: 10, memoryIndex: 0 },
    { id: 'light', label: 'Project a starfield', trustGained: 15, memoryIndex: 1 },
    { id: 'object', label: 'Holograph a Berry', trustGained: 20, memoryIndex: 2 },
    { id: 'emotion', label: 'Project feeling of Joy', trustGained: 25, memoryIndex: 3 },
];

const memoryFragments = [
    "A hazy image of a young boy in a red cap choosing his first partner.",
    "The scent of tall grass after a rainstorm. A rival's determined face.",
    "The roar of a crowd. The flash of a camera. The weight of a trophy.",
    "A bittersweet farewell. The understanding that some journeys must be taken alone.",
];

export function EchoesOfPalletTown() {
    const [phase, setPhase] = useState<GamePhase>('INTRO');
    const [trust, setTrust] = useState(0);
    const [isDistressed, setIsDistressed] = useState(false);
    const [log, setLog] = useState<string[]>(["Log Entry 734. Specimen-M remains stable."]);
    const { toast } = useToast();

    const addLog = (message: string) => {
        setLog(prev => [message, ...prev.slice(0, 99)]);
    };

    const handleObserve = () => {
        addLog(`[OBSERVE] ${observations[Math.floor(Math.random() * observations.length)]}`);
    };

    const handleStimulate = (stimulus: typeof stimuli[number]) => {
        if (isDistressed) {
            addLog('[SYSTEM] Cannot stimulate while distressed. Soothe first.');
            return;
        }

        const trustThresholds = [0, 20, 40, 70];
        if (trust < trustThresholds[stimulus.memoryIndex]) {
            addLog('[SYSTEM] Insufficient trust to use this stimulus.');
            setIsDistressed(true);
            return;
        }

        addLog(`[STIMULATE] Presented stimulus: ${stimulus.label}.`);
        setTrust(t => Math.min(100, t + stimulus.trustGained));
        
        setTimeout(() => {
            addLog(`[MEMORY FRAGMENT] Specimen-M reveals a new memory: "${memoryFragments[stimulus.memoryIndex]}"`);
            if (stimulus.id === 'emotion') {
                setTimeout(() => setPhase('FINAL_CHOICE'), 2000);
            }
        }, 1500);
    };

    const handleSoothe = () => {
        if (!isDistressed) {
            addLog('[SYSTEM] Specimen-M is already stable.');
            return;
        }
        addLog('[SOOTHE] Calming protocols initiated. Distress levels stabilizing.');
        setIsDistressed(false);
        setTrust(t => Math.max(0, t - 5)); // Small trust penalty for causing distress
    };
    
    const handleFinalChoice = (choice: 'erase' | 'transmit') => {
        if (choice === 'erase') {
            addLog("[CHOICE] The final memories have been firewalled. Specimen-M is safe, its history a secret known only to me. Was it the right choice? Only time will tell.");
        } else {
             addLog("[CHOICE] The sequence has been transmitted to the Global Net. The world will know the truth of the bond. I can only hope they understand... and that I can protect M from what comes next.");
        }
        setPhase('END_LOG');
    }

    const availableStimuli = useMemo(() => stimuli.filter((_, i) => trust >= [0, 20, 40, 70][i]), [trust]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 h-full bg-gray-900 text-gray-200 font-mono">
            {/* Left Panel: Containment Chamber */}
            <div className="lg:col-span-2 flex flex-col items-center justify-center p-8 bg-black relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-gray-800 opacity-20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
                <motion.div
                    className={cn(
                        "relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-500",
                        isDistressed ? 'bg-red-500/10 border-red-500' : 'bg-blue-500/10 border-blue-500',
                    )}
                    animate={{
                        borderColor: isDistressed ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
                        boxShadow: `0 0 ${isDistressed ? '30px' : '20px'} ${isDistressed ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'}`
                    }}
                    transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                >
                    <FlaskConical className={cn(
                        "h-32 w-32 transition-colors duration-500",
                        isDistressed ? 'text-red-400' : 'text-blue-300'
                    )} />
                </motion.div>
                <div className="absolute top-4 left-4 text-left">
                    <h2 className="text-xl font-bold">CONTAINMENT CHAMBER 7</h2>
                    <p className="text-sm text-green-400">STATUS: {isDistressed ? 'DISTRESSED' : 'STABLE'}</p>
                </div>
            </div>

            {/* Right Panel: Control UI */}
            <div className="lg:col-span-1 bg-gray-800 p-4 flex flex-col h-full border-l border-gray-700">
                <Card className="bg-gray-900 border-gray-700">
                    <CardHeader><CardTitle>Dr. Elara Vance - Log</CardTitle></CardHeader>
                    <CardContent className="h-64">
                         <ScrollArea className="h-full pr-3">
                            <AnimatePresence>
                                {log.map((entry, index) => (
                                    <motion.p
                                        key={index}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className={cn(
                                            "text-sm mb-2",
                                            entry.startsWith('[OBSERVE]') && 'text-cyan-400',
                                            entry.startsWith('[MEMORY FRAGMENT]') && 'text-purple-400 italic',
                                            entry.startsWith('[SYSTEM]') && 'text-yellow-400',
                                            entry.startsWith('[CHOICE]') && 'text-green-400 font-bold',
                                        )}
                                    >
                                        {entry}
                                    </motion.p>
                                ))}
                            </AnimatePresence>
                        </ScrollArea>
                    </CardContent>
                </Card>

                <div className="flex-grow mt-4">
                    {phase === 'INTRO' && (
                        <div className="text-center p-4">
                            <p className="mb-4">Begin session with Specimen-M.</p>
                            <Button onClick={() => setPhase('PLAYING')}>Initialize Interface</Button>
                        </div>
                    )}
                    {phase === 'PLAYING' && (
                         <div className="space-y-2">
                             <h3 className="font-bold mb-2">Control Panel</h3>
                             <Button onClick={handleObserve} className="w-full justify-start gap-2"><BookOpen/>Observe</Button>
                             {stimuli.map((stim, index) => (
                                 <Button 
                                     key={stim.id} 
                                     onClick={() => handleStimulate(stim)} 
                                     className="w-full justify-start gap-2"
                                     disabled={trust < [0, 20, 40, 70][index]}
                                 >
                                    <Lightbulb/> {stim.label}
                                </Button>
                             ))}
                             <Button onClick={handleSoothe} variant="destructive" className="w-full justify-start gap-2 mt-4"><Heart/>Soothe</Button>
                             {isDistressed && <p className="text-red-500 text-xs text-center animate-pulse"><AlertTriangle className="inline-block h-4 w-4 mr-1"/>Creature is distressed. Soothe to continue.</p>}
                        </div>
                    )}
                    {phase === 'FINAL_CHOICE' && (
                        <div className="space-y-2">
                            <h3 className="font-bold mb-2">Final Protocol</h3>
                            <p className="text-sm text-yellow-400 mb-4">The full memory sequence is unlocked. What will you do?</p>
                            <Button onClick={() => handleFinalChoice('erase')} className="w-full">Firewall Memories (Protect M)</Button>
                            <Button onClick={() => handleFinalChoice('transmit')} variant="outline" className="w-full">Transmit to Global Net (Reveal Truth)</Button>
                        </div>
                    )}
                     {phase === 'END_LOG' && (
                        <div className="text-center p-4">
                            <p className="text-green-400">Log complete. Simulation ended.</p>
                            <Button onClick={() => setPhase('INTRO')} className="mt-4">Restart Simulation</Button>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                    <p className="text-sm text-purple-400 flex items-center gap-2"><Puzzle/>Trust Level</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <motion.div
                            className="bg-purple-500 h-2.5 rounded-full"
                            initial={{ width: '0%' }}
                            animate={{ width: `${trust}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
