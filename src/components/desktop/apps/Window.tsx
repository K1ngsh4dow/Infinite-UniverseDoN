
'use client';

import React, { useState, useRef } from 'react';
import { Creation, useCreations } from '@/context/CreationsContext';
import { X, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WindowState, getIcon } from './utils';

import { TextEditor } from './TextEditor';
import { ImageViewer } from './ImageViewer';
import { AudioPlayer } from './AudioPlayer';
import { Terminal } from './Terminal';
import { Browser } from './Browser';
import { VideoPlayer } from './VideoPlayer';
import { Chat } from './Chat';
import { ChessGame } from './ChessGame';
import { AetheriumExchange } from './AetheriumExchange';
import { Terraformer } from './Terraformer';
import { QuantumAscent } from './QuantumAscent';
import { QuantumSiege } from './QuantumSiege';
import { Copilots } from './Copilots';
import { EchoesOfInfinity } from './EchoesOfInfinity';
import { NineBallEnigma } from './NineBallEnigma';
import { EchoesOfPalletTown } from './EchoesOfPalletTown';
import { SovereignsGambit } from './SovereignsGambit';
import { Vault } from './Vault';
import { Device999 } from './Device999';
import { Device888 } from './Device888';
import { Atlas } from './Atlas';
import { BugHunter } from './BugHunter';
import { NotesApp } from './Notes';
import { AlibiArchives } from './alibi-archives/AlibiArchives';
import { useIsMobile } from '@/hooks/use-mobile';

interface WindowProps {
    state: WindowState;
    onClose: () => void;
    onFocus: () => void;
    onMinimize: () => void;
}

const WindowAppContent = ({ state, creation }: { state: WindowState, creation: Creation | undefined }) => {
    
    if (state.type === 'app_terminal') {
        return <Terminal />;
    }

    if (state.type === 'app_browser') {
        return <Browser />;
    }

    if (state.type === 'app_chess') {
        return <ChessGame />;
    }
    
    if (state.type === 'app_sovereigns_gambit') {
        return <SovereignsGambit />;
    }

    if (state.type === 'app_exchange') {
        return <AetheriumExchange />;
    }

    if (state.type === 'app_terraformer') {
        return <Terraformer />;
    }
    
    if (state.type === 'app_world_weaver') {
        return <Atlas />;
    }
    
    if (state.type === 'app_bug_hunter') {
        return <BugHunter />;
    }

    if (state.type === 'app_quantum_ascent') {
        return <QuantumAscent />;
    }

    if (state.type === 'app_quantum_siege') {
        return <QuantumSiege />;
    }

    if (state.type === 'app_copilots') {
        return <Copilots />;
    }

    if (state.type === 'app_echoes') {
        return <EchoesOfInfinity />;
    }
    
    if (state.type === 'app_echoes_of_pallet_town') {
        return <EchoesOfPalletTown />;
    }

    if (state.type === 'app_nine_ball_enigma') {
        return <NineBallEnigma />;
    }

    if (state.type === 'app_vault') {
        return <Vault />;
    }

    if (state.type === 'app_device_999') {
        return <Device999 />;
    }

    if (state.type === 'app_device_888') {
        return <Device888 />;
    }

    if (state.type === 'app_notes') {
        return <NotesApp />;
    }

    if (state.type === 'app_alibi_archives') {
        return <AlibiArchives />;
    }
    
    if (!creation) {
        return <div className="p-4 text-destructive">Error: File not found.</div>;
    }
    
    const isTextFile = creation.type === 'file' && (
      creation.title.endsWith('.txt') || 
      creation.title.endsWith('.md') || 
      creation.title.endsWith('.json') ||
      (creation.data instanceof Blob && creation.data.type.startsWith('text/'))
    );
    if (creation.type === 'story' || isTextFile) {
        return <TextEditor creation={creation} />;
    }
    
    const isImageFile = creation.type === 'image' || (creation.type === 'file' && creation.data instanceof Blob && creation.data.type?.startsWith('image/'));
    if (isImageFile) {
        return <ImageViewer creation={creation} />;
    }
    
    const isAudioFile = creation.type === 'music' || creation.type === 'speech' || (creation.type === 'file' && creation.data instanceof Blob && creation.data.type.startsWith('audio/'));
    if (isAudioFile) {
        return <AudioPlayer creation={creation} />;
    }

    const isVideoFile = creation.type === 'file' && (
        creation.title.endsWith('.mp4') ||
        creation.title.endsWith('.webm') ||
        creation.title.endsWith('.mov') ||
        (creation.data instanceof Blob && creation.data.type.startsWith('video/'))
    );
    if (isVideoFile) {
        return <VideoPlayer creation={creation} />;
    }

    return (
        <div className="p-4">
            <h2 className="font-semibold">Unsupported File Type</h2>
            <p className="text-sm text-muted-foreground">
                Cannot open "{creation.title}". Previews are available for text, images, audio, and video.
            </p>
        </div>
    );
};


export const Window = ({ state, onClose, onFocus, onMinimize }: WindowProps) => {
    const { creations } = useCreations();
    const [position, setPosition] = useState({ x: state.x, y: state.y });
    const dragInfo = useRef({ isDragging: false, startX: 0, startY: 0, nodeX: 0, nodeY: 0 });
    const isMobile = useIsMobile();

    const creation = creations.find(c => c.id === state.creationId);

    const handleInteractionStart = (e: React.MouseEvent<HTMLDivElement>) => {
        onFocus();
        dragInfo.current = { isDragging: true, startX: e.clientX, startY: e.clientY, nodeX: position.x, nodeY: position.y };
        document.addEventListener('mousemove', handleInteractionMove);
        document.addEventListener('mouseup', handleInteractionEnd);
    };

    const handleInteractionMove = (e: MouseEvent) => {
        if (!dragInfo.current.isDragging) return;
        const dx = e.clientX - dragInfo.current.startX;
        const dy = e.clientY - dragInfo.current.startY;
        let newX = dragInfo.current.nodeX + dx;
        let newY = dragInfo.current.nodeY + dy;
        
        // Basic boundary checks
        newX = Math.max(0, newX);
        newY = Math.max(0, newY);
        
        setPosition({ x: newX, y: newY });
    };

    const handleInteractionEnd = () => {
        dragInfo.current.isDragging = false;
        document.removeEventListener('mousemove', handleInteractionMove);
        document.removeEventListener('mouseup', handleInteractionEnd);
    };

    if (state.isMinimized) {
        return null;
    }
    
    const windowSizeClass = () => {
        switch(state.type) {
            case 'app_chat':
                return "w-[500px] h-[700px]";
            case 'app_chess':
            case 'app_sovereigns_gambit':
                 return "w-[860px] h-[620px]";
            case 'app_exchange':
                return "w-[1200px] h-[780px]";
            case 'app_vault':
            case 'app_device_999':
            case 'app_device_888':
                 return "w-[1200px] h-[820px]";
            case 'app_terraformer':
            case 'app_world_weaver':
            case 'app_bug_hunter':
            case 'app_alibi_archives':
                return "w-[960px] h-[720px]";
            case 'app_quantum_ascent':
                return "w-[1024px] h-[768px]";
            case 'app_quantum_siege':
                return "w-[1280px] h-[800px]";
            case 'app_copilots':
                return "w-[1024px] h-[768px]";
            case 'app_echoes':
                return "w-[1024px] h-[768px]";
            case 'app_echoes_of_pallet_town':
                return "w-[1024px] h-[768px]";
            case 'app_nine_ball_enigma':
                return "w-[1024px] h-[768px]";
            case 'app_notes':
                return "w-[720px] h-[540px]";
            default:
                 return "w-[640px] h-[480px]";
        }
    }

    return (
        <div
            className={cn(
                "flex flex-col bg-card overflow-hidden pointer-events-auto",
                isMobile 
                    ? "fixed inset-0 z-50" 
                    : "absolute border rounded-lg shadow-2xl",
                !isMobile && windowSizeClass()
            )}
            style={isMobile ? {} : { left: position.x, top: position.y, zIndex: state.z }}
            onMouseDown={onFocus}
        >
            <div
                className="flex items-center justify-between p-2 bg-muted/50 border-b"
                onMouseDown={!isMobile ? handleInteractionStart : undefined}
                style={{ cursor: !isMobile ? 'grab' : 'default' }}
            >
                <div className="flex items-center gap-2 font-medium text-sm truncate">
                    {getIcon(state.type, false, state.title)}
                    <span className="truncate">{state.title}</span>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMinimize}><Minus className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/80" onClick={onClose}><X className="h-4 w-4" /></Button>
                </div>
            </div>
            <div className="flex-grow overflow-auto bg-background">
                <WindowAppContent state={state} creation={creation} />
            </div>
        </div>
    );
};
