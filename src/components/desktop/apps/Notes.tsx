
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useCreations, Creation } from '@/context/CreationsContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, FilePlus2, Loader2, CheckCircle } from 'lucide-react';
import { debounce } from 'lodash-es';

export function NotesApp() {
    const { addCreation, updateCreation, creations } = useCreations();
    const { toast } = useToast();
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const activeNote = creations.find(c => c.id === activeNoteId);

    const debouncedSave = useCallback(
        debounce(async (id: string, newTitle: string, newContent: string) => {
            if (!id) return;
            setIsSaving(true);
            const noteToUpdate = creations.find(c => c.id === id);
            if (!noteToUpdate) {
                setIsSaving(false);
                return;
            }

            const isTextFile = noteToUpdate.title.endsWith('.txt');
            const blobType = isTextFile ? 'text/plain' : 'text/markdown';

            await updateCreation(id, {
                title: newTitle,
                data: new Blob([newContent], { type: blobType }),
            });
            
            setTimeout(() => setIsSaving(false), 1000); // Keep saving indicator for a bit
        }, 1500),
        [creations, updateCreation]
    );

    useEffect(() => {
        if (activeNoteId && title && content) {
            debouncedSave(activeNoteId, title, content);
        }
        return () => debouncedSave.cancel();
    }, [title, content, activeNoteId, debouncedSave]);
    
    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title);
            const loadContent = async () => {
                if (activeNote.data instanceof Blob) {
                    setContent(await activeNote.data.text());
                } else {
                    setContent('');
                }
            };
            loadContent();
        } else {
            setTitle('');
            setContent('');
        }
    }, [activeNote]);


    const handleNewNote = async (type: 'txt' | 'md') => {
        const newTitle = `New Note.${type}`;
        const newContent = `# ${newTitle}\n\nStart writing your notes here.`;
        const blobType = type === 'txt' ? 'text/plain' : 'text/markdown';
        
        const newNote: Omit<Creation, 'id' | 'timestamp'> = {
            type: 'file',
            title: newTitle,
            path: '/',
            prompt: 'Created in Notes App',
            data: new Blob([newContent], { type: blobType }),
        };
        await addCreation(newNote);
        toast({ title: "Note created", description: `A new note '${newTitle}' was added to your root directory.` });
    };

    const notes = creations.filter(c => c.type === 'file' && (c.title.endsWith('.md') || c.title.endsWith('.txt')));

    return (
        <div className="flex h-full bg-background">
            <div className="w-1/3 border-r p-2 flex flex-col">
                <div className="p-2">
                    <h3 className="font-semibold mb-2">My Notes</h3>
                    <div className="flex gap-2">
                        <Button onClick={() => handleNewNote('md')} variant="outline" size="sm" className="w-full">New .md</Button>
                        <Button onClick={() => handleNewNote('txt')} variant="outline" size="sm" className="w-full">New .txt</Button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto">
                    {notes.map(note => (
                        <button
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
                            className={`w-full text-left p-2 rounded-md ${activeNoteId === note.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                        >
                            {note.title}
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-2/3 flex flex-col">
                {activeNote ? (
                    <>
                        <div className="p-2 border-b flex items-center gap-2">
                           <Input value={title} onChange={(e) => setTitle(e.target.value)} className="font-semibold text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0" />
                           <div className="text-sm text-muted-foreground w-24 text-right">
                                {isSaving && <Loader2 className="h-4 w-4 animate-spin inline-block" />}
                                {!isSaving && <span className="flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-500"/> Saved</span>}
                            </div>
                        </div>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="flex-grow w-full h-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4 text-base"
                            placeholder="Select a note or create a new one..."
                        />
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <FilePlus2 className="h-12 w-12 mb-4" />
                        <h3 className="text-xl font-semibold">No Note Selected</h3>
                        <p className="mt-2 text-sm">Select a note from the list or create a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
