
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { KeyRound, Loader2, BrainCircuit, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/context/WalletContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { getFriendlyAIError } from '@/lib/utils';
import { generateConsolationPuzzle, type GenerateConsolationPuzzleOutput } from '@/ai/flows/generate-consolation-puzzle';
import { generateImage } from '@/ai/flows/generate-image';
import { encryptBlob } from '@/lib/crypto';
import { useCreations } from '@/context/CreationsContext';

const CORRECT_PASSWORD = 'don';
const WELCOME_BONUS_KEY = 'iu-welcome-bonus-claimed';
const CONSOLATION_REWARD = 21;

export default function UnlockPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { address, credit } = useWallet();
  const { addCreation } = useCreations();

  // --- Puzzle State ---
  const [isPuzzleDialogOpen, setIsPuzzleDialogOpen] = useState(false);
  const [puzzleData, setPuzzleData] = useState<GenerateConsolationPuzzleOutput | null>(null);
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  const resetPuzzle = () => {
    setIsPuzzleDialogOpen(false);
    setPuzzleData(null);
    setPuzzleAnswer('');
    setIsPuzzleSolved(false);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
        setError('Master key cannot be empty.');
        return;
    }

    setIsLoading(true);
    
    if (password === CORRECT_PASSWORD) {
        // Correct password logic - Removed setTimeout for instant login
        toast({ title: "Access Granted", description: "Welcome to Infinite Universe." });

        const bonusClaimed = localStorage.getItem(WELCOME_BONUS_KEY);
        if (!bonusClaimed) {
            const bonusAmount = 1000;
            credit('DoN', bonusAmount, 'Welcome Bonus');
            toast({ title: "Bonus Awarded!", description: `You received ${bonusAmount} DoN.` });
            localStorage.setItem(WELCOME_BONUS_KEY, 'true');
        }

        router.push('/desktop');
    } else {
        // Failed password logic - trigger puzzle
        if (!address) {
            setError('A wallet address is required to generate a consolation puzzle.');
            setIsLoading(false);
            return;
        }
        setIsGeneratingPuzzle(true);
        toast({ title: 'Incorrect Key...', description: 'Engaging consolation protocol...' });
        
        try {
            const puzzle = await generateConsolationPuzzle({ userAddress: address });
            setPuzzleData(puzzle);
            setIsPuzzleSolved(false);
            setPuzzleAnswer('');
            setIsPuzzleDialogOpen(true);
        } catch (err) {
            setError('Failed to generate consolation puzzle. Please try again.');
            toast({ title: 'Error', description: getFriendlyAIError(err), variant: 'destructive' });
        } finally {
            setIsGeneratingPuzzle(false);
            setIsLoading(false);
        }
    }
  };

  const handleCheckAnswer = () => {
    if (!puzzleData) return;
    if (puzzleAnswer.trim().toLowerCase() === puzzleData.puzzleSolution.toLowerCase()) {
        toast({ title: "Correct!", description: "The Consolation Fragment can now be forged." });
        setIsPuzzleSolved(true);
    } else {
        toast({ title: "Incorrect", description: "That's not the right answer. Try again.", variant: 'destructive' });
    }
  }

  const handleMintNft = async () => {
    if (!puzzleData || !address) return;
    setIsMinting(true);
    toast({ title: "Forging Consolation Fragment...", description: "Generating unique artwork..." });

    try {
        const imageResult = await generateImage({ prompt: puzzleData.nftImagePrompt });
        toast({ title: "Artwork Generated", description: `Binding NFT to your address...` });

        const response = await fetch(imageResult.imageUrl);
        const imageBlob = await response.blob();
        
        const encryptedNftBlob = await encryptBlob(imageBlob, address);
        
        const nftFileName = `${puzzleData.nftTitle.replace(/[\s/\\?%*:|"<>]/g, '_')}.nft.don`;
        await addCreation({
            type: 'file',
            title: nftFileName,
            path: '/',
            prompt: `Consolation NFT for solving: "${puzzleData.puzzleTitle}"`,
            data: encryptedNftBlob,
        });

        credit('DoN', CONSOLATION_REWARD, `Consolation Puzzle Solved: ${puzzleData.nftTitle}`);

        toast({
            title: "Consolation Fragment Forged!",
            description: `"${nftFileName}" saved to your drive. You were rewarded ${CONSOLATION_REWARD} DoN.`,
        });

        resetPuzzle();

    } catch (e) {
        toast({ title: "Minting Failed", description: getFriendlyAIError(e), variant: "destructive" });
    } finally {
        setIsMinting(false);
    }
  };

  const isFormDisabled = isLoading || isGeneratingPuzzle;

  return (
    <>
    <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-background p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Glow Effect */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-[40vw] h-[40vh] bg-primary/20 blur-3xl rounded-full"></div>

      <Card className="w-full max-w-sm z-10 animate-in fade-in-50 zoom-in-95">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Unlock Infinite Universe</CardTitle>
          <CardDescription>Enter your master key to access the secure enclave.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUnlock} className="space-y-4">
            <Input
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isFormDisabled}
              className="text-center text-lg tracking-widest"
              aria-invalid={!!error}
            />
            {error && <p className="text-destructive text-sm text-center px-4 animate-in fade-in-0">{error}</p>}
            <Button type="submit" className="w-full" disabled={isFormDisabled}>
              {(isLoading || isGeneratingPuzzle) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isGeneratingPuzzle ? 'Initializing Protocol...' : isLoading ? 'Decrypting...' : 'Unlock'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full text-center text-muted-foreground text-xs">
            <p>&copy; 2025 DoN</p>
          </div>
        </CardFooter>
      </Card>
    </div>

    <Dialog open={isPuzzleDialogOpen} onOpenChange={open => !open && resetPuzzle()}>
        <DialogContent className="max-w-xl">
            <DialogHeader>
                <DialogTitle>Consolation Protocol</DialogTitle>
                  <DialogDescription>
                    Key incorrect. A test of worthiness is presented. Solve the puzzle to forge a unique Consolation Fragment NFT.
                  </DialogDescription>
            </DialogHeader>
            {puzzleData && (
                <div className="space-y-4 pt-4">
                    <h3 className="font-semibold text-lg">{puzzleData.puzzleTitle}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap text-sm">{puzzleData.puzzleText}</p>
                    <Separator />
                     {isPuzzleSolved ? (
                        <div className="p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-300 text-sm font-semibold flex items-center gap-2">
                            <Check className="h-4 w-4" /> Correct! The Consolation Fragment is ready to be forged.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label htmlFor="puzzle-answer">Your Answer</Label>
                            <div className="flex gap-2">
                                <Input
                                  id="puzzle-answer"
                                  value={puzzleAnswer}
                                  onChange={e => setPuzzleAnswer(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleCheckAnswer()}
                                  placeholder="Enter the solution..."
                                />
                                <Button onClick={handleCheckAnswer}>Check</Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            <DialogFooter className="sm:justify-between items-center gap-4 pt-4">
                <p className="text-xs text-muted-foreground text-left">
                  Reward: 1 NFT, {CONSOLATION_REWARD} DoN.
                </p>
                <div className="flex gap-2">
                    <DialogClose asChild><Button variant="ghost" disabled={isMinting}>Close</Button></DialogClose>
                    <Button onClick={handleMintNft} disabled={isMinting || !isPuzzleSolved}>
                        {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isMinting ? 'Forging...' : 'Forge Fragment'}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
