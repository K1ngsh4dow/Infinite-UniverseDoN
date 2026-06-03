
"use client";

import React, { createContext, useState, useContext, ReactNode } from 'react';

type PendingMessageCallback = (message: string | null) => string | null;

interface ChatWidgetContextType {
  isChatOpen: boolean;
  setIsChatOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleChat: () => void;
  pendingMessage: string | null;
  setPendingMessage: (message: string | null | PendingMessageCallback) => void;
}

const ChatWidgetContext = createContext<ChatWidgetContextType | undefined>(undefined);

export const ChatWidgetProvider = ({ children }: { children: ReactNode }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [pendingMessage, _setPendingMessage] = useState<string | null>(null);

  const toggleChat = () => {
    setIsChatOpen(prev => !prev);
  };
  
  const setPendingMessage = (message: string | null | PendingMessageCallback) => {
    if (typeof message === 'function') {
       _setPendingMessage(message);
    } else {
      _setPendingMessage(() => message);
    }
  };


  return (
    <ChatWidgetContext.Provider value={{ isChatOpen, setIsChatOpen, toggleChat, pendingMessage, setPendingMessage }}>
      {children}
    </ChatWidgetContext.Provider>
  );
};

export const useChatWidget = () => {
  const context = useContext(ChatWidgetContext);
  if (context === undefined) {
    throw new Error('useChatWidget must be used within a ChatWidgetProvider');
  }
  return context;
};
