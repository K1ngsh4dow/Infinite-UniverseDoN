
"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'infinite-universe-blueprint';

export function useBlueprint() {
    const [blueprintContent, setBlueprintContent] = useState<string | null>(null);

    useEffect(() => {
        try {
            const savedContent = localStorage.getItem(STORAGE_KEY);
            if (savedContent) {
                setBlueprintContent(savedContent);
            }
        } catch (e) {
            console.error("Failed to load blueprint from localStorage", e);
        }
    }, []);

    const setContentAndSave = useCallback((content: string | null) => {
        setBlueprintContent(content);
        if (content) {
            localStorage.setItem(STORAGE_KEY, content);
        } else {
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    return {
        blueprintContent,
        setBlueprintContent: setContentAndSave,
    };
}
