
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useChatWidget } from "@/context/ChatWidgetContext";
import { Button } from "@/components/ui/button";
import { Bot, GripVertical, MessageSquarePlus, MoreHorizontal, X } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useChatHistory, ChatSession } from "@/hooks/use-chat-history";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChatHistoryList } from "./chat/chat-history-list";
import { ChatInterface } from "./chat/chat-interface";


export function ChatWidget() {
  const { isChatOpen, setIsChatOpen, pendingMessage, setPendingMessage } = useChatWidget();
  const { sessions, activeSession, createNewSession, deleteSession, setActiveSession, renameSession, forkSession, sendMessage } = useChatHistory();
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, nodeX: 0, nodeY: 0 });

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<ChatSession | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  const savePosition = useCallback((pos: { x: number, y: number }) => {
    localStorage.setItem('chat-widget-pos', JSON.stringify(pos));
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedPos = localStorage.getItem('chat-widget-pos');
        if (savedPos) {
            setPosition(JSON.parse(savedPos));
        } else {
            setPosition({
                x: window.innerWidth / 2 - 250, // 500px width
                y: window.innerHeight / 2 - 350, // 700px height
            });
        }
    }
  }, []);
  
  useEffect(() => {
    const handleResize = () => {
      if (!ref.current) return;

      setPosition((currentPos) => {
        const newPos = {
          x: Math.max(0, Math.min(currentPos.x, window.innerWidth - ref.current.offsetWidth)),
          y: Math.max(0, Math.min(currentPos.y, window.innerHeight - ref.current.offsetHeight)),
        };

        if (newPos.x !== currentPos.x || newPos.y !== currentPos.y) {
          savePosition(newPos);
        }
        return newPos;
      });
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [savePosition]);


  useEffect(() => {
    if (isChatOpen && !isOnline) {
      toast({
        title: "You are offline",
        description: "Chat features are disabled until you reconnect.",
        variant: "destructive",
      });
    }
  }, [isOnline, isChatOpen, toast]);

  const handleInteractionStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    dragInfo.current = { isDragging: true, startX: e.clientX, startY: e.clientY, nodeX: ref.current.offsetLeft, nodeY: ref.current.offsetTop };
    document.addEventListener('mousemove', handleInteractionMove);
    document.addEventListener('mouseup', handleInteractionEnd);
  };

  const handleInteractionMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current.isDragging || !ref.current) return;
    const dx = e.clientX - dragInfo.current.startX;
    const dy = e.clientY - dragInfo.current.startY;
    let newX = dragInfo.current.nodeX + dx;
    let newY = dragInfo.current.nodeY + dy;
    
    newX = Math.max(0, Math.min(newX, window.innerWidth - ref.current.offsetWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - ref.current.offsetHeight));

    setPosition({ x: newX, y: newY });
  }, []);

  const handleInteractionEnd = useCallback(() => {
    dragInfo.current.isDragging = false;
    document.removeEventListener('mousemove', handleInteractionMove);
    document.removeEventListener('mouseup', handleInteractionEnd);
    savePosition(position);
  }, [position, handleInteractionMove, savePosition]);
  
  useEffect(() => {
    if (isChatOpen) {
       setPendingMessage( (currentPendingMessage) => {
           if(currentPendingMessage) {
                if (!isOnline) {
                    toast({ title: "You are offline", description: "Cannot send message.", variant: "destructive" });
                    return null;
                }
                sendMessage({ role: 'user', content: currentPendingMessage });
                return null; // Clear the message
           }
           return currentPendingMessage;
       });
    }
  }, [isChatOpen, setPendingMessage, sendMessage, isOnline, toast]);

  const handleRename = (session: ChatSession) => {
    setSessionToRename(session);
    setNewSessionTitle(session.title);
    setIsRenameDialogOpen(true);
  };

  const executeRename = () => {
    if (sessionToRename) {
        renameSession(sessionToRename.id, newSessionTitle);
        setIsRenameDialogOpen(false);
        setSessionToRename(null);
        setNewSessionTitle('');
    }
  }

  const handleShare = (session: ChatSession) => {
    try {
        const sessionData = { 
            title: session.title, 
            messages: session.messages.map(m => ({
                role: m.role,
                content: m.image ? `${m.content}\n\n[Image was attached]` : m.content
            })) 
        };
        const jsonString = JSON.stringify(sessionData);
        // Using btoa which is fine for client-side. encodeURIComponent for unicode chars
        const base64Data = btoa(encodeURIComponent(jsonString)); 
        const shareUrl = `${window.location.origin}/chat/shared/${base64Data}`;
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Share link copied to clipboard!" });
    } catch (e) {
        console.error(e);
        toast({ title: "Failed to create share link.", description: "The session may be too large to share.", variant: "destructive" });
    }
  }

  if (!isChatOpen) return null;

  return (
    <div
      ref={ref}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50"
    >
      <Card className="w-[90vw] max-w-[500px] h-[80vh] max-h-[700px] flex flex-col bg-card border shadow-2xl">
        <CardHeader 
          className="flex flex-row items-center justify-between p-4 border-b cursor-grab active:cursor-grabbing"
          onMouseDown={handleInteractionStart}
        >
          <CardTitle className="text-lg flex items-center gap-2 select-none">
            <Bot className="h-5 w-5" /> 
            AI Assistant
          </CardTitle>
          <div className="flex items-center gap-0">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" title="Chat History">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Chat History</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={createNewSession}>
                        <MessageSquarePlus className="mr-2 h-4 w-4" />
                        New Chat
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                      <ChatHistoryList 
                        sessions={sessions.slice(0, 5)}
                        activeSessionId={activeSession?.id}
                        onSessionSelect={setActiveSession}
                        onRename={handleRename}
                        onFork={forkSession}
                        onShare={handleShare}
                        onDelete={deleteSession}
                        asDropdown
                      />
                </DropdownMenuContent>
            </DropdownMenu>
            <GripVertical className="h-5 w-5 text-muted-foreground" />
            <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => setIsChatOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <div className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface />
        </div>
      </Card>
       <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Session</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="session-title-widget">Session Title</Label>
                    <Input id="session-title-widget" value={newSessionTitle} onChange={(e) => setNewSessionTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeRename()} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={executeRename}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
