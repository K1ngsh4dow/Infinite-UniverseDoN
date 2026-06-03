
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { Creation } from '@/context/CreationsContext';
import {
  Folder, File as FileIcon, Music, Film, Mic, BookOpen, Palette, Terminal as TerminalIcon, Globe, Server, HardDrive, Cloud, Package, Bot, Crown, CandlestickChart, Mountain, Atom, TowerControl, BrainCircuit, FlaskConical, Shield, Cpu, Map, Bug, StickyNote,
} from "lucide-react";

const EightBallIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="12" cy="12" r="10" fill="black" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="12" cy="12" r="5" fill="white"/>
        <text x="12" y="14.5" fill="black" textAnchor="middle" fontSize="6" fontWeight="bold">8</text>
    </svg>
);

const MagnifyingGlassIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        <path d="M11 14a2.5 2.5 0 0 0 2.5 -2.5c0 -1.5 -2.5 -4 -2.5 -4s-2.5 2.5 -2.5 4a2.5 2.5 0 0 0 2.5 2.5z" fill="currentColor"/>
    </svg>
);


export interface WindowState {
  id: string;
  creationId: string;
  type: Creation['type'] | 'app_terminal' | 'app_browser' | 'app_chat' | 'app_chess' | 'app_sovereigns_gambit' | 'app_exchange' | 'app_terraformer' | 'app_quantum_ascent' | 'app_quantum_siege' | 'app_copilots' | 'app_echoes' | 'app_nine_ball_enigma' | 'app_echoes_of_pallet_town' | 'app_vault' | 'app_device_999' | 'app_device_888' | 'app_world_weaver' | 'app_bug_hunter' | 'app_notes' | 'app_alibi_archives';
  title: string;
  x: number;
  y: number;
  z: number;
  isMinimized: boolean;
}

export const getIcon = (type: WindowState['type'], large = false, title: string = '') => {
    const size = large ? "h-12 w-12" : "h-5 w-5";
    
    // Special folder icons for Virtual Drives, only when large (on desktop)
    if (type === 'folder' && large) {
        if (title === 'RAID-Storage') return <Server className={cn(size, "text-cyan-500")} />;
        if (title.startsWith('Data-Drive')) return <HardDrive className={cn(size, "text-slate-500")} />;
        if (title === 'Cloud-Sync') return <Cloud className={cn(size, "text-sky-500")} />;
        if (title === 'History') return <Folder className={cn(size, "text-purple-500")} />;
    }
    
    // Extension-based overrides for 'file' type to show more specific icons
    if (type === 'file') {
        if (/\.(zip|rar|7z)$/i.test(title)) return <Package className={cn(size, "text-gray-500")} />;
        if (/\.(mp4|mov|webm|avi)$/i.test(title)) return <Film className={cn(size, "text-purple-500")} />;
        if (/\.(mp3|wav|ogg|aac)$/i.test(title)) return <Music className={cn(size, "text-pink-500")} />;
        if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(title)) return <Palette className={cn(size, "text-blue-500")} />;
        if (/\.(txt|md|json|js|ts|css|html)$/i.test(title)) return <BookOpen className={cn(size, "text-amber-600")} />;
    }

    switch (type) {
        case 'image': return <Palette className={cn(size, "text-blue-500")} />;
        case 'music': return <Music className={cn(size, "text-pink-500")} />;
        case 'story': return <BookOpen className={cn(size, "text-amber-600")} />;
        case 'video': return <Film className={cn(size, "text-purple-500")} />;
        case 'speech': return <Mic className={cn(size, "text-green-500")} />;
        case 'folder': return <Folder className={cn(size, "text-amber-500")} />;
        case 'app_terminal': return <TerminalIcon className={cn(size, "text-green-400")} />;
        case 'app_browser': return <Globe className={cn(size, "text-blue-500")} />;
        case 'app_vault': return <Shield className={cn(size, "text-blue-500")} />;
        case 'app_device_999': return <Cpu className={cn(size, "text-red-500")} />;
        case 'app_device_888': return <Server className={cn(size, "text-cyan-400")} />;
        case 'app_world_weaver': return <Globe className={cn(size, "text-lime-500")} />;
        case 'app_bug_hunter': return <Bug className={cn(size, "text-teal-400")} />;
        case 'app_chess':
        case 'app_sovereigns_gambit':
            return <Crown className={cn(size, "text-amber-400")} />;
        case 'app_exchange': return <CandlestickChart className={cn(size, "text-green-500")} />;
        case 'app_terraformer': return <Mountain className={cn(size, "text-teal-500")} />;
        case 'app_quantum_ascent': return <Atom className={cn(size, "text-violet-400")} />;
        case 'app_quantum_siege': return <TowerControl className={cn(size, "text-orange-400")} />;
        case 'app_copilots': return <Bot className={cn(size, "text-blue-400")} />;
        case 'app_echoes': return <BrainCircuit className={cn(size, "text-rose-400")} />;
        case 'app_echoes_of_pallet_town': return <FlaskConical className={cn(size, "text-teal-400")} />;
        case 'app_nine_ball_enigma': return <EightBallIcon className={cn(size, "text-white")} />;
        case 'app_notes': return <StickyNote className={cn(size, "text-yellow-500")} />;
        case 'app_alibi_archives': return <MagnifyingGlassIcon className={cn(size, "text-slate-400")} />;
        case 'file': // Fallback for generic files
        default: return <FileIcon className={cn(size, "text-gray-500")} />;
    }
}
