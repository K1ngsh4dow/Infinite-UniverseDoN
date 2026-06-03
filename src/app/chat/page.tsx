
"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquarePlus, History } from "lucide-react";
import { useChatHistory, ChatSession } from "@/hooks/use-chat-history";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ChatHistoryList } from "@/components/chat/chat-history-list";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useToast } from "@/hooks/use-toast";
import { useChatWidget } from "@/context/ChatWidgetContext";

export default function ChatPage() {
  const { sessions, activeSession, createNewSession, deleteSession, setActiveSession, renameSession, forkSession, sendMessage, isSending } = useChatHistory();
  const { setPendingMessage } = useChatWidget();
  const { toast } = useToast();

  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [sessionToRename, setSessionToRename] = useState<ChatSession | null>(null);
  const [newSessionTitle, setNewSessionTitle] = useState('');

  useEffect(() => {
    const pendingMessage = localStorage.getItem('mobile-chat-pending-message');
    if (pendingMessage) {
        localStorage.removeItem('mobile-chat-pending-message');
        if (activeSession) {
            sendMessage({ role: 'user', content: pendingMessage });
        }
    }
  }, [sendMessage, activeSession]);
  
  useEffect(() => {
    // This effect handles suggestions clicked from outside the chat page
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'chat-suggestion-clicked' && e.newValue) {
            const message = e.newValue;
            localStorage.removeItem('chat-suggestion-clicked');
            if (activeSession) {
                sendMessage({ role: 'user', content: message });
            } else {
                // If there's no active session, store it for when one is created
                 localStorage.setItem('mobile-chat-pending-message', message);
            }
        }
    };
    
    // Also handle setting the message directly via the context, for in-app navigation
    setPendingMessage( (message) => {
        if (message && activeSession) {
             sendMessage({ role: 'user', content: message });
             return null; // Clear the message
        }
        return message;
    });

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeSession, sendMessage, setPendingMessage]);


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
  };

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
        const base64Data = btoa(encodeURIComponent(jsonString)); 
        const shareUrl = `${window.location.origin}/chat/shared/${base64Data}`;
        navigator.clipboard.writeText(shareUrl);
        toast({ title: "Share link copied to clipboard!" });
    } catch (e) {
        console.error(e);
        toast({ title: "Failed to create share link.", description: "The session may be too large to share.", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex justify-between items-start gap-4 p-4 pb-0 md:p-8 md:pb-0">
          <PageHeader
            title="AI Chat"
            description="A dedicated chat experience for your mobile device."
            className="mb-4"
          />
          <div className='flex gap-2 mt-2'>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="shrink-0">
                  <History className="mr-2 h-4 w-4" /> History
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Chat History</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100%-4rem)] mt-4">
                  <div className="pr-4">
                    <ChatHistoryList 
                      sessions={sessions}
                      activeSessionId={activeSession?.id}
                      onSessionSelect={setActiveSession}
                      onRename={handleRename}
                      onFork={forkSession}
                      onShare={handleShare}
                      onDelete={deleteSession}
                    />
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            <Button onClick={createNewSession} variant="outline" className="shrink-0">
              <MessageSquarePlus className="mr-2 h-4 w-4" /> New Chat
            </Button>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4 overflow-hidden border-t">
          <ChatInterface />
        </div>
      </div>
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Rename Session</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="session-title">Session Title</Label>
                    <Input id="session-title" value={newSessionTitle} onChange={(e) => setNewSessionTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && executeRename()} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={executeRename}>Save</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
