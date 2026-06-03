
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ChevronRight, Send } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GameChatProps {
    messages: { player: string, text: string, timestamp: number }[];
    onSendMessage: (message: string) => void;
}

export const GameChat = ({ messages, onSendMessage }: GameChatProps) => {
    const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
    const [input, setInput] = useState('');

    useEffect(() => {
        if (scrollAreaViewportRef.current) {
            scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
        }
    }, [messages]);

    const formatAddress = (addr: string) => {
        if (!addr.startsWith('don_addr_')) return addr;
        return `${addr.substring(0, 15)}...${addr.substring(addr.length - 4)}`;
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input.trim());
        setInput('');
    }

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className="p-4">
                <CardTitle className="text-base">Comms Channel</CardTitle>
                <CardDescription className="text-xs">Live feed of game events.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow min-h-0">
                <ScrollArea className="h-full font-mono text-xs" viewportRef={scrollAreaViewportRef}>
                    <div className="space-y-3 pr-4">
                        {messages.length === 0 && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <span>[SYS]</span>
                                <p>White to move. Awaiting input...</p>
                            </div>
                        )}
                        {messages.map((msg, index) => (
                            <div key={index} className="flex flex-col">
                                <div className="flex items-center gap-2">
                                     <span className="text-muted-foreground">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                    <span className="text-primary truncate">
                                      {formatAddress(msg.player)}
                                    </span>
                                </div>
                               <p className="text-foreground pl-2 flex items-center gap-1">
                                    <ChevronRight className="h-3 w-3" />
                                    <span>{msg.text}</span>
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardContent className="p-4 pt-0 border-t">
                 <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type a message..."
                        className="h-9 text-xs"
                    />
                    <Button type="submit" size="icon" className="h-9 w-9">
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};
