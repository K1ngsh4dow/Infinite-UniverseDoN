
'use client';

import React, { useMemo } from 'react';
import { Loader2, ThumbsDown, ThumbsUp, Wand2, RefreshCw, AlertTriangle } from 'lucide-react';
import { ToolResultRenderer } from './result-renderers';
import { Button } from '../ui/button';
import { useChatWidget } from '@/context/ChatWidgetContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRouter } from 'next/navigation';

interface Suggestion {
  tool: string;
  label: string;
  parameters: Record<string, any>;
}

const SuggestionsRenderer = ({ suggestions }: { suggestions: Suggestion[] }) => {
    const { setPendingMessage } = useChatWidget();
    const isMobile = useIsMobile();
    const router = useRouter();


    const handleSuggestionClick = (suggestion: Suggestion) => {
        const toolCall = {
            tool: suggestion.tool,
            summary: `Okay, I will ${suggestion.label.toLowerCase()}.`,
            parameters: suggestion.parameters,
        };
        const message = "```json\n" + JSON.stringify(toolCall, null, 2) + "\n```";
        
        if (isMobile) {
            // For mobile, we might be on a different page. We use localStorage to communicate.
            localStorage.setItem('chat-suggestion-clicked', message);
            router.push('/chat');
        } else {
             setPendingMessage(message);
        }
    };

    return (
        <div className="space-y-2 pt-2">
            {suggestions.map((suggestion, index) => (
                <Button key={index} variant="outline" className="w-full justify-start gap-2" onClick={() => handleSuggestionClick(suggestion)}>
                    <Wand2 className="h-4 w-4" />
                    {suggestion.label}
                </Button>
            ))}
        </div>
    );
};

export const AssistantMessage = ({
  content,
  isLoading,
  onRetry,
}: {
  content: string;
  isLoading: boolean;
  onRetry?: () => void;
}) => {
  const { toolCall, suggestions, summary, error } = useMemo(() => {
    // No special handling for isLoading. We attempt to parse on every content change.
    // The regex and try/catch will handle partial content gracefully.
    const regexes = {
        tool: /```json\s*(\{[\s\S]*?"tool":[\s\S]*?\})\s*```/,
        suggestions: /```json\s*(\{[\s\S]*?"suggestions":[\s\S]*?\})\s*```/,
    };

    for (const [key, regex] of Object.entries(regexes)) {
        const match = content.match(regex);
        if (match?.[1]) {
            try {
                const parsed = JSON.parse(match[1]);
                return {
                    toolCall: key === 'tool' ? parsed : null,
                    suggestions: key === 'suggestions' ? parsed : null,
                    summary: parsed.summary || content.replace(regex, '').trim(),
                    error: null,
                };
            } catch (e) {
                // This can happen if the JSON is incomplete during streaming.
                // We'll fall through and just render the raw content.
                console.warn("Parsing assistant message failed, likely due to streaming.", e);
            }
        }
    }
    // If no parsable block is found, just return the raw content.
    return { toolCall: null, suggestions: null, summary: content, error: null };
  }, [content]);
  
  const isError = useMemo(() => {
    return summary?.startsWith('Sorry, I encountered an error.');
  }, [summary]);

  if (!content && isLoading) {
    return <div className="p-3"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  }
  
  return (
    <div className="space-y-2">
      <div className={cn(
        "p-3 rounded-lg space-y-3",
        isError ? "bg-destructive/10" : "bg-muted"
      )}>
        {summary && (
            <p className="whitespace-pre-wrap flex items-start gap-2">
              {isError && <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />}
              <span>{summary}</span>
            </p>
        )}
        
        {toolCall && <ToolResultRenderer tool={toolCall.tool} parameters={toolCall.parameters} />}

        {suggestions?.suggestions && <SuggestionsRenderer suggestions={suggestions.suggestions} />}

        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
      <div className="flex items-center gap-2">
        {!isLoading && !isError && (
          <>
            <Button variant="ghost" size="icon" className="h-7 w-7"><ThumbsUp className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"><ThumbsDown className="h-4 w-4" /></Button>
          </>
        )}
        {!isLoading && isError && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="h-auto py-1 px-2 text-xs">
              <RefreshCw className="mr-1.5 h-3 w-3" />
              Try Again
            </Button>
        )}
      </div>
    </div>
  );
};
