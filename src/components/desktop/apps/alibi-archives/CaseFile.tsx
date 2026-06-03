
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { type GenerateMysteryOutput } from '@/ai/schemas/alibi-archives';
import { Users, Search, Milestone, CheckCircle, XCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface CaseFileProps {
    mystery: GenerateMysteryOutput;
    onReset: () => void;
}

export function CaseFile({ mystery, onReset }: CaseFileProps) {
    const [accused, setAccused] = useState<string | undefined>(undefined);
    const [isVerdictCorrect, setIsVerdictCorrect] = useState<boolean | null>(null);

    const handleSubmitAccusation = () => {
        if (!accused) return;
        const correct = accused === mystery.solution.murderer;
        setIsVerdictCorrect(correct);
    };

    return (
        <div className="h-full bg-background p-4 flex flex-col gap-4">
            <header className="flex-shrink-0 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">{mystery.caseTitle}</h1>
                    <p className="text-muted-foreground">{mystery.setting}</p>
                </div>
                <Button onClick={onReset} variant="outline">New Mystery</Button>
            </header>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden">
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <Card>
                        <CardHeader><CardTitle>Victim Report</CardTitle></CardHeader>
                        <CardContent>
                            <p className="font-semibold text-lg text-primary">{mystery.victim.name}</p>
                            <p className="text-sm text-muted-foreground">{mystery.victim.description}</p>
                        </CardContent>
                    </Card>
                    <Card className="flex-grow flex flex-col overflow-hidden">
                        <CardHeader>
                            <CardTitle>Case Details</CardTitle>
                        </CardHeader>
                        <Tabs defaultValue="characters" className="flex-grow flex flex-col overflow-hidden px-6">
                            <TabsList className="shrink-0">
                                <TabsTrigger value="characters"><Users className="mr-2 h-4 w-4" />Suspects</TabsTrigger>
                                <TabsTrigger value="clues"><Search className="mr-2 h-4 w-4" />Clues</TabsTrigger>
                                <TabsTrigger value="solution"><Milestone className="mr-2 h-4 w-4" />Solution</TabsTrigger>
                            </TabsList>
                            <TabsContent value="characters" className="flex-grow overflow-hidden mt-2">
                                <ScrollArea className="h-full pr-4">
                                    <div className="space-y-3">
                                        {mystery.characters.map(char => (
                                            <div key={char.name} className="p-3 border rounded-lg">
                                                <p className="font-semibold">{char.name}</p>
                                                <p className="text-xs text-muted-foreground italic">{char.description}</p>
                                                <p className="text-xs mt-1"><strong className="text-primary/80">Motive?</strong> {char.motive || 'Unknown'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="clues" className="flex-grow overflow-hidden mt-2">
                                <ScrollArea className="h-full pr-4">
                                    <div className="space-y-3">
                                        {mystery.clues.map(clue => (
                                            <div key={clue.id} className="p-3 border rounded-lg">
                                                <p className="font-semibold">{clue.description}</p>
                                                <p className="text-xs text-primary/80 italic mt-1">{clue.significance}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                            <TabsContent value="solution" className="flex-grow overflow-hidden mt-2">
                                <ScrollArea className="h-full pr-4">
                                    <div className="space-y-3">
                                        <p className="font-semibold text-lg">Case Closed: The Truth</p>
                                        <p className="text-sm"><strong>Murderer:</strong> {mystery.solution.murderer}</p>
                                        <p className="text-sm"><strong>Motive:</strong> {mystery.solution.motive}</p>
                                        <p className="text-sm whitespace-pre-wrap leading-relaxed"><strong className="block mb-1">How it Happened:</strong>{mystery.solution.reasoning}</p>
                                    </div>
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </Card>
                </div>
                <div className="lg:col-span-1">
                    <Card className="h-full">
                        <CardHeader>
                            <CardTitle>Final Accusation</CardTitle>
                            <CardDescription>When you're sure, make your final accusation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Label htmlFor="suspect-select">Who is the murderer?</Label>
                            <Select onValueChange={setAccused} value={accused}>
                                <SelectTrigger id="suspect-select">
                                    <SelectValue placeholder="Select a suspect..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {mystery.characters.map(char => (
                                        <SelectItem key={char.name} value={char.name}>{char.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button className="w-full" onClick={handleSubmitAccusation} disabled={!accused}>Submit Accusation</Button>
                        </CardContent>
                        <CardFooter>
                            {isVerdictCorrect !== null && (
                                isVerdictCorrect ? (
                                    <div className="w-full text-center p-4 bg-green-500/10 text-green-700 rounded-lg">
                                        <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p className="font-bold">Correct!</p>
                                        <p className="text-sm">You solved the case. Check the Solution tab for details.</p>
                                    </div>
                                ) : (
                                    <div className="w-full text-center p-4 bg-destructive/10 text-destructive rounded-lg">
                                        <XCircle className="h-8 w-8 mx-auto mb-2" />
                                        <p className="font-bold">Incorrect.</p>
                                        <p className="text-sm">The killer remains at large. Review the evidence and try again.</p>
                                    </div>
                                )
                            )}
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
