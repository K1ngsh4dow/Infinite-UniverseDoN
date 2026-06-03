
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TextareaAutosize from 'react-textarea-autosize';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getFriendlyAIError } from '@/lib/utils';
import { cn } from '@/lib/utils';

import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssistantMessage } from '@/components/chat/assistant-message';
import { Bot, User, SendHorizonal, Loader2, ArrowLeft } from "lucide-react";


interface Copilot {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
  type?: 'code' | 'no-code';
  ownerId?: string | null;
  isFeatured?: boolean;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string; // Not used here yet, but for consistency
}


export default function CopilotRunnerPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const isOnline = useOnlineStatus();
    
    const [copilot, setCopilot] = useState<Copilot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
    const [model, setModel] = useState('googleai/gemini-2.5-pro');

    useEffect(() => {
        const storedModel = localStorage.getItem('infinite-universe-model');
        if (storedModel) {
            setModel(storedModel);
        }
    }, []);

    useEffect(() => {
        if (!params.id) return;
        const copilotId = Array.isArray(params.id) ? params.id[0] : params.id;

        const fetchCopilot = async () => {
            try {
                const docRef = doc(db, 'copilots', copilotId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCopilot({ id: docSnap.id, ...docSnap.data() } as Copilot);
                } else {
                    setError('Copilot not found.');
                    toast({ title: "Error", description: "This copilot does not exist.", variant: "destructive" });
                }
            } catch (err) {
                console.error("Error fetching copilot:", err);
                setError('Failed to load copilot.');
                toast({ title: "Database Error", description: "Could not fetch copilot details.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        fetchCopilot();
    }, [params.id, toast]);
    
    const scrollToBottom = () => {
        if (scrollAreaViewportRef.current) {
            scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isSending]);

    const handleSendMessage = async (userMessageContent: string) => {
        if (!userMessageContent.trim() || isSending || !isOnline || !copilot) return;
        
        const userMessage: ChatMessage = { role: 'user', content: userMessageContent };
        const newMessages = [...messages, userMessage, { role: 'assistant', content: '' }];
        setMessages(newMessages);
        setInput('');
        setIsSending(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: [...messages, userMessage], // Send history up to the user message
                    system: copilot.systemPrompt || copilot.description,
                }),
            });
            
            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new Error(errorText || 'The API returned an error.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantResponse = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                assistantResponse += decoder.decode(value, { stream: true });
                setMessages(currentMessages => {
                    const updatedMessages = [...currentMessages];
                    updatedMessages[updatedMessages.length - 1].content = assistantResponse;
                    return updatedMessages;
                });
            }

        } catch (err) {
            const friendlyError = getFriendlyAIError(err);
            setMessages(currentMessages => {
                const updatedMessages = [...currentMessages];
                updatedMessages[updatedMessages.length - 1].content = `Sorry, I encountered an error. ${friendlyError}`;
                return updatedMessages;
            });
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSendMessage(input);
    }
    
    const handleRetry = () => {
        const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');
        if (lastUserMessage) {
            // Remove the failed assistant response and retry with the last user message.
            setMessages(prev => prev.slice(0, -1));
            handleSendMessage(lastUserMessage.content);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <PageHeader title={<Skeleton className="h-10 w-3/4" />} description={<Skeleton className="h-6 w-1/2 mt-2" />} />
                <Skeleton className="h-[60vh] w-full" />
            </DashboardLayout>
        );
    }
    
    if (error || !copilot) {
         return (
            <DashboardLayout>
                <PageHeader title="Error" description={error || "Could not load this copilot."} />
                <Button asChild variant="outline">
                    <Link href="/copilots"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Copilots</Link>
                </Button>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
             <div className="h-[calc(100vh-4rem)] flex flex-col">
                <div className="flex justify-between items-start gap-4 px-4 pt-4 md:px-8 md:pt-8">
                     <PageHeader
                        title={copilot.name}
                        description={copilot.description}
                        className="mb-4"
                    />
                    <Button asChild variant="outline" className="mt-2 shrink-0">
                         <Link href="/copilots"><ArrowLeft className="mr-2 h-4 w-4" /> Back to List</Link>
                    </Button>
                </div>

                <div className="flex-1 flex flex-col gap-4 overflow-hidden border-t">
                    <ScrollArea className="flex-1" viewportRef={scrollAreaViewportRef}>
                        <div className="p-4 space-y-6">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
                                <Bot className="h-12 w-12 mb-4" />
                                <h3 className="text-xl font-semibold">Start Chatting</h3>
                                <p className="mt-2 text-sm">Begin your conversation with {copilot.name}.</p>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? "justify-end" : "")}>
                                    {message.role === 'assistant' && (
                                        <Avatar className="h-8 w-8 border"><AvatarFallback><Bot /></AvatarFallback></Avatar>
                                    )}
                                    <div className={cn("max-w-xl rounded-lg", message.role === 'user' ? "bg-primary text-primary-foreground p-3" : "w-full")}>
                                        {message.role === 'user' ? (
                                            <p className="whitespace-pre-wrap">{message.content}</p>
                                        ) : (
                                        <AssistantMessage
                                            content={message.content}
                                            isLoading={isSending && index === messages.length - 1}
                                            onRetry={handleRetry}
                                        />
                                        )}
                                    </div>
                                    {message.role === 'user' && (
                                    <Avatar className="h-8 w-8 border"><AvatarFallback><User /></AvatarFallback></Avatar>
                                    )}
                                </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t space-y-4 shrink-0 bg-background">
                        <form onSubmit={handleSubmit}>
                            <div className="relative">
                                <TextareaAutosize
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={isOnline ? `Message ${copilot.name}...` : "You are offline. Chat is disabled."}
                                    className="text-base w-full rounded-md border bg-input pr-12 py-2"
                                    minRows={1} maxRows={6}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                                    disabled={isSending || !isOnline}
                                />
                                <Button type="submit" size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isSending || !isOnline || !input.trim()}>
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
