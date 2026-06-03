
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Loader2, AlertCircle, MoreHorizontal, GitFork, Check,
  BrainCircuit, Sparkles, Database, WifiOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { app, db, auth, firebaseConfig } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Separator } from '@/components/ui/separator';
import { generateGenesisPuzzle, GenerateGenesisPuzzleOutput } from '@/ai/flows/generate-genesis-puzzle';
import { getFriendlyAIError } from '@/lib/utils';
import { generateImage } from '@/ai/flows/generate-image';
import { useCreations } from '@/context/CreationsContext';
import { encryptBlob } from '@/lib/crypto';
import { useWallet } from '@/context/WalletContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useSpark } from '@/context/SparkContext';
import { useOnlineStatus } from '@/hooks/use-online-status';

const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'YOUR_API_KEY';
const LOCAL_STORAGE_KEY = 'infinite-universe-local-copilots';
const MINTING_REWARD = 100;
// const CREATION_GAS_FEE = 5;

interface Copilot {
  id: string; 
  name: string;
  description: string;
  systemPrompt?: string; 
  type?: 'code' | 'no-code';
  ownerId?: string | null;
  isFeatured?: boolean;
}

export function Copilots() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [myCopilots, setMyCopilots] = useState<Copilot[]>([]);
  const [featuredCopilots, setFeaturedCopilots] = useState<Copilot[]>([]);
  const [loadingMyCopilots, setLoadingMyCopilots] = useState(true);
  const [loadingFeaturedCopilots, setLoadingFeaturedCopilots] = useState(true);
  
  const [newCopilotName, setNewCopilotName] = useState('');
  const [newCopilotDescription, setNewCopilotDescription] = useState('');
  const [newCopilotSystemPrompt, setNewCopilotSystemPrompt] = useState('');
  const [newCopilotType, setNewCopilotType] = useState<'code' | 'no-code'>('no-code');
  const [isCreatingCopilot, setIsCreatingCopilot] = useState(false);
  const [isForkingCopilot, setIsForkingCopilot] = useState(false);
  const [showCreateCopilotDialog, setShowCreateCopilotDialog] = useState(false);

  const { toast } = useToast();
  const { addCreation } = useCreations();
  const { credit } = useWallet();
  const { spendSpark } = useSpark();
  const isOnline = useOnlineStatus();

  // --- PUZZLE STATE ---
  const [isGeneratingPuzzle, setIsGeneratingPuzzle] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [puzzleResult, setPuzzleResult] = useState<GenerateGenesisPuzzleOutput | null>(null);
  const [isPuzzleDialogOpen, setIsPuzzleDialogOpen] = useState(false);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);

  // Combined effect for loading data
  useEffect(() => {
    if (isFirebaseConfigured && isOnline) {
      // Firebase Mode
      const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setCurrentUser(user);
        if (!user) setLoadingMyCopilots(false);
      });

      const qFeatured = query(collection(db, 'copilots'), where('isFeatured', '==', true));
      const unsubscribeFeatured = onSnapshot(qFeatured, (snapshot) => {
        const copilotsData: Copilot[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Copilot[];
        setFeaturedCopilots(copilotsData);
        setLoadingFeaturedCopilots(false);
      }, (err) => {
        console.error("Error fetching featured copilots:", err);
        setLoadingFeaturedCopilots(false);
      });

      let unsubscribeMyCopilots = () => {};
      if (currentUser) {
        const qMy = query(collection(db, 'copilots'), where('ownerId', '==', currentUser.uid));
        unsubscribeMyCopilots = onSnapshot(qMy, (snapshot) => {
          const copilotsData: Copilot[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Copilot[];
          setMyCopilots(copilotsData);
          setLoadingMyCopilots(false);
        }, (err) => {
          console.error("Error fetching my copilots:", err);
          setLoadingMyCopilots(false);
        });
      } else {
        setLoadingMyCopilots(false);
        setMyCopilots([]);
      }

      return () => {
        unsubscribeAuth();
        unsubscribeFeatured();
        unsubscribeMyCopilots();
      };
    } else {
      // Local Mode
      setLoadingMyCopilots(true);
      try {
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        setMyCopilots(localData ? JSON.parse(localData) : []);
      } catch (e) {
        console.error("Failed to load local copilots", e);
        setMyCopilots([]);
      }
      setLoadingMyCopilots(false);
      setLoadingFeaturedCopilots(false); // No featured copilots in local mode
    }
  }, [isFirebaseConfigured, currentUser, isOnline]);
  
  const resetCreateDialog = () => {
    setNewCopilotName('');
    setNewCopilotDescription('');
    setNewCopilotSystemPrompt('');
    setNewCopilotType('no-code');
  }

  const resetPuzzleState = () => {
    setPuzzleResult(null);
    setPuzzleAnswer('');
    setIsPuzzleSolved(false);
  };

  const handleCreateCopilotLocal = async () => {
    if (!newCopilotName.trim() || !newCopilotDescription.trim()) {
      toast({ title: "Validation Error", description: "Name and description cannot be empty.", variant: "destructive" });
      return;
    }
    // if (!spendSpark(CREATION_GAS_FEE)) return;
    
    setIsCreatingCopilot(true);
    setShowCreateCopilotDialog(false);

    const newCopilot: Copilot = {
      id: `local-${Date.now()}`,
      name: newCopilotName,
      description: newCopilotDescription,
      systemPrompt: newCopilotSystemPrompt,
      type: newCopilotType,
      isFeatured: false,
      ownerId: 'local-user'
    };

    try {
      if (!isOnline) {
        throw new Error("Cannot create Genesis Puzzle while offline.");
      }
      const updatedCopilots = [...myCopilots, newCopilot];
      setMyCopilots(updatedCopilots);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCopilots));
      toast({ title: "Success", description: `Copilot "${newCopilotName}" created locally.` });

      setIsGeneratingPuzzle(true);
      toast({ title: "Initializing Genesis Protocol...", description: "Generating a unique puzzle for your new agent."});

      const puzzle = await generateGenesisPuzzle({
          copilotName: newCopilotName,
          copilotDescription: newCopilotDescription,
      });
      resetPuzzleState();
      setPuzzleResult(puzzle);
      setIsPuzzleDialogOpen(true);
      resetCreateDialog();

    } catch(e) {
      toast({ title: "Error", description: getFriendlyAIError(e), variant: "destructive" });
    } finally {
      setIsCreatingCopilot(false);
      setIsGeneratingPuzzle(false);
    }
  }

  const handleCreateCopilotFirebase = async () => {
    if (!currentUser) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!newCopilotName.trim() || !newCopilotDescription.trim()) {
      toast({ title: "Validation Error", description: "Name and description cannot be empty.", variant: "destructive" });
      return;
    }
    // if (!spendSpark(CREATION_GAS_FEE)) return;
    
    setIsCreatingCopilot(true);
    setShowCreateCopilotDialog(false);

    try {
      await addDoc(collection(db, 'copilots'), {
        name: newCopilotName,
        description: newCopilotDescription,
        systemPrompt: newCopilotSystemPrompt,
        type: newCopilotType,
        ownerId: currentUser.uid,
        isFeatured: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: "Success", description: `Copilot "${newCopilotName}" created.` });

      setIsGeneratingPuzzle(true);
      toast({ title: "Initializing Genesis Protocol...", description: "Generating a unique puzzle for your new agent."});

      const puzzle = await generateGenesisPuzzle({
          copilotName: newCopilotName,
          copilotDescription: newCopilotDescription,
      });
      resetPuzzleState();
      setPuzzleResult(puzzle);
      setIsPuzzleDialogOpen(true);
      resetCreateDialog();

    } catch (e) {
      console.error("Error adding document or puzzle: ", e);
      toast({ title: "Error", description: getFriendlyAIError(e), variant: "destructive" });
    } finally {
      setIsCreatingCopilot(false);
      setIsGeneratingPuzzle(false);
    }
  };

  const handleCreateCopilot = () => {
    if (isFirebaseConfigured && isOnline) {
      handleCreateCopilotFirebase();
    } else {
      handleCreateCopilotLocal();
    }
  };

  const handleForkCopilotLocal = (copilotToFork: Copilot) => {
    setIsForkingCopilot(true);
    try {
        const newCopilot = {
        ...copilotToFork,
        id: `local-${Date.now()}`,
        name: `Copy of ${copilotToFork.name}`.substring(0, 50),
        isFeatured: false,
        };
        const updatedCopilots = [...myCopilots, newCopilot];
        setMyCopilots(updatedCopilots);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedCopilots));
        toast({ title: "Success", description: `Copilot "${copilotToFork.name}" forked locally.` });
    } catch(e) {
        toast({ title: "Error", description: "Failed to fork the copilot.", variant: "destructive" });
    } finally {
        setIsForkingCopilot(false);
    }
  };
  
  const handleForkCopilotFirebase = async (copilotId: string) => {
    if (!currentUser) return;
    setIsForkingCopilot(true);
    try {
      const copilotRef = doc(db, 'copilots', copilotId);
      const copilotSnap = await getDoc(copilotRef);

      if (!copilotSnap.exists()) {
        toast({ title: "Error", description: "Copilot to fork not found.", variant: "destructive" });
        return;
      }

      const originalCopilot = copilotSnap.data();
      const newCopilotData = {
        ...originalCopilot,
        name: `Copy of ${originalCopilot.name}`.substring(0, 50),
        isFeatured: false,
        ownerId: currentUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, 'copilots'), newCopilotData);
      
      toast({ title: "Success", description: `Copilot "${originalCopilot.name}" forked.` });
    } catch (e) {
      console.error("Error forking copilot:", e);
      toast({ title: "Error", description: "Failed to fork the copilot.", variant: "destructive" });
    } finally {
      setIsForkingCopilot(false);
    }
  };

  const handleForkCopilot = (copilot: Copilot) => {
    if (isFirebaseConfigured && isOnline) {
        handleForkCopilotFirebase(copilot.id);
    } else {
        handleForkCopilotLocal(copilot);
    }
  }

  const handleCheckAnswer = () => {
    if (!puzzleResult) return;
    if (puzzleAnswer.trim().toLowerCase() === puzzleResult.puzzleSolution.toLowerCase()) {
        toast({ title: "Correct!", description: "You've solved the puzzle. The Genesis Block can now be forged." });
        setIsPuzzleSolved(true);
    } else {
        toast({ title: "Incorrect", description: "That's not the right answer. Try again.", variant: 'destructive' });
    }
  }

  const handleMintNft = async () => {
    if (!puzzleResult) return;
    setIsMinting(true);
    toast({ title: "Minting Genesis NFT...", description: "Generating unique artwork, this may take a moment." });

    try {
        const imageResult = await generateImage({ prompt: puzzleResult.nftImagePrompt });
        toast({ title: "Artwork Generated", description: "Encrypting NFT with the puzzle's solution..." });

        const response = await fetch(imageResult.imageUrl);
        const imageBlob = await response.blob();
        
        const encryptedNftBlob = await encryptBlob(imageBlob, puzzleResult.puzzleSolution);
        
        const nftFileName = `${puzzleResult.nftTitle.replace(/[\s/\\?%*:|"<>]/g, '_')}.nft.enc`;
        await addCreation({
            type: 'file',
            title: nftFileName,
            path: '/',
            prompt: `Genesis NFT for: "${puzzleResult.nftTitle}"`,
            data: encryptedNftBlob,
        });

        credit('DoN', MINTING_REWARD, `Genesis NFT Mint: ${puzzleResult.nftTitle}`);

        toast({
            title: "Genesis NFT Minted & Secured!",
            description: `"${nftFileName}" saved to drive. You were rewarded ${MINTING_REWARD} DoN.`,
        });

        setIsPuzzleDialogOpen(false);

    } catch (e) {
        toast({ title: "Minting Failed", description: getFriendlyAIError(e), variant: "destructive" });
    } finally {
        setIsMinting(false);
    }
  };
  
  const renderSkeletons = () => (
    Array.from({ length: 3 }).map((_, index) => (
      <Card key={index} className="mb-2">
        <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
        <CardContent><Skeleton className="h-4 w-full" /></CardContent>
      </Card>
    ))
  );

  const renderMyCopilotCard = (copilot: Copilot) => (
     <Card key={copilot.id} className="relative group">
        <div className="p-6 cursor-pointer" onClick={() => router.push(`/copilots/${copilot.id}`)}>
            <CardTitle>{copilot.name}</CardTitle>
            <CardDescription className="mt-2">{copilot.description}</CardDescription>
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isForkingCopilot}>
                         {isForkingCopilot ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => handleForkCopilot(copilot)} disabled={isFirebaseConfigured && !isOnline}>
                        <GitFork className="mr-2 h-4 w-4" /> Fork
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    </Card>
  );

  const isDialogDisabled = isCreatingCopilot || isGeneratingPuzzle;

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        {!isFirebaseConfigured ? (
            <Alert className="mb-6 border-blue-500 text-blue-800 dark:text-blue-200">
                <Database className="h-4 w-4 !text-blue-500" />
                <AlertTitle>Local Mode Active</AlertTitle>
                <AlertDescription>
                   Firebase is not configured. All copilots you create will be saved to this browser's local storage only.
                </AlertDescription>
            </Alert>
        ) : !isOnline && (
             <Alert className="mb-6 border-yellow-500 text-yellow-800 dark:text-yellow-200">
                <WifiOff className="h-4 w-4 !text-yellow-500" />
                <AlertTitle>Offline Mode</AlertTitle>
                <AlertDescription>
                   You are offline. Cloud features like forking and creating new copilots are disabled.
                </AlertDescription>
            </Alert>
        )}
        <div className="mb-6">
          <Dialog open={showCreateCopilotDialog} onOpenChange={setShowCreateCopilotDialog}>
            <DialogTrigger asChild>
              <Button disabled={isDialogDisabled} onClick={resetCreateDialog}>
                {isDialogDisabled ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create New Copilot
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Copilot</DialogTitle>
                <DialogDescription>{isFirebaseConfigured && !isOnline ? 'You are offline. Copilot will be saved locally.' : ''}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={newCopilotName} onChange={e => setNewCopilotName(e.target.value)} disabled={isDialogDisabled} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Public Description</Label>
                  <Textarea id="description" value={newCopilotDescription} onChange={e => setNewCopilotDescription(e.target.value)} disabled={isDialogDisabled} placeholder="A short, public-facing description of what this copilot does."/>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="system-prompt">System Prompt (Instructions)</Label>
                  <Textarea id="system-prompt" value={newCopilotSystemPrompt} onChange={e => setNewCopilotSystemPrompt(e.target.value)} disabled={isDialogDisabled} placeholder="The core instructions for the AI. Tell it how to behave, what its purpose is, etc. If blank, the description will be used." className="min-h-[120px]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select value={newCopilotType} onValueChange={(value: 'code' | 'no-code') => setNewCopilotType(value)} disabled={isDialogDisabled}>
                      <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                      <SelectContent>
                          <SelectItem value="no-code">No-code</SelectItem>
                          <SelectItem value="code">Code</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateCopilotDialog(false)} disabled={isDialogDisabled}>Cancel</Button>
                <Button onClick={handleCreateCopilot} disabled={isDialogDisabled || (!newCopilotName || !newCopilotDescription)}>
                  {isDialogDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isCreatingCopilot ? 'Creating...' : isGeneratingPuzzle ? 'Initializing...' : 'Create & Initialize'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">My Copilots</h2>
            {loadingMyCopilots && currentUser ? renderSkeletons() : null}
            {!loadingMyCopilots && isFirebaseConfigured && !currentUser && isOnline ? <p className="text-muted-foreground">Please log in to see your copilots.</p> : null}
            {!loadingMyCopilots && myCopilots.length === 0 ? <p className="text-muted-foreground">You haven't created any copilots yet.</p> : null}
            <div className="space-y-2">
              {!loadingMyCopilots && myCopilots.map(copilot => renderMyCopilotCard(copilot))}
            </div>
          </section>
          <section>
            <h2 className="text-2xl font-headline font-semibold mb-4">Featured Copilots</h2>
            {loadingFeaturedCopilots ? renderSkeletons() : null}
            {!loadingFeaturedCopilots && featuredCopilots.length === 0 ? <p className="text-muted-foreground">No featured copilots available.</p> : null}
            <div className="space-y-2">
              {!loadingFeaturedCopilots && featuredCopilots.map(copilot => (
                <Card key={copilot.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push(`/copilots/${copilot.id}`)}>
                  <CardHeader><CardTitle>{copilot.name}</CardTitle></CardHeader>
                  <CardContent><CardDescription>{copilot.description}</CardDescription></CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>

        <Dialog open={isPuzzleDialogOpen} onOpenChange={setIsPuzzleDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Genesis Puzzle Protocol</DialogTitle>
                      <DialogDescription>
                        Your new Copilot is born. Solve its unique puzzle to mint its Genesis NFT and earn {MINTING_REWARD} DoN.
                      </DialogDescription>
                </DialogHeader>
                {puzzleResult && (
                    <div className="grid md:grid-cols-2 gap-6 pt-4">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">{puzzleResult.puzzleTitle}</h3>
                            <p className="text-muted-foreground whitespace-pre-wrap text-sm">{puzzleResult.puzzleText}</p>
                            <Separator />
                             {isPuzzleSolved ? (
                                <div className="p-3 rounded-md bg-green-500/10 text-green-700 dark:text-green-300 text-sm font-semibold flex items-center gap-2">
                                    <Check className="h-4 w-4" /> Correct! The Genesis Block is ready to be forged.
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
                          <div className="space-y-4 p-4 border rounded-lg bg-background flex flex-col justify-between">
                            <div>
                              <h3 className="font-semibold text-lg flex items-center gap-2">
                                  <BrainCircuit className="h-5 w-5 text-primary"/>
                                  Genesis Asset
                              </h3>
                              <div className="space-y-1 mt-2">
                                  <h4 className="font-medium">{puzzleResult.nftTitle}</h4>
                                  <p className="text-muted-foreground text-sm">{puzzleResult.nftDescription}</p>
                              </div>
                              <Separator className="my-3" />
                              <div className="text-sm">
                                  <p className="font-semibold">Image Concept:</p>
                                  <p className="text-muted-foreground text-xs italic">"{puzzleResult.nftImagePrompt}"</p>
                              </div>
                            </div>
                        </div>
                    </div>
                )}
                <DialogFooter className="sm:justify-between items-center gap-4 pt-4">
                    <p className="text-xs text-muted-foreground text-left">
                      The password for the minted NFT is the puzzle's unique solution.
                    </p>
                    <div className="flex gap-2">
                        <DialogClose asChild>
                            <Button variant="ghost" disabled={isMinting}>Close</Button>
                        </DialogClose>
                        <Button onClick={handleMintNft} disabled={isMinting || !isPuzzleSolved}>
                            {isMinting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isMinting ? 'Forging...' : 'Forge Genesis Block'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </ScrollArea>
  );
}
