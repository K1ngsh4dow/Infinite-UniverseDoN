
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, RotateCw, Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export const Browser = () => {
    const [inputUrl, setInputUrl] = useState('https://www.google.com/webhp?igu=1');
    const [currentUrl, setCurrentUrl] = useState('https://www.google.com/webhp?igu=1');
    const [isLoading, setIsLoading] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('mobile');

    const handleNavigate = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!inputUrl) return;

        let finalUrl = inputUrl;
        if (!/^https?:\/\//i.test(inputUrl)) {
            finalUrl = 'https://' + inputUrl;
        }
        setIsLoading(true);
        setCurrentUrl(finalUrl);
    };

    const handleNavAction = (action: 'back' | 'forward' | 'refresh') => {
        const iframe = iframeRef.current;
        if (!iframe || !iframe.contentWindow) return;

        try {
            setIsLoading(true);
            switch(action) {
                case 'back':
                    iframe.contentWindow.history.back();
                    break;
                case 'forward':
                    iframe.contentWindow.history.forward();
                    break;
                case 'refresh':
                    iframe.contentWindow.location.reload();
                    break;
            }
        } catch (e) {
            console.error("Browser navigation error (likely cross-origin):", e);
            setIsLoading(false);
        }
    };
    
    const handleIframeLoad = () => {
        setIsLoading(false);
        try {
            const newUrl = iframeRef.current?.contentWindow?.location.href;
            if (newUrl && newUrl !== 'about:blank' && !newUrl.startsWith('https://www.google.com/webhp?igu=1')) {
                setInputUrl(newUrl);
            }
        } catch (e) {
             console.log("Cannot access iframe URL (cross-origin).");
        }
    };

    return (
        <div className="flex flex-col h-full bg-muted/50">
            <header className="flex-shrink-0 p-2 border-b bg-background flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleNavAction('back')}><ArrowLeft className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleNavAction('forward')}><ArrowRight className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleNavAction('refresh')}><RotateCw className="h-4 w-4" /></Button>
                <form onSubmit={handleNavigate} className="flex-grow">
                    <Input 
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder="Enter a URL"
                    />
                </form>
                 <Button onClick={() => handleNavigate()}>Go</Button>
                 <Button variant="outline" size="icon" onClick={() => setViewMode(v => v === 'mobile' ? 'desktop' : 'mobile')} title={viewMode === 'mobile' ? "Switch to Desktop View" : "Switch to Mobile View"}>
                    {viewMode === 'mobile' ? <Monitor className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
                </Button>
            </header>
            <main className="relative flex-grow bg-slate-900 flex items-center justify-center p-4 overflow-auto">
                 {isLoading && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary/20 overflow-hidden z-20">
                        <div className="h-full w-full animate-loading-bar bg-gradient-to-r from-transparent via-primary to-transparent" />
                    </div>
                )}
                 <div
                    className={cn(
                        "transition-all duration-300 ease-in-out flex-shrink-0",
                        viewMode === 'mobile'
                            ? "w-[375px] h-[812px] bg-gray-900 rounded-[40px] border-[14px] border-gray-900 shadow-2xl overflow-hidden box-content relative"
                            : "w-full h-full"
                    )}
                >
                    {viewMode === 'mobile' && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-7 bg-gray-900 rounded-b-xl z-20" /> 
                    )}
                    <iframe
                        ref={iframeRef}
                        src={currentUrl}
                        className="w-full h-full border-0 bg-white"
                        title="In-app browser"
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        onLoad={handleIframeLoad}
                    />
                </div>
            </main>
        </div>
    );
};
