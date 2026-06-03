
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { tools } from '@/ai/tools';
import { getFriendlyAIError } from '@/lib/utils';
import { type GenerateMysteryOutput } from '@/ai/schemas/alibi-archives';
import { type GenerateItineraryOutput } from '@/ai/schemas/world-weaver';
import { type WorldWeaverOutput } from '@/ai/schemas/world-weaver';


function ResultCard({ children, error }: { children: React.ReactNode, error?: string | null }) {
    if (error) {
        return (
            <div className="p-4 border border-destructive/50 rounded-lg text-destructive text-sm flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                <span>{error}</span>
            </div>
        );
    }
    return <div className="border rounded-lg p-3 bg-card/50">{children}</div>;
}

// --- Specific Result Renderers ---

const renderAlibiArchivesResult = (data: GenerateMysteryOutput) => (
    <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="p-1">
            <CardTitle>{data.caseTitle}</CardTitle>
            <CardDescription>Generated in Alibi Archives</CardDescription>
        </CardHeader>
        <CardContent className="p-1">
            <ScrollArea className="h-32">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.setting}</p>
            </ScrollArea>
        </CardContent>
    </Card>
);

const renderItineraryPlannerResult = (data: GenerateItineraryOutput) => (
    <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="p-1">
            <CardTitle>{data.title}</CardTitle>
            <CardDescription>Generated in Itinerary Planner</CardDescription>
        </CardHeader>
        <CardContent className="p-1">
            <ScrollArea className="h-32">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.summary}</p>
            </ScrollArea>
        </CardContent>
    </Card>
);

const renderWorldWeaverResult = (data: WorldWeaverOutput) => (
    <Card className="shadow-none border-none bg-transparent">
        <CardHeader className="p-1">
            <CardTitle>{data.name}</CardTitle>
            <CardDescription>Generated in Blueprint Weaver</CardDescription>
        </CardHeader>
        <CardContent className="p-1">
            <ScrollArea className="h-32">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{data.synopsis}</p>
            </ScrollArea>
        </CardContent>
    </Card>
);


function OpenAppResult({ appName }: { appName: string }) {
    const router = useRouter();
    const { toggleChat } = useChatWidget();
    const isMobile = useIsMobile();
    const [status, setStatus] = useState(`Navigating to ${appName}...`);

    useEffect(() => {
        const paths: { [key: string]: string } = {
            'vault': '/desktop',
            'desktop': '/desktop',
            'creations': '/creations',
            'settings': '/settings',
            'copilots': '/desktop',
            'terraformer': '/desktop',
            'exchange': '/desktop',
        };
        
        const path = paths[appName?.toLowerCase()];
        
        if (path) {
            if (path.startsWith('/desktop')) {
                // In a real scenario, this would post a message to the desktop component
                // to open a specific app window. For now, we just go to the desktop.
                router.push(path);
            } else {
                router.push(path);
            }
            if (!isMobile) {
                setTimeout(() => toggleChat(), 500);
            }
        } else {
            setStatus(`Error: Application '${appName}' not found.`);
        }
    }, [appName, router, toggleChat, isMobile]);

    return (
        <div className="flex items-center gap-2 text-sm p-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{status}</span>
        </div>
    );
}

const resultRenderers: Record<string, (data: any) => React.ReactNode> = {
    alibiArchives: renderAlibiArchivesResult,
    itineraryPlanner: renderItineraryPlannerResult,
    worldWeaver: renderWorldWeaverResult,
};

export function ToolResultRenderer({ tool, parameters }: { tool: string, parameters: any }) {
    const [result, setResult] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
      const selectedTool = tools.find(t => t.name === tool);
      if (!selectedTool) {
        setError(`Error: Tool "${tool}" not found.`);
        setIsLoading(false);
        return;
      }
      
      // Special case for opening apps - no server call needed.
      if (tool === 'openApp') {
          setResult({ appName: parameters.appName });
          setIsLoading(false);
          return;
      }

      // Execute the tool's flow function
      selectedTool.fn(parameters)
        .then(res => setResult(res))
        .catch(err => setError(getFriendlyAIError(err)))
        .finally(() => setIsLoading(false));
    }, [tool, parameters]);

    if (tool === 'openApp' && result) {
       return <OpenAppResult appName={result.appName} />
    }

    return (
        <ResultCard error={error}>
            {isLoading && <Skeleton className="h-40 w-full" />}
            {result && (resultRenderers[tool] ? resultRenderers[tool](result) : <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>)}
        </ResultCard>
    );
}
