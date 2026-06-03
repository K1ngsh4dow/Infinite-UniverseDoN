
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Mic } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatHistory } from '@/hooks/use-chat-history';


const DoNOrbSVG = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary-foreground">
        <defs>
            <radialGradient id="don-glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" style={{stopColor: 'currentColor', stopOpacity: 0.7}} />
                <stop offset="100%" style={{stopColor: 'currentColor', stopOpacity: 0}} />
            </radialGradient>
        </defs>
        <circle cx="12" cy="12" r="11" fill="url(#don-glow)" />
        <path d="M9.5 7C9.5 7 15.5 9.5 15.5 12C15.5 14.5 9.5 17 9.5 17V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.4" />
        <path d="M9.5 7V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);


export default function FloatingChatIcon() {
    const router = useRouter();
    const { toast } = useToast();
    const { toggleChat, isChatOpen } = useChatWidget();
    const { sendMessage } = useChatHistory();
    const isMobile = useIsMobile();
    
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isClient, setIsClient] = useState(false);
    const [isIdle, setIsIdle] = useState(false);
    const [isHeld, setIsHeld] = useState(false);
    const [isListening, setIsListening] = useState(false);
    
    const ref = useRef<HTMLButtonElement>(null);
    const idleTimerRef = useRef<NodeJS.Timeout>();
    const longPressTimerRef = useRef<NodeJS.Timeout>();
    const recognitionRef = useRef<any>(null);

    const dragInfo = useRef({
        isDragging: false,
        isDragged: false,
        startX: 0,
        startY: 0,
        nodeX: 0,
        nodeY: 0,
    });

    useEffect(() => {
        setIsClient(true);
        const savedPos = localStorage.getItem('floating-chat-icon-pos');
        if (savedPos) {
            setPosition(JSON.parse(savedPos));
        } else {
             if (typeof window !== 'undefined') {
                setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
            }
        }
    }, []);

    const handleActivity = () => {
        setIsIdle(false);
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = setTimeout(() => setIsIdle(true), 30000); // 30 seconds
    };

    useEffect(() => {
        if (!isClient) return;
        
        handleActivity();

        window.addEventListener('mousemove', handleActivity);
        window.addEventListener('mousedown', handleActivity);
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('scroll', handleActivity);
        
        return () => {
            clearTimeout(idleTimerRef.current);
            window.removeEventListener('mousemove', handleActivity);
            window.removeEventListener('mousedown', handleActivity);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('scroll', handleActivity);
        };
    }, [isClient]);

    const savePosition = (pos: { x: number, y: number }) => {
        localStorage.setItem('floating-chat-icon-pos', JSON.stringify(pos));
    };

    const handleLongPress = () => {
        dragInfo.current.isDragged = true;
        setIsListening(true);
        
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast({ title: "Voice input not supported", description: "Your browser doesn't support the Web Speech API.", variant: "destructive"});
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim();
            if (transcript) {
                if (isMobile) {
                    localStorage.setItem('mobile-chat-pending-message', transcript);
                    router.push('/chat');
                } else {
                    sendMessage({ role: 'user', content: transcript });
                    if (!isChatOpen) {
                        toggleChat();
                    }
                }
            }
        };

        recognition.onerror = (event: any) => {
            console.error("Speech recognition error", event.error);
            toast({ title: "Voice recognition error", description: `Error: ${event.error}`, variant: "destructive" });
        };
        
        recognition.onend = () => {
            setIsListening(false);
            setIsHeld(false);
            recognitionRef.current = null;
        };

        recognition.start();
    };
    
    const handleInteractionMove = (e: MouseEvent | TouchEvent) => {
        clearTimeout(longPressTimerRef.current);
        setIsHeld(false);

        if (!dragInfo.current.isDragging) return;
        if (e.cancelable) e.preventDefault();

        const event = 'touches' in e ? e.touches[0] : e;
        const dx = event.clientX - dragInfo.current.startX;
        const dy = event.clientY - dragInfo.current.startY;

        if (!dragInfo.current.isDragged && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
            dragInfo.current.isDragged = true;
        }
        
        let newX = dragInfo.current.nodeX + dx;
        let newY = dragInfo.current.nodeY + dy;
        
        const node = ref.current;
        if (node) {
            newX = Math.max(16, Math.min(newX, window.innerWidth - node.offsetWidth - 16));
            newY = Math.max(16, Math.min(newY, window.innerHeight - node.offsetHeight - 16));
        }
        
        setPosition({ x: newX, y: newY });
    };

    const handleInteractionEnd = () => {
        clearTimeout(longPressTimerRef.current);
        setIsHeld(false);

        // If it wasn't a drag, and we aren't in the middle of a voice command, it's a click.
        if (!dragInfo.current.isDragged && !isListening) {
             if (isMobile) {
                router.push('/chat');
             } else {
                toggleChat();
             }
        } else if (dragInfo.current.isDragged) {
            savePosition(position);
        }
        
        if (isListening && recognitionRef.current) {
            recognitionRef.current.stop();
        }

        // Reset all drag-related flags.
        dragInfo.current.isDragging = false;
        dragInfo.current.isDragged = false;
        
        // Clean up global listeners.
        document.removeEventListener('mousemove', handleInteractionMove);
        document.removeEventListener('touchmove', handleInteractionMove);
        document.removeEventListener('mouseup', handleInteractionEnd);
        document.removeEventListener('touchend', handleInteractionEnd);
    };


    const handleInteractionStart = (e: React.MouseEvent<HTMLButtonElement, MouseEvent> | React.TouchEvent<HTMLButtonElement>) => {
        handleActivity();
        
        const event = 'touches' in e ? e.touches[0] : e;
        if (!ref.current) return;
        
        dragInfo.current = { ...dragInfo.current, isDragging: true, isDragged: false, startX: event.clientX, startY: event.clientY, nodeX: ref.current.offsetLeft, nodeY: ref.current.offsetTop };

        longPressTimerRef.current = setTimeout(handleLongPress, 500);
        setIsHeld(true);
        
        document.addEventListener('mousemove', handleInteractionMove);
        document.addEventListener('touchmove', handleInteractionMove, { passive: false });
        document.addEventListener('mouseup', handleInteractionEnd);
        document.addEventListener('touchend', handleInteractionEnd);
    };
    
    if (!isClient) {
        return null;
    }

    return (
        <button
            ref={ref}
            onMouseDown={handleInteractionStart}
            onTouchStart={handleInteractionStart}
            onMouseEnter={handleActivity}
            onMouseLeave={handleActivity}
            className={cn(
                "fixed z-40 flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground shadow-lg cursor-grab active:cursor-grabbing transition-all duration-300",
                isIdle && "opacity-20 hover:opacity-100",
                isHeld && !isListening && "scale-110 animate-pulse",
                isListening && "scale-110 bg-red-500 animate-pulse",
            )}
            style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                transform: dragInfo.current.isDragging ? 'scale(1.05)' : 'scale(1)',
            }}
            aria-label="DoN Command Orb"
        >
           {isListening ? <Mic className="h-7 w-7" /> : <DoNOrbSVG />}
        </button>
    );
}
