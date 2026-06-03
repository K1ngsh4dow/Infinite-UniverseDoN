
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useCreations } from '@/context/CreationsContext';
import { cn } from '@/lib/utils';
import { donaldbein, DonaldbeinOutput } from '@/ai/flows/architect-feature-flow';
import { getFriendlyAIError } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface OutputLine {
  id: number;
  type: 'command' | 'response' | 'error' | 'special';
  cwd: string;
  content: string | React.ReactNode;
}

const formatArchitectOutput = (output: DonaldbeinOutput): React.ReactNode => {
    return (
        <div className="space-y-4 text-white">
            <div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">[ Grand Vision ]</h3>
                <p className="whitespace-pre-wrap">{output.grandVision}</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">[ Critique ]</h3>
                <p className="whitespace-pre-wrap">{output.critique}</p>
            </div>
            <div>
                <h3 className="text-lg font-bold text-cyan-400 mb-2">[ Roadmap ]</h3>
                <div className="space-y-3">
                    {output.roadmap.map((phase, pIndex) => (
                        <div key={pIndex} className="pl-2 border-l-2 border-cyan-400/50">
                            <h4 className="font-semibold text-amber-400">{phase.phaseTitle}</h4>
                            <p className="text-sm text-gray-400 italic mb-2">{phase.phaseDescription}</p>
                            <div className="space-y-2 pl-4">
                                {phase.steps.map((step, sIndex) => (
                                    <div key={sIndex}>
                                        <p className="font-semibold text-gray-300">{step.stepNumber}. {step.stepTitle}</p>
                                        <p className="text-sm text-gray-400 whitespace-pre-wrap">{step.stepDescription}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

const LoadingIndicator = () => {
  const [message, setMessage] = useState('');
  const messages = [
    'Engaging architectural subroutine...',
    'Parsing feature request...',
    'Allocating quantum compute cycles...',
    'Engaging Gemini Core...',
    'Compiling development proposal...',
    'Rendering blueprint...',
  ];

  useEffect(() => {
    let index = 0;
    setMessage(messages[index]);
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setMessage(messages[index]);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-gray-400 flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      {message}
    </div>
  );
};


export const Terminal = () => {
    const { creations, addCreation } = useCreations();
    const [cwd, setCwd] = useState('/'); // Current Working Directory
    const [output, setOutput] = useState<OutputLine[]>(() => [
        { id: 0, type: 'response', cwd: '/', content: 'Welcome to the Virtual Terminal. Type `help` for a list of commands.' }
    ]);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [currentInput, setCurrentInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const isOnline = useOnlineStatus();

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
    }, [output, isProcessing]);

    const addOutput = (line: Omit<OutputLine, 'id'>) => {
        setOutput(prev => [...prev, { ...line, id: prev.length }]);
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setCurrentInput(e.target.value);
    };

    const handleCommand = async (command: string) => {
        const [cmd, ...args] = command.trim().split(' ').filter(Boolean);
        if (!cmd) return;

        addOutput({ type: 'command', cwd, content: command });
        if (command) setHistory(prev => [command, ...prev]);
        setHistoryIndex(-1);
        
        const pathJoin = (...parts: string[]) => {
          const newPath = parts.join('/').replace(/\/+/g, '/');
          return newPath === '/' ? newPath : newPath.replace(/\/$/, '');
        }
        
        const resolvePath = (path: string): string => {
            if (path.startsWith('/')) return pathJoin('/', path);
            return pathJoin(cwd, path);
        };
        
        switch (cmd.toLowerCase()) {
            case 'help':
                addOutput({ type: 'response', cwd, content: 'Available commands: ls, cd, cat, mkdir, clear, help, architect' });
                break;
            case 'clear':
                setOutput([]);
                break;
            case 'ls':
                const items = creations.filter(c => c.path === cwd);
                if (items.length === 0) {
                    addOutput({ type: 'response', cwd, content: 'Empty directory.' });
                } else {
                    const listing = items.map(c => c.type === 'folder' ? `${c.title}/` : c.title).join('\n');
                    addOutput({ type: 'response', cwd, content: listing });
                }
                break;
            case 'cd':
                const targetPath = args[0] || '/';
                if (targetPath === '..') {
                  const parentPath = cwd.split('/').slice(0, -2).join('/') + '/';
                  setCwd(parentPath || '/');
                } else {
                  const newPathRaw = resolvePath(targetPath);
                  const newPath = newPathRaw.endsWith('/') ? newPathRaw : `${newPathRaw}/`;

                  if (newPath === '/') {
                      setCwd('/');
                  } else {
                    const folderExists = creations.some(c => c.type === 'folder' && c.path + c.title + '/' === newPath);
                    if (folderExists) {
                        setCwd(newPath);
                    } else {
                        addOutput({ type: 'error', cwd, content: `cd: no such file or directory: ${targetPath}` });
                    }
                  }
                }
                break;
            case 'mkdir':
                if (!args[0]) {
                    addOutput({ type: 'error', cwd, content: 'mkdir: missing operand' });
                } else {
                    await addCreation({ type: 'folder', title: args[0], path: cwd, prompt: '', data: null });
                    addOutput({ type: 'response', cwd, content: `Folder '${args[0]}' created.`});
                }
                break;
            case 'cat':
                if (!args[0]) {
                    addOutput({ type: 'error', cwd, content: 'cat: missing operand' });
                } else {
                    const filePath = resolvePath(args[0]);
                    const file = creations.find(c => c.path + c.title === filePath);
                    if (!file || file.type === 'folder') {
                        addOutput({ type: 'error', cwd, content: `cat: ${args[0]}: No such file or it's a directory` });
                    } else if (file.data instanceof Blob) {
                        const text = await file.data.text();
                        addOutput({ type: 'response', cwd, content: text });
                    } else if (file.type === 'story') {
                        addOutput({ type: 'response', cwd, content: file.data.story });
                    } else {
                         addOutput({ type: 'error', cwd, content: `cat: ${args[0]}: Cannot read this file type` });
                    }
                }
                break;
            
            case 'architect':
                if (!isOnline) {
                    addOutput({ type: 'error', cwd, content: 'architect: This command requires an internet connection.' });
                    return;
                }
                const regex = /"([^"]+)"/g;
                const parsedArgs = [...command.matchAll(regex)].map(m => m[1]);
                const [featureName, featureDescription, coreMechanics] = parsedArgs;

                if (!featureName || !featureDescription || !coreMechanics) {
                    addOutput({ type: 'error', cwd, content: 'Usage: architect "Feature Name" "Feature Description" "Core Mechanics"' });
                    return;
                }
                setIsProcessing(true);
                
                try {
                    const result = await donaldbein({ featureName, featureDescription, coreMechanics });
                    addOutput({type: 'special', cwd, content: formatArchitectOutput(result)});
                } catch (e) {
                     addOutput({ type: 'error', cwd, content: `Architecture failed: ${getFriendlyAIError(e)}` });
                } finally {
                    setIsProcessing(false);
                }
                break;

            default:
                addOutput({ type: 'error', cwd, content: `command not found: ${cmd}` });
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isProcessing) return;
        handleCommand(currentInput);
        setCurrentInput('');
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isProcessing) return;
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newIndex = Math.min(history.length - 1, historyIndex + 1);
            setHistoryIndex(newIndex);
            setCurrentInput(history[newIndex] || '');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newIndex = Math.max(-1, historyIndex - 1);
            setHistoryIndex(newIndex);
            setCurrentInput(history[newIndex] || '');
        }
    };

    return (
        <div className="bg-[#1e1e1e] text-gray-300 font-mono text-sm h-full flex flex-col p-2" onClick={() => inputRef.current?.focus()}>
            <div ref={scrollRef} className="flex-grow overflow-y-auto">
                {output.map(line => (
                    <div key={line.id} className="whitespace-pre-wrap">
                        {line.type === 'command' ? (
                            <div>
                                <span className="text-green-400">user@gemini-studio</span>
                                <span className="text-gray-300">:</span>
                                <span className="text-blue-400">{line.cwd}</span>
                                <span className="text-gray-300">$ {line.content}</span>
                            </div>
                        ) : line.type === 'special' ? (
                             <div>{line.content}</div>
                        ) : (
                            <div className={cn(line.type === 'error' && 'text-red-400')}>
                                {line.content}
                            </div>
                        )}
                    </div>
                ))}
                {isProcessing && <LoadingIndicator />}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center">
                 <span className="text-green-400">user@gemini-studio</span>
                 <span className="text-gray-300">:</span>
                 <span className="text-blue-400">{cwd}</span>
                 <span className="text-gray-300">$</span>
                 <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="flex-grow bg-transparent border-none outline-none text-gray-300 pl-2"
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    disabled={isProcessing}
                 />
            </form>
        </div>
    );
};
