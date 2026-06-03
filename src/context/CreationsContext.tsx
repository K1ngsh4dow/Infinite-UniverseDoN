
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getAllCreations, addCreationToDB, removeCreationFromDB, updateCreationInDB } from '@/lib/idb';

// Define the structure for a single creation
export interface Creation {
  id: string;
  type: 'image' | 'story' | 'speech' | 'music' | 'video' | 'file' | 'folder';
  title: string;
  prompt: string;
  timestamp: number;
  // The path where the item is stored, e.g. "/" or "/My Folder/"
  path: string; 
  // Data can be a structured object, a data URI string, or a Blob for uploaded files
  data: any; 
}

// Define the context shape
interface CreationsContextType {
  creations: Creation[];
  // Omit id and timestamp as they are auto-generated
  addCreation: (creation: Omit<Creation, 'id' | 'timestamp'>) => Promise<void>;
  updateCreation: (id: string, data: any) => Promise<void>;
  removeCreation: (id: string) => Promise<void>;
  isLoaded: boolean;
}

// Create the context
const CreationsContext = createContext<CreationsContextType | undefined>(undefined);

const VIRTUAL_DRIVES = [
    { id: 'raid', title: 'RAID-Storage', prompt: 'Redundant Array of Independent Disks' },
    { id: 'data1', title: 'Data-Drive-1', prompt: 'Primary data storage' },
    { id: 'data2', title: 'Data-Drive-2', prompt: 'Secondary data storage' },
    { id: 'cloud', title: 'Cloud-Sync', prompt: 'Folder for cloud synchronization' },
];

// Create the provider component
export const CreationsProvider = ({ children }: { children: ReactNode }) => {
  const [creations, setCreations] = useState<Creation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IndexedDB on initial mount
  useEffect(() => {
    const loadCreations = async () => {
        try {
            let loadedCreations = await getAllCreations();
            const creationsToAdd: Creation[] = [];

            const historyFolderExists = loadedCreations.some(
              (c) => c.type === 'folder' && c.path === '/' && c.title === 'History'
            );

            if (!historyFolderExists) {
                const historyFolder: Creation = {
                    id: 'folder-history-' + Date.now(),
                    type: 'folder',
                    title: 'History',
                    prompt: 'Auto-generated history folder',
                    timestamp: Date.now(),
                    path: '/',
                    data: null,
                };
                creationsToAdd.push(historyFolder);
            }
            
            // Check for and create virtual drives
            for (const drive of VIRTUAL_DRIVES) {
                const driveExists = loadedCreations.some(
                    (c) => c.type === 'folder' && c.path === '/' && c.title === drive.title
                );
                if (!driveExists) {
                    const driveFolder: Creation = {
                        id: `folder-drive-${drive.id}`,
                        type: 'folder',
                        title: drive.title,
                        prompt: drive.prompt,
                        timestamp: Date.now(),
                        path: '/',
                        data: null,
                    };
                    creationsToAdd.push(driveFolder);
                }
            }

            if (creationsToAdd.length > 0) {
              await Promise.all(creationsToAdd.map(c => addCreationToDB(c)));
              loadedCreations = [...loadedCreations, ...creationsToAdd];
            }
            
            setCreations(loadedCreations.sort((a,b) => b.timestamp - a.timestamp));

        } catch (error) {
            console.error("Failed to load creations from IndexedDB", error);
        } finally {
            setIsLoaded(true);
        }
    };
    
    loadCreations();
  }, []);

  const addCreation = async (creationData: Omit<Creation, 'id' | 'timestamp'>) => {
    const newId = new Date().toISOString() + Math.random();
    const newCreation: Creation = {
      ...creationData,
      id: newId,
      timestamp: Date.now(),
    };

    const creationsToAdd = [newCreation];

    // Auto-backup for generated content. Uploads ('file') and folders are not backed up.
    if (!['file', 'folder'].includes(newCreation.type)) {
      const historyCopy: Creation = {
        ...newCreation,
        id: newId + '-history',
        path: '/History/', // History copy always goes here
      };
      creationsToAdd.push(historyCopy);
    }

    // Add all to DB
    await Promise.all(creationsToAdd.map(c => addCreationToDB(c)));

    // Update state
    setCreations(prevCreations => [...creationsToAdd, ...prevCreations].sort((a,b) => b.timestamp - a.timestamp));
  };

  const updateCreation = async (id: string, data: any) => {
    const creationToUpdate = creations.find(c => c.id === id);
    if (!creationToUpdate) return;
    
    const updatedCreation = { ...creationToUpdate, data };

    await updateCreationInDB(updatedCreation);

    setCreations(prevCreations => 
        prevCreations.map(c => c.id === id ? updatedCreation : c)
    );
  };

  const removeCreation = async (id: string) => {
    const itemToRemove = creations.find(c => c.id === id);
    if (!itemToRemove) return;

    if (itemToRemove.type === 'folder') {
        const pathToDelete = itemToRemove.path + itemToRemove.title + '/';
        const idsToDelete = creations
            .filter(c => c.id === id || c.path.startsWith(pathToDelete))
            .map(c => c.id);

        await Promise.all(idsToDelete.map(idToDelete => removeCreationFromDB(idToDelete)));
        setCreations(prev => prev.filter(c => !idsToDelete.includes(c.id)));
    } else {
        await removeCreationFromDB(id);
        setCreations(prev => prev.filter(c => c.id !== id));
    }
  };


  return (
    <CreationsContext.Provider value={{ creations, addCreation, updateCreation, removeCreation, isLoaded }}>
      {children}
    </CreationsContext.Provider>
  );
};

// Create a custom hook for easy access to the context
export const useCreations = () => {
  const context = useContext(CreationsContext);
  if (context === undefined) {
    throw new Error('useCreations must be used within a CreationsProvider');
  }
  return context;
};
