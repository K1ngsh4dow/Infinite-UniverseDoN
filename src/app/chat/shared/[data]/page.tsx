
'use client';

import React, { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantMessage } from "@/components/chat/assistant-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface SharedMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface SharedSession {
    title: string;
    messages: SharedMessage[];
}

export default function SharedChatPage({ params }: { params: { data: string } }) {
    const [session, setSession] = useState<SharedSession | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!params.data) {
            setError("No shared data provided in the link.");
            return;
        }

        try {
            // URL params are already decoded, but base64 can have '+' which becomes space. Let's be safe.
            const base64 = params.data.replace(/ /g, '+');
            const decodedData = decodeURIComponent(atob(base64));

            if (!decodedData) {
                throw new Error("Decoded data is empty.");
            }

            const parsedSession = JSON.parse(decodedData);

            if (parsedSession.title && Array.isArray(parsedSession.messages)) {
                setSession(parsedSession);
            } else {
                throw new Error("Invalid session format.");
            }
        } catch (e) {
            console.error("Failed to decode shared session:", e);
            setError("The shared link is invalid or corrupted.");
        }
    }, [params.data]);

    if (error) {
        return (
            <DashboardLayout>
                <PageHeader title="Invalid Link" description={error} />
                <Button asChild>
                    <Link href="/chat"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Chat</Link>
                </Button>
            </DashboardLayout>
        );
    }
    
    if (!session) {
        return (
             <DashboardLayout>
                <PageHeader title="Loading Shared Chat..." />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <PageHeader title={session.title} description="This is a read-only shared chat session." />
            <div className="mb-4">
                <Button asChild variant="outline">
                    <Link href="/chat"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Chat</Link>
                </Button>
            </div>
            <Card className="h-[calc(100vh-20rem)] flex flex-col">
                <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                        {session.messages.map((message, index) => (
                             <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? "justify-end" : "")}>
                                {message.role === 'assistant' && (
                                    <Avatar className="h-8 w-8 border">
                                        <AvatarFallback><Bot /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn("max-w-xl rounded-lg", message.role === 'user' ? "bg-primary text-primary-foreground p-3" : "w-full")}>
                                    {message.role === 'user' ? (
                                        <p className="whitespace-pre-wrap">{message.content}</p>
                                    ) : (
                                       <AssistantMessage
                                        content={message.content}
                                        isLoading={false}
                                      />
                                    )}
                                </div>
                                 {message.role === 'user' && (
                                  <Avatar className="h-8 w-8 border">
                                    <AvatarFallback><User /></AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                        ))}
                    </div>
                </ScrollArea>
            </Card>
        </DashboardLayout>
    );
}
