
"use client";

import { Creation, useCreations } from "@/context/CreationsContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export const TextEditor = ({ creation }: { creation: Creation }) => {
    const { updateCreation } = useCreations();
    const { toast } = useToast();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        let isMounted = true;
        setIsLoading(true);

        const loadContent = async () => {
            let textContent = '';
            if (creation.type === 'story') {
                textContent = creation.data.story;
            } else if (creation.data instanceof Blob) {
                try {
                    textContent = await creation.data.text();
                } catch (e) {
                    console.error("Failed to read blob as text", e);
                    textContent = "Error: Could not read file content.";
                }
            }
            
            if (isMounted) {
                setContent(textContent);
                setIsLoading(false);
                setHasChanges(false);
            }
        };

        loadContent();

        return () => { isMounted = false; };
    }, [creation]);

    const handleSave = async () => {
        setIsSaving(true);
        let newData;
        if (creation.type === 'story') {
            newData = { ...creation.data, story: content };
        } else {
            newData = new Blob([content], { type: 'text/plain' });
        }
        
        try {
            await updateCreation(creation.id, newData);
            toast({ title: "File Saved", description: `"${creation.title}" has been updated.` });
            setHasChanges(false);
        } catch (error) {
            toast({ title: "Error", description: "Could not save the file.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
        if (!hasChanges) {
            setHasChanges(true);
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Textarea
                value={content}
                onChange={handleContentChange}
                className="w-full h-full flex-grow resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4"
                placeholder="Enter your text here..."
            />
            <div className="flex-shrink-0 p-2 border-t flex justify-end">
                <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                </Button>
            </div>
        </div>
    );
};
