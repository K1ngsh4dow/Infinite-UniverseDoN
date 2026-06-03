
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { getFriendlyAIError } from '@/lib/utils';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
}

const STORAGE_KEY = 'infinite-universe-chat-history';

const getInitialState = (): { sessions: ChatSession[], activeSessionId: string } => {
    if (typeof window === 'undefined') {
        const defaultSession: ChatSession = { id: 'default', title: 'New Chat', messages: [], createdAt: Date.now() };
        return { sessions: [defaultSession], activeSessionId: 'default' };
    }
    
    try {
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
            const parsed = JSON.parse(savedState);
            if (Array.isArray(parsed.sessions) && typeof parsed.activeSessionId === 'string' && parsed.sessions.length > 0) {
                 return {
                    sessions: parsed.sessions.sort((a: ChatSession, b: ChatSession) => b.createdAt - a.createdAt),
                    activeSessionId: parsed.activeSessionId
                 };
            }
        }
    } catch (error) {
        console.error("Failed to parse chat history from localStorage", error);
        localStorage.removeItem(STORAGE_KEY);
    }
    
    const defaultSession: ChatSession = { id: `session-${Date.now()}`, title: 'New Chat', messages: [], createdAt: Date.now() };
    return { sessions: [defaultSession], activeSessionId: defaultSession.id };
};


export const useChatHistory = () => {
  const [state, setState] = useState(getInitialState);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();
  
  const [model, setModel] = useState('googleai/gemini-1.5-pro-latest');

  useEffect(() => {
    const storedModel = localStorage.getItem('infinite-universe-model');
    if (storedModel) {
      setModel(storedModel);
    }
  }, []);

  useEffect(() => {
    setState(getInitialState());
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to save chat history to localStorage", error);
        toast({ title: "Could not save chat history", variant: 'destructive'});
      }
    }
  }, [state, isLoaded, toast]);
  
  const setActiveSession = useCallback((id: string) => {
    if (state.sessions.find(s => s.id === id)) {
        setState(prevState => ({ ...prevState, activeSessionId: id }));
    }
  }, [state.sessions]);
  
  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
    };
    setState(prevState => ({
        sessions: [newSession, ...prevState.sessions],
        activeSessionId: newSession.id
    }));
    toast({ title: 'New chat started.' });
  }, [toast]);
  
  const deleteSession = useCallback((id: string) => {
    setState(prevState => {
        const remainingSessions = prevState.sessions.filter(s => s.id !== id);
        if (remainingSessions.length === 0) {
            const newSession: ChatSession = { id: `session-${Date.now()}`, title: 'New Chat', messages: [], createdAt: Date.now() };
            return { sessions: [newSession], activeSessionId: newSession.id };
        }
        
        const newActiveSessionId = prevState.activeSessionId === id ? remainingSessions[0].id : prevState.activeSessionId;
        
        return {
            sessions: remainingSessions,
            activeSessionId: newActiveSessionId
        };
    });
    toast({ title: 'Chat session deleted.' });
  }, [toast]);
  
  const addMessage = useCallback((message: ChatMessage) => {
    setState(prevState => {
        const newSessions = prevState.sessions.map(session => {
            if (session.id === prevState.activeSessionId) {
                const newMessages = [...session.messages, message];
                
                const shouldSetTitle = session.messages.length === 0 && message.role === 'user';
                const newTitle = shouldSetTitle 
                    ? message.content.substring(0, 35) + (message.content.length > 35 ? '...' : '') 
                    : session.title;
                
                return { ...session, messages: newMessages, title: newTitle };
            }
            return session;
        });

        return { ...prevState, sessions: newSessions.sort((a,b) => b.createdAt - a.createdAt) };
    });
  }, []);
  
  const updateLastMessage = useCallback((content: string) => {
    setState(prevState => {
        const newSessions = prevState.sessions.map(session => {
            if (session.id === prevState.activeSessionId) {
                const updatedMessages = [...session.messages];
                if (updatedMessages.length > 0) {
                    updatedMessages[updatedMessages.length - 1].content = content;
                }
                return { ...session, messages: updatedMessages };
            }
            return session;
        });
        return { ...prevState, sessions: newSessions };
    });
  }, []);

  const sendMessage = useCallback(async (userMessage: ChatMessage) => {
    const activeSession = state.sessions.find(s => s.id === state.activeSessionId);
    if (!activeSession) return;

    const currentHistory = [...activeSession.messages];
    
    addMessage(userMessage);
    addMessage({ role: 'assistant', content: '' });
    
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [...currentHistory, userMessage],
        }),
      });

      if (!response.ok) {
        let errorDetails = 'The API returned an unhandled error.';
        try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const errorJson = await response.json();
                errorDetails = errorJson.error || JSON.stringify(errorJson);
            } else {
                const errorText = await response.text();
                errorDetails = errorText.includes('<html>') 
                    ? 'The server returned an unexpected HTML page. Check your API key and server configuration.' 
                    : errorText;
            }
        } catch (e) {
            errorDetails = 'Could not parse the error response from the server.';
        }
        
        console.error("Chat error:", errorDetails);
        updateLastMessage(`Sorry, I encountered an error. ${getFriendlyAIError(errorDetails)}`);
        setIsSending(false);
        return;
      }
      
      if (!response.body) {
        throw new Error('API returned a successful response but with no body.');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        assistantResponse += decoder.decode(value, { stream: true });
        updateLastMessage(assistantResponse);
      }
      setIsSending(false);
    } catch (error) {
       console.error("Chat streaming error:", error);
       const errorMessage = error instanceof Error ? getFriendlyAIError(error) : "Please try again.";
       updateLastMessage(`Sorry, I encountered an error. ${errorMessage}`);
       setIsSending(false);
    }
  }, [model, state.activeSessionId, state.sessions, addMessage, updateLastMessage]);

  const renameSession = useCallback((id: string, newTitle: string) => {
    if (!newTitle.trim()) {
        toast({ title: "Title cannot be empty.", variant: 'destructive' });
        return;
    }
    setState(prevState => {
        const newSessions = prevState.sessions.map(session =>
            session.id === id ? { ...session, title: newTitle.trim() } : session
        );
        return { ...prevState, sessions: newSessions };
    });
    toast({ title: "Session renamed." });
  }, [toast]);

  const forkSession = useCallback((id: string) => {
    setState(prevState => {
        const sessionToFork = prevState.sessions.find(s => s.id === id);
        if (!sessionToFork) return prevState;

        const newSession: ChatSession = {
            id: `session-${Date.now()}`,
            title: `Copy of ${sessionToFork.title}`.substring(0, 50),
            messages: JSON.parse(JSON.stringify(sessionToFork.messages)), // Deep copy
            createdAt: Date.now(),
        };

        const newSessions = [newSession, ...prevState.sessions];
        
        return {
            sessions: newSessions.sort((a,b) => b.createdAt - a.createdAt),
            activeSessionId: newSession.id
        };
    });
    toast({ title: "Session forked.", description: "Switched to the new copy." });
  }, [toast]);
  
  const activeSession = state.sessions.find(s => s.id === state.activeSessionId) || state.sessions[0];

  return {
    sessions: state.sessions,
    activeSession,
    isLoaded,
    isSending,
    createNewSession,
    deleteSession,
    setActiveSession,
    addMessage,
    updateLastMessage,
    sendMessage,
    renameSession,
    forkSession,
  };
};
