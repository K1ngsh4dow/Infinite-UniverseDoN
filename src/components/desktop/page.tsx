
'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import JSZip from "jszip";
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCreations, Creation } from "@/context/CreationsContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog"
import {
  Download, Trash2, Upload, ChevronRight, FolderPlus, HardDrive, Loader2, LayoutGrid,
  Terminal as TerminalIcon, Globe, BookText, AudioLines, Music, Video, Shield, Settings, Bot, LayoutGrid as CreationsIcon, Mountain, Crown, CandlestickChart, Atom, TowerControl, BrainCircuit, FlaskConical, Image as ImageIcon, Share2, Cpu, Server, Map, Bug, StickyNote,
  Wifi, Bluetooth, Plane, Flashlight, Cast, Battery, MapPin, Power, Sun, Moon, Volume2, PlayIcon, Smartphone, Laptop,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Window } from './apps/Window';
import { Taskbar } from './Taskbar';
import { getIcon, WindowState } from './apps/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChatWidget } from '@/components/chat-widget';
import FloatingChatIcon from '@/components/floating-chat-icon';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { Slider } from '@/components/ui/slider';

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


const APPS = [
  { id: 'nav_settings', type: 'nav', title: 'Settings', href: '/settings', icon: Settings, category: 'system' },
  { id: 'app_terminal', type: 'app_terminal', title: 'Terminal', icon: TerminalIcon, category: 'system' },
  { id: 'app_browser', type: 'app_browser', title: 'Browser', icon: Globe, category: 'system' },
  { id: 'app_vault', type: 'app_vault', title: 'Secure Vault', icon: Shield, category: 'system' },
  { id: 'app_notes', type: 'app_notes', title: 'Notes', icon: StickyNote, category: 'system' },
  { id: 'app_device_999', type: 'app_device_999', title: 'Device 999', icon: Cpu, category: 'system' },
  { id: 'app_device_888', type: 'app_device_888', title: 'Device 888', icon: Server, category: 'system' },
  { id: 'app_chat', type: 'app_chat', title: 'AI Chat', icon: Bot, category: 'ai' },
  { id: 'app_copilots', type: 'app_copilots', title: 'Copilots', icon: Bot, category: 'ai' },
  { id: 'app_alibi_archives', type: 'app_alibi_archives', title: 'Alibi Archives', icon: MagnifyingGlassIcon, category: 'games' },
  { id: 'app_world_weaver', type: 'app_world_weaver', title: 'Atlas', icon: Globe, category: 'games' },
  { id: 'app_chess', type: 'app_chess', title: 'Strategic Command', icon: Crown, category: 'games' },
  { id: 'app_sovereigns_gambit', type: 'app_sovereigns_gambit', title: 'Sovereign\'s Gambit', icon: Crown, category: 'games' },
  { id: 'app_exchange', type: 'app_exchange', title: 'Aetherium Exchange', icon: CandlestickChart, category: 'system' },
  { id: 'app_terraformer', type: 'app_terraformer', title: 'Terraformer', icon: Mountain, category: 'ai' },
  { id: 'app_bug_hunter', type: 'app_bug_hunter', title: 'Bug Hunter', icon: Bug, category: 'ai' },
  { id: 'app_quantum_ascent', type: 'app_quantum_ascent', title: 'Quantum Ascent', icon: Atom, category: 'games' },
  { id: 'app_quantum_siege', type: 'app_quantum_siege', title: 'Quantum Siege', icon: TowerControl, category: 'games' },
  { id: 'app_echoes', type: 'app_echoes', title: 'Echoes of Infinity', icon: BrainCircuit, category: 'games' },
  { id: 'app_echoes_of_pallet_town', type: 'app_echoes_of_pallet_town', title: 'Echoes of Pallet Town', icon: FlaskConical, category: 'games' },
  { id: 'app_nine_ball_enigma', type: 'app_nine_ball_enigma', title: 'The Nine-Ball Enigma', icon: EightBallIcon, category: 'games' },
  { id: 'nav_image', type: 'nav', title: 'Image Creator', href: '/image', icon: ImageIcon, category: 'ai' },
  { id: 'nav_story', type: 'nav', title: 'Story Creator', href: '/story', icon: BookText, category: 'ai' },
  { id: 'nav_music', type: 'nav', title: 'Music Lab', href: '/music', icon: Music, category: 'ai' },
  { id: 'nav_speech', type: 'nav', title: 'Speech AI', href: '/speech', icon: AudioLines, category: 'ai' },
  { id: 'nav_composer', type: 'nav', title: 'Composition Studio', href: '/video', icon: Video, category: 'ai' },
  { id: 'nav_creations', type: 'nav', title: 'Creations', href: '/creations', icon: CreationsIcon, category: 'system' },
  { id: 'nav_secure_share', type: 'nav', title: 'Secure Share', href: '/secure-share', icon: Share2, category: 'system' },
];


export default function DesktopPage() {
    const { creations, addCreation, removeCreation, isLoaded } = useCreations();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentPath, setCurrentPath] = useState('/');
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [isZipping, setIsZipping] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const isMobile = useIsMobile();
    
    const [windows, setWindows] = useState<WindowState[]>([]);
    const nextZIndex = useRef(10);
    const router = useRouter();
    const { toggleChat } = useChatWidget();
    const [isStartMenuOpen, setIsStartMenuOpen] = useState(false);
    
    const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
    const [isWallpaperDialogOpen, setIsWallpaperDialogOpen] = useState(false);
    const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
    
    useEffect(() => {
        const savedWallpaper = localStorage.getItem('infinite-universe-wallpaper');
        if (savedWallpaper) {
            setWallpaperUrl(savedWallpaper);
        }
    }, []);

    const { items, breadcrumbs } = useMemo(() => {
        const filtered = creations
            .filter(c => c.path === currentPath)
            .sort((a, b) => {
                if (a.type === 'folder' && b.type !== 'folder') return -1;
                if (a.type !== 'folder' && b.type === 'folder') return 1;
                return a.title.localeCompare(b.title);
            });
        
        const pathParts = currentPath.split('/').filter(p => p);
        const crumbs = [{ name: 'Root', path: '/' }];
        let cumulativePath = '/';
        for (const part of pathParts) {
            cumulativePath += part + '/';
            crumbs.push({ name: part, path: cumulativePath });
        }

        return { items: filtered, breadcrumbs: crumbs };
    }, [creations, currentPath]);

    const launchAndFocus = useCallback((item: Creation | { id: string; type: WindowState['type']; title: string; }) => {
        setWindows(currentWindows => {
            const newZ = nextZIndex.current++;
            let windowExists = false;

            const updatedWindows = currentWindows.map(w => {
                const isTarget = w.creationId === item.id;
                windowExists = windowExists || isTarget;
                return {
                  ...w,
                  z: isTarget ? newZ : w.z,
                  isMinimized: !isTarget,
                };
            });

            if (!windowExists) {
                const newWindow: WindowState = {
                    id: `win-${item.id}-${Date.now()}`,
                    creationId: item.id,
                    type: item.type as WindowState['type'],
                    title: item.title,
                    x: Math.random() * 200 + 50,
                    y: Math.random() * 100 + 50,
                    z: newZ,
                    isMinimized: false,
                };
                return [...updatedWindows, newWindow];
            }
            
            return updatedWindows;
        });
    }, []);

    const closeWindow = (id: string) => {
        setWindows(windows.filter(w => w.id !== id));
    };

    const bringToFront = useCallback((id: string) => {
        setWindows(currentWindows => {
            const windowToFront = currentWindows.find(w => w.id === id);
            if (!windowToFront) return currentWindows;

            const newZ = nextZIndex.current++;
            return currentWindows.map(w => 
                w.id === id ? { ...w, z: newZ, isMinimized: false } : w
            );
        });
    }, []);

    const toggleMinimize = (id: string) => {
        const windowToToggle = windows.find(w => w.id === id);
        if (!windowToToggle) return;

        if (windowToToggle.isMinimized) {
            bringToFront(id);
        } else {
            setWindows(currentWindows => currentWindows.map(w => 
                w.id === id ? { ...w, isMinimized: true } : w
            ));
        }
    };
    
    const handleAppLaunch = useCallback((app: typeof APPS[number]) => {
        if (app.id === 'app_chat') {
            toggleChat();
        } else if (app.type.startsWith('app_')) {
            launchAndFocus(app);
        } else if (app.type === 'nav' && app.href) {
            router.push(app.href);
        }
        setIsStartMenuOpen(false);
    }, [launchAndFocus, router, toggleChat]);

    const handleItemLaunch = (item: Creation) => {
        handleDoubleClick(item);
        setIsAppDrawerOpen(false);
    };

    const handleExtractZip = async (item: Creation) => {
        if (isExtracting) return;
        if (!(item.data instanceof Blob)) {
            toast({ title: 'Invalid File', description: 'Cannot extract this file type.', variant: 'destructive' });
            return;
        }
        setIsExtracting(true);
        const newFolderName = item.title.replace(/\.zip$/i, '');
        const newFolderPath = currentPath + newFolderName + '/';
        toast({ title: 'Extracting Archive', description: `Extracting "${item.title}"...` });

        try {
            await addCreation({ type: 'folder', title: newFolderName, path: currentPath, prompt: `Extracted from ${item.title}`, data: null });
            
            const zip = new JSZip();
            const contents = await zip.loadAsync(item.data);
            
            const creationPromises = [];
            for (const filename in contents.files) {
                const file = contents.files[filename];
                if (!file.dir) {
                    const blob = await file.async('blob');
                    creationPromises.push(addCreation({
                        type: 'file',
                        title: filename.split('/').pop() || filename,
                        path: newFolderPath,
                        prompt: `Extracted from ${item.title}`,
                        data: blob,
                    }));
                }
            }
            await Promise.all(creationPromises);

            toast({ title: 'Extraction Complete', description: `Contents of "${item.title}" are in the "${newFolderName}" folder.` });
        } catch (err) {
            console.error(err);
            toast({ title: 'Extraction Failed', description: 'The zip file may be corrupt or unsupported.', variant: 'destructive' });
        } finally {
            setIsExtracting(false);
        }
    };

    const handleDoubleClick = (item: Creation) => {
      if (item.type === 'file' && item.title.toLowerCase().endsWith('.zip')) {
        handleExtractZip(item);
      } else if (item.type === 'folder') {
        setCurrentPath(item.path + item.title + '/');
      } else {
        launchAndFocus(item);
      }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        await addCreation({ type: 'folder', title: newFolderName.trim(), path: currentPath, prompt: '', data: null });
        toast({ title: `Folder "${newFolderName.trim()}" created.` });
        setNewFolderName('');
        setIsNewFolderOpen(false);
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };
    
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        toast({ title: "Uploading...", description: `Saving "${file.name}" to your virtual drive.`});
        await addCreation({ type: 'file', title: file.name, path: currentPath, prompt: 'Uploaded file', data: file });
        toast({ title: "File uploaded successfully!" });
        if(fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownloadBackup = async () => {
        if (!creations.length) return;
        setIsZipping(true);
        toast({ title: "Creating Backup..." });
        const zip = new JSZip();
        for (const c of creations) {
            if (c.type !== 'folder') {
                const fullPath = (c.path + c.title).substring(1);
                zip.file(fullPath, c.data instanceof Blob ? c.data : new Blob([JSON.stringify(c.data)]));
            }
        }
        const content = await zip.generateAsync({ type: "blob" });
        handleDownload(URL.createObjectURL(content), `gemini-studio-backup.zip`);
        setIsZipping(false);
    };

    const handleDownload = (url: string, filename: string) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
    }
    
    const topWindow = isMobile 
        ? windows.filter(w => !w.isMinimized).sort((a, b) => b.z - a.z)[0]
        : null;
        
    const handleDesktopContextMenu = (e: React.MouseEvent) => {
        if (isMobile) return;
        e.preventDefault();
        setIsWallpaperDialogOpen(true);
    };

    const imageCreations = useMemo(() => {
        return creations.filter(c => c.type === 'image' || (c.type === 'file' && c.data instanceof Blob && c.data.type?.startsWith('image/')));
    }, [creations]);

    const handleSetWallpaper = (creation: Creation) => {
        const imageUrl = creation.data?.imageUrl || (creation.data instanceof Blob ? URL.createObjectURL(creation.data) : null);
        if (imageUrl) {
            setWallpaperUrl(imageUrl);
            localStorage.setItem('infinite-universe-wallpaper', imageUrl);
            setIsWallpaperDialogOpen(false);
            toast({ title: "Wallpaper Updated!" });
        } else {
            toast({ title: "Invalid Image", description: "Could not use this file as wallpaper.", variant: "destructive" });
        }
    };
    
    const quickSettingsIcons = [
        { id: 'app_vault', title: "Vault", icon: Shield },
        { id: 'app_browser', title: "Browser", icon: Globe },
        { id: 'app_terminal', title: "Terminal", icon: TerminalIcon },
        { id: 'nav_settings', title: "Settings", icon: Settings },
        { id: 'app_chat', title: "AI Chat", icon: Bot },
        { id: 'app_copilots', title: "Copilots", icon: Bot },
    ]

    return (
      <div 
        className="h-full flex flex-col bg-muted/20 bg-cover bg-center transition-all duration-500"
        style={wallpaperUrl ? { backgroundImage: `url(${wallpaperUrl})` } : {}}
        onContextMenu={handleDesktopContextMenu}
      >
        <header className="flex-shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-2 border-b bg-background/80 backdrop-blur-sm">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground flex-wrap">
                {breadcrumbs.map((crumb, index) => (
                    <React.Fragment key={crumb.path}>
                        <button onClick={() => setCurrentPath(crumb.path)} className="hover:underline disabled:text-foreground disabled:no-underline" disabled={index === breadcrumbs.length - 1}>
                            {crumb.name === 'Root' ? <HardDrive className="h-4 w-4" /> : crumb.name}
                        </button>
                        {index < breadcrumbs.length - 1 && <ChevronRight className="h-4 w-4" />}
                    </React.Fragment>
                ))}
            </div>
             <div className="flex flex-wrap gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <Button onClick={handleUploadClick} variant="outline" size="sm"><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
                    <DialogTrigger asChild><Button size="sm"><FolderPlus className="mr-2 h-4 w-4" /> New Folder</Button></DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Create New Folder</DialogTitle></DialogHeader>
                        <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}/>
                        <DialogFooter><DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose><Button onClick={handleCreateFolder}>Create</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
                <Button onClick={handleDownloadBackup} variant="outline" size="sm" disabled={isZipping || isExtracting || !isLoaded}>
                    {isZipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                    Backup
                </Button>
             </div>
        </header>

        <main className="flex-grow p-4 relative overflow-auto">
            {isLoaded && isMobile && (
                 <div className="grid grid-cols-4 gap-x-4 gap-y-8">
                    {items.map((item) => (
                        <div key={item.id} className="relative flex flex-col items-center text-center gap-2 cursor-pointer group" onDoubleClick={() => handleDoubleClick(item)}>
                            {getIcon(item.type, true, item.title)}
                            <p className="text-xs break-words w-full group-hover:text-primary">{item.title}</p>
                        </div>
                    ))}
                </div>
            )}
            
            {isLoaded && !isMobile && (
                <Popover open={isAppDrawerOpen} onOpenChange={setIsAppDrawerOpen}>
                    <PopoverTrigger asChild>
                        <div className="relative flex flex-col items-center text-center gap-2 cursor-pointer group w-20 hover:scale-105 transition-transform">
                            <LayoutGrid className="h-12 w-12 text-white/90 drop-shadow-lg" />
                            <p className="text-xs text-white font-semibold drop-shadow-lg">My Files</p>
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-96 bg-background/80 backdrop-blur-sm border-white/20">
                        <ScrollArea className="h-96">
                            <div className="grid grid-cols-4 gap-x-4 gap-y-8 p-4">
                                {items.map((item) => (
                                    <div key={item.id} className="relative flex flex-col items-center text-center gap-2 cursor-pointer group" onDoubleClick={() => handleItemLaunch(item)} title={item.title}>
                                        {getIcon(item.type, true, item.title)}
                                        <p className="text-xs break-words w-full group-hover:text-primary">{item.title}</p>
                                        <AlertDialog><AlertDialogTrigger asChild>
                                            <button className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete" onClick={e => e.stopPropagation()}><Trash2 className="h-4 w-4 text-destructive" /></button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete "{item.title}"{item.type === 'folder' && ' and all its contents'}.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => removeCreation(item.id)}>Continue</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent></AlertDialog>
                                    </div>
                                ))}
                                {items.length === 0 && <p className="col-span-4 text-center text-muted-foreground">This folder is empty.</p>}
                            </div>
                        </ScrollArea>
                    </PopoverContent>
                </Popover>
            )}
            
            <div className="absolute inset-0 pointer-events-none">
                 {isMobile ? (
                    topWindow && (
                        <Window key={topWindow.id} state={topWindow} onClose={() => closeWindow(topWindow.id)} onFocus={() => bringToFront(topWindow.id)} onMinimize={() => toggleMinimize(topWindow.id)} />
                    )
                ) : (
                    windows.map(windowState => (
                        <Window key={windowState.id} state={windowState} onClose={() => closeWindow(windowState.id)} onFocus={() => bringToFront(windowState.id)} onMinimize={() => toggleMinimize(windowState.id)} />
                    ))
                )}
            </div>
        </main>

        <footer className="flex-shrink-0 h-12 bg-background/80 backdrop-blur-sm border-t p-1 flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
                <Popover open={isStartMenuOpen} onOpenChange={setIsStartMenuOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" className="h-full px-3 flex items-center gap-2 font-bold text-primary">
                            <LayoutGrid className="h-5 w-5" />
                            DoN
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start" className="w-[300px] p-2 mb-1 bg-slate-800/90 backdrop-blur-md border-slate-700 text-white">
                        <div className="p-2 space-y-4">
                            <div className="flex justify-between items-center px-2">
                                 <div className="font-semibold">Infinite Universe</div>
                                 <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10" onClick={() => handleAppLaunch(APPS.find(app => app.id === 'nav_settings')!)}><Settings className="h-5 w-5" /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10"><Power className="h-5 w-5" /></Button>
                                 </div>
                            </div>
                            <ScrollArea className="h-64">
                                <div className="grid grid-cols-4 gap-2 pr-4">
                                   {APPS.map(app => (
                                       <Button key={app.id} variant="ghost" className="flex-col h-16 bg-white/5 hover:bg-white/10 p-1" onClick={() => handleAppLaunch(app)}>
                                           <app.icon className="h-5 w-5" />
                                           <span className="text-xs mt-1 text-center leading-tight">{app.title}</span>
                                       </Button>
                                   ))}
                                </div>
                            </ScrollArea>
                            <div className="space-y-4 px-2">
                                <div className="flex items-center gap-2">
                                    <Sun className="h-5 w-5" />
                                    <Slider defaultValue={[50]} max={100} step={1} />
                                    <Moon className="h-5 w-5" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <PlayIcon className="h-5 w-5" />
                                    <Slider defaultValue={[75]} max={100} step={1} />
                                    <Volume2 className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
                <Separator orientation="vertical" className="h-3/4" />
                <div className="flex-grow h-full overflow-x-auto">
                    <Taskbar windows={windows} onTaskbarClick={toggleMinimize} />
                </div>
            </div>
            <div className="text-xs text-muted-foreground px-4 shrink-0">
                &copy; 2025 DoN
            </div>
        </footer>
        {!isMobile && <ChatWidget />}
        <FloatingChatIcon />
        
        <Dialog open={isWallpaperDialogOpen} onOpenChange={setIsWallpaperDialogOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Change Wallpaper</DialogTitle>
                    <DialogDescription>Select an image from your creations to set as your desktop background.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-96 my-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
                        {imageCreations.map(creation => {
                           const url = creation.data.imageUrl || (creation.data instanceof Blob ? URL.createObjectURL(creation.data) : null);
                           return url ? (
                            <div key={creation.id} className="relative aspect-video rounded-md overflow-hidden cursor-pointer group" onClick={() => handleSetWallpaper(creation)}>
                                <Image src={url} alt={creation.title} fill className="object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white font-bold text-sm text-center p-1">{creation.title}</p>
                                </div>
                            </div>
                           ) : null
                        })}
                         {imageCreations.length === 0 && (
                            <p className="col-span-full text-center text-muted-foreground">No images found in your creations.</p>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
      </div>
    );
}
