
'use client';

import { WindowState, getIcon } from './utils';
import { Button } from '@/components/ui/button';

interface TaskbarProps {
    windows: WindowState[];
    onTaskbarClick: (id: string) => void;
}

export const Taskbar = ({ windows, onTaskbarClick }: TaskbarProps) => {
    return (
        <div className="flex items-center gap-2 h-full">
            {windows.map(win => (
                <Button
                    key={win.id}
                    variant={win.isMinimized ? 'outline' : 'secondary'}
                    className="flex items-center gap-2 h-full px-3 flex-shrink-0"
                    onClick={() => onTaskbarClick(win.id)}
                >
                    {getIcon(win.type, false, win.title)}
                    <span className="text-xs truncate">{win.title}</span>
                </Button>
            ))}
        </div>
    )
}
