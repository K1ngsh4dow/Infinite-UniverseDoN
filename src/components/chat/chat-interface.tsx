'use client';

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import TextareaAutosize from 'react-textarea-autosize';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, User, SendHorizonal, Loader2, Paperclip, File as FileIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { AssistantMessage } from "@/components/chat/assistant-message";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useChatHistory, ChatMessage } from "@/hooks/use-chat-history";
import { useCreations } from "@/context/CreationsContext";

// This component contains the core UI for the chat, to be reused in different contexts (page, window).
export function ChatInterface() {
  const { activeSession, sendMessage, isSending } = useChatHistory();
  const { creations } = useCreations();
  
  const [input, setInput] = useState('');
  const scrollAreaViewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const isOnline = useOnlineStatus();
  
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachedFilePreview, setAttachedFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  
  const scrollToBottom = () => {
    if (scrollAreaViewportRef.current) {
      scrollAreaViewportRef.current.scrollTop = scrollAreaViewportRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isSending]);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAttachedFile(file);
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setAttachedFilePreview(previewUrl);
      } else {
        setAttachedFilePreview(null);
      }
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    if(attachedFilePreview) {
        URL.revokeObjectURL(attachedFilePreview);
        setAttachedFilePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOnline) {
      toast({ title: "You are offline", description: "Chat is disabled.", variant: "destructive" });
      return;
    }
    if ((!input.trim() && !attachedFile) || isSending) return;

    let contentForApi = input;

    // Check for mentions like `... file "filename" ...` in the text input.
    const fileMentionRegex = /(?:file|story|image)\s+["']([^"']+)["']/i;
    const match = input.match(fileMentionRegex);
    
    if (match) {
      const fileName = match[1];
      const creation = creations.find(c => c.title.toLowerCase().includes(fileName.toLowerCase()));
      
      if (creation) {
        let fileContext: string | null = null;
        if (creation.type === 'story') {
          fileContext = creation.data.story;
        } else if (creation.type === 'file' && creation.data instanceof Blob && creation.data.type.startsWith('text/')) {
          try {
            fileContext = await creation.data.text();
          } catch (err) { console.error("Failed to read file blob:", err); }
        } else {
          fileContext = `[Reference to a non-text or unreadable file of type '${creation.type}' named '${creation.title}'. The user's prompt is about this file.]`;
        }

        if (fileContext) {
          toast({ title: "Context Attached", description: `Content from "${creation.title}" is being added to your prompt.` });
          contentForApi = `${input}\n\n--- Attached File Content for "${creation.title}" ---\n${fileContext}`;
        } else {
          toast({ title: "File Not Readable", description: `Found "${creation.title}", but could not read its content.`, variant: "destructive" });
        }
      } else {
        toast({ title: "File Not Found", description: `Could not find a file matching "${fileName}".`, variant: "destructive" });
      }
    }

    const userMessage: ChatMessage = { role: 'user', content: contentForApi };

    if (attachedFile) {
        const reader = new FileReader();
        if (attachedFile.type.startsWith('image/')) {
            reader.onload = (readEvent) => {
                userMessage.image = readEvent.target?.result as string;
                sendMessage(userMessage);
            };
            reader.onerror = () => toast({ title: "Error reading image file", variant: "destructive" });
            reader.readAsDataURL(attachedFile);
        } else {
            reader.onload = (readEvent) => {
                const attachedFileContent = readEvent.target?.result as string;
                userMessage.content += `\n\n--- Attached File: ${attachedFile.name} ---\n${attachedFileContent}`;
                sendMessage(userMessage);
            };
            reader.onerror = () => toast({ title: "Error reading text file", variant: "destructive" });
            reader.readAsText(attachedFile);
        }
        setInput('');
        handleRemoveFile();
    } else {
        sendMessage(userMessage);
        setInput('');
        handleRemoveFile();
    }
  };

  const messages = activeSession?.messages || [];
  const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user');

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <ScrollArea className="flex-1" viewportRef={scrollAreaViewportRef}>
        <div className="p-4 space-y-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-20">
              <Bot className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold">AI Assistant</h3>
              <p className="mt-2 text-sm">Start a conversation by typing below.</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={index} className={cn("flex items-start gap-4", message.role === 'user' ? "justify-end" : "")}>
                {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 border">
                        <AvatarFallback><Bot /></AvatarFallback>
                    </Avatar>
                )}
                <div className={cn("max-w-xl rounded-lg", message.role === 'user' ? "bg-primary text-primary-foreground p-3" : "w-full")}>
                    {message.role === 'user' ? (
                        <div className="space-y-2">
                          {message.image && (
                            <div className="relative aspect-video rounded-md overflow-hidden bg-primary-foreground/10">
                              <Image src={message.image} alt="User attachment" fill className="object-contain" />
                            </div>
                          )}
                          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}
                        </div>
                    ) : (
                       <AssistantMessage
                        content={message.content}
                        isLoading={isSending && index === messages.length - 1}
                        onRetry={lastUserMessage ? () => sendMessage(lastUserMessage) : undefined}
                      />
                    )}
                </div>
                 {message.role === 'user' && (
                  <Avatar className="h-8 w-8 border">
                    <AvatarFallback><User /></AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t space-y-2 shrink-0 bg-background">
        {attachedFilePreview ? (
          <div className="relative w-24 h-24 border rounded-md p-1 bg-muted">
            <Image src={attachedFilePreview} alt="Image preview" fill className="object-contain rounded-sm" />
            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : attachedFile ? (
          <div className="flex items-center justify-between p-2 text-sm rounded-md bg-muted text-muted-foreground">
            <div className="flex items-center gap-2 truncate">
              <FileIcon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{attachedFile.name}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleRemoveFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
        <form onSubmit={handleSubmit}>
          <div className="relative">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,text/*,.csv,.json,.md" />
            <Button type="button" size="icon" variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={handleTriggerUpload} disabled={isSending || !isOnline}>
                <Paperclip className="h-5 w-5" />
            </Button>
            <TextareaAutosize
              value={input}
              onChange={handleInputChange}
              placeholder={isOnline ? "Ask a question or give a command..." : "You are offline. Chat is disabled."}
              className="text-base w-full rounded-md border bg-input pr-12 pl-12 py-2"
              minRows={1}
              maxRows={6}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
              disabled={isSending || !isOnline}
            />
            <Button type="submit" size="icon" variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" disabled={isSending || !isOnline || (!input.trim() && !attachedFile)}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
            </Button>
          </div>
        </form>
         <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5 justify-center">
            Powered by Gemini
         </p>
      </div>
    </div>
  );
}
