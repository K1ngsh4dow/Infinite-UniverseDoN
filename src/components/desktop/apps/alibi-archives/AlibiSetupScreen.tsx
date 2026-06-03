
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

const MagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <path d="M11 14a2.5 2.5 0 0 0 2.5 -2.5c0 -1.5 -2.5 -4 -2.5 -4s-2.5 2.5 -2.5 4a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor"/>
    </svg>
);


export function AlibiSetupScreen({ onGenerate, isLoading }: { onGenerate: (theme: string) => void, isLoading: boolean }) {
    const { toggleChat, setPendingMessage } = useChatWidget();
    const isMobile = useIsMobile();
    const router = useRouter();

    const handlePromptSuggestion = (prompt: string) => {
        const fullPrompt = `Generate a murder mystery with the theme: "${prompt}"`;
        if (isMobile) {
            localStorage.setItem('mobile-chat-pending-message', fullPrompt);
            router.push('/chat');
        } else {
            setPendingMessage(fullPrompt);
            toggleChat();
        }
    }

    return (
        <div className="flex h-full items-center justify-center p-8 bg-muted">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                        <MagnifyingGlassIcon className="h-7 w-7 text-primary" />
                        The Alibi Archives
                    </CardTitle>
                    <CardDescription>Generate a unique murder mystery case file by prompting the AI Assistant.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-center">To create a new case file, open the AI Assistant and type a request, or try one of these examples:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button variant="outline" onClick={() => handlePromptSuggestion("A locked-room mystery on a starship")}>Starship Mystery</Button>
                        <Button variant="outline" onClick={() => handlePromptSuggestion("A poisoning at a 1920s gala")}>1920s Gala Poisoning</Button>
                        <Button variant="outline" onClick={() => handlePromptSuggestion("A double agent found in a Cold War Berlin hotel")}>Cold War Espionage</Button>
                        <Button variant="outline" onClick={() => handlePromptSuggestion("A famous movie starlet dies on set")}>Hollywood Golden Age</Button>
                    </div>
                </CardContent>
                <CardFooter>
                    <p className="text-xs text-muted-foreground text-center w-full">The AI will generate the case file and display it directly in the chat window.</p>
                </CardFooter>
            </Card>
        </div>
    );
}

