
'use client';

import React, { useState } from 'react';
import {
  Loader2, Mountain, Wand2, KeyRound, Copy, Check, Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getFriendlyAIError } from '@/lib/utils';
import { useCreations } from '@/context/CreationsContext';
import { encryptBlob } from '@/lib/crypto';
import { forgeWorld, ForgeWorldOutput } from '@/ai/flows/forge-world-flow';
import { generateImage } from '@/ai/flows/generate-image';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/context/WalletContext';
import { useSpark } from '@/context/SparkContext';

// const GAS_FEE = 10;
const MINT_REWARD = 25;

export function Terraformer() {
    const { toast } = useToast();
    const isOnline = useOnlineStatus();
    const { addCreation } = useCreations();
    const { credit } = useWallet();
    const { spendSpark } = useSpark();

    const [prompt, setPrompt] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [isMinting, setIsMinting] = useState(false);
    const [worldResult, setWorldResult] = useState<ForgeWorldOutput | null>(null);
    const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
    
    const [puzzleAnswer, setPuzzleAnswer] = useState('');
    const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
    const [hasCopied, setHasCopied] = useState(false);
    
    const resetPuzzle = () => {
        setPuzzleAnswer('');
        setIsPuzzleSolved(false);
    }

    const handleGenerateWorld = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOnline) {
            toast({ title: "You are offline", description: "Terraforming requires an internet connection.", variant: "destructive" });
            return;
        }
        if (!prompt) {
            toast({ title: "Prompt is required", variant: "destructive" });
            return;
        }
        
        // if (!spendSpark(GAS_FEE)) return;

        setIsGenerating(true);
        setWorldResult(null);
        resetPuzzle();

        try {
            const result = await forgeWorld({ prompt });
            setWorldResult(result);
            setIsResultDialogOpen(true);
        } catch (error) {
            toast({ title: "Error Generating World", description: getFriendlyAIError(error), variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };
    
    const handleCheckAnswer = () => {
        if (!worldResult) return;
        if (puzzleAnswer.trim().toLowerCase() === worldResult.puzzleSolution.toLowerCase()) {
            toast({ title: "Correct!", description: "The Genesis Block can now be forged." });
            setIsPuzzleSolved(true);
        } else {
            toast({ title: "Incorrect", description: "That's not the right answer. Try again.", variant: 'destructive' });
        }
    }

    const handleForgeGenesisBlock = async () => {
        if (!worldResult) return;
        setIsMinting(true);
        toast({ title: "Forging Genesis Block...", description: "Generating unique artwork for your new world." });

        try {
            const imageResult = await generateImage({ prompt: worldResult.genesisBlockImagePrompt });
            toast({ title: "Artwork Generated", description: "Encrypting Genesis Block with the puzzle's solution..." });

            const response = await fetch(imageResult.imageUrl);
            const imageBlob = await response.blob();
            
            const encryptedNftBlob = await encryptBlob(imageBlob, worldResult.puzzleSolution);
            
            const nftFileName = `GenesisBlock_${worldResult.worldName.replace(/[\s/\\?%*:|"<>]/g, '_')}.nft.enc`;
            await addCreation({
                type: 'file',
                title: nftFileName,
                path: '/',
                prompt: `Genesis Block for world: "${worldResult.worldName}"`,
                data: encryptedNftBlob,
            });
            
            credit('DoN', MINT_REWARD, `Genesis Block Forging: ${worldResult.worldName}`);

            toast({
                title: "Genesis Block Forged & Secured!",
                description: `"${nftFileName}" has been saved. You were rewarded ${MINT_REWARD} DoN.`,
            });
            setIsResultDialogOpen(false);
        } catch (e) {
            toast({ title: "Forging Failed", description: getFriendlyAIError(e), variant: "destructive" });
        } finally {
            setIsMinting(false);
        }
    };

    return (
        <ScrollArea className="h-full">
            <div className="p-6">
                 <div className="space-y-8">
                    <form onSubmit={handleGenerateWorld} className="space-y-4">
                        <Textarea
                            placeholder={isOnline ? "e.g., A world of floating islands made of crystal, with rivers of liquid light." : "Terraforming is unavailable offline."}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="min-h-[100px] text-base"
                            disabled={isGenerating || !isOnline}
                        />
                        <Button type="submit" disabled={isGenerating || !isOnline}>
                            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                            {isGenerating ? 'Terraforming...' : `Generate World Blueprint`}
                        </Button>
                    </form>

                    {isGenerating && (
                        <Card>
                            <CardHeader>
                                <Skeleton className="h-8 w-3/4" />
                                <Skeleton className="h-4 w-1/2 mt-2" />
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Skeleton className="h-48 w-full" />
                                    <Skeleton className="h-48 w-full" />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Dialog open={isResultDialogOpen} onOpenChange={setIsResultDialogOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-2xl">
                            <Mountain className="h-6 w-6" />
                            World Blueprint: {worldResult?.worldName}
                        </DialogTitle>
                            <DialogDescription>
                            The foundational elements of your new universe are complete. Solve the puzzle to forge the Genesis Block and earn {MINT_REWARD} DoN.
                            </DialogDescription>
                    </DialogHeader>
                    {worldResult && (
                        <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 pt-4">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">World Overview</h3>
                                <p className="text-muted-foreground whitespace-pre-wrap text-sm">{worldResult.worldDescription}</p>
                                <Separator />
                                <h3 className="font-semibold text-lg">Genesis Puzzle</h3>
                                <p className="font-medium">{worldResult.puzzleTitle}</p>
                                <p className="text-muted-foreground whitespace-pre-wrap text-sm">{worldResult.puzzleText}</p>
                                {isPuzzleSolved ? (
                                    <div className="p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-300 text-sm font-semibold flex items-center gap-2">
                                        <Check className="h-4 w-4" /> Correct! The Genesis Block is ready to be forged.
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <Input value={puzzleAnswer} onChange={e => setPuzzleAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCheckAnswer()} placeholder="Enter the solution..." />
                                        <Button onClick={handleCheckAnswer}>Check</Button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Core Materials</h3>
                                <ScrollArea className="h-72">
                                    <div className="space-y-3 pr-4">
                                    {worldResult.materials.map((material, index) => (
                                        <div key={index} className="p-3 border rounded-md bg-muted/50">
                                            <p className="font-semibold">{material.materialName}</p>
                                            <p className="text-xs text-muted-foreground">{material.description}</p>
                                            <p className="text-xs text-primary/80 italic mt-1">"{material.textureImagePrompt}"</p>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost" disabled={isMinting}>Close</Button></DialogClose>
                        <Button onClick={handleForgeGenesisBlock} disabled={isMinting || !isPuzzleSolved}>
                            {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isMinting ? 'Forging...' : 'Forge Genesis Block'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
                </Dialog>
            </div>
        </ScrollArea>
    );
}
