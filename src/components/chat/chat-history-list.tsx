
'use client';

import React from 'react';
import { ChatSession } from '@/hooks/use-chat-history';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FilePenLine, GitFork, Share2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatHistoryListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSessionSelect: (id: string) => void;
  onRename: (session: ChatSession) => void;
  onFork: (id: string) => void;
  onShare: (session: ChatSession) => void;
  onDelete: (id: string) => void;
  asDropdown?: boolean;
}

export const ChatHistoryList = ({
  sessions,
  activeSessionId,
  onSessionSelect,
  onRename,
  onFork,
  onShare,
  onDelete,
  asDropdown = false,
}: ChatHistoryListProps) => {

  const renderSessionItem = (session: ChatSession) => (
    <div key={session.id} className="flex items-center gap-2 group w-full">
      <Button
        variant={!asDropdown && activeSessionId === session.id ? 'secondary' : 'ghost'}
        onClick={() => onSessionSelect(session.id)}
        className={cn(
          "w-full justify-start truncate",
           asDropdown && activeSessionId === session.id && "bg-accent"
        )}
      >
        {session.title}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-50 group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()} // Prevent parent click
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={() => onRename(session)}>
            <FilePenLine className="mr-2 h-4 w-4" />Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onFork(session.id)}>
            <GitFork className="mr-2 h-4 w-4" />Fork
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onShare(session)}>
            <Share2 className="mr-2 h-4 w-4" />Share
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            onSelect={() => onDelete(session.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  if (asDropdown) {
    return (
      <>
        {sessions.map(session => (
            <DropdownMenuItem key={session.id} onSelect={(e) => e.preventDefault()} className="p-0 focus:bg-transparent">
              {renderSessionItem(session)}
            </DropdownMenuItem>
        ))}
      </>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map(session => renderSessionItem(session))}
    </div>
  );
};
