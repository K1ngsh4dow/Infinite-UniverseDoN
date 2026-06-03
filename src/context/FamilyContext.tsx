
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface Dependent {
  id: string;
  name: string;
  address: string;
  sharedSecret?: string;
}

interface FamilyContextType {
  dependents: Dependent[];
  addDependent: (name: string, address: string) => void;
  updateDependent: (id: string, updates: Partial<Omit<Dependent, 'id'>>) => void;
  removeDependent: (id: string) => void;
  isFamilyLoaded: boolean;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

const STORAGE_KEY = 'infinite-universe-family-trust';

export const FamilyProvider = ({ children }: { children: ReactNode }) => {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [isFamilyLoaded, setIsFamilyLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY);
      if (savedData) {
        setDependents(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Failed to load family trust data from localStorage", error);
    } finally {
        setIsFamilyLoaded(true);
    }
  }, []);

  const saveDependents = (newDependents: Dependent[]) => {
      setDependents(newDependents);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDependents));
  }

  const addDependent = useCallback((name: string, address: string) => {
    if (!name.trim() || !address.trim()) {
        toast({ title: "Name and Address are required.", variant: "destructive" });
        return;
    }
    const newDependent: Dependent = {
        id: `dep-${Date.now()}`,
        name,
        address,
    };
    const newDependents = [...dependents, newDependent];
    saveDependents(newDependents);
    toast({ title: "Dependent Added", description: `${name} has been added to the Family Trust.` });
  }, [dependents, toast]);

  const updateDependent = useCallback((id: string, updates: Partial<Omit<Dependent, 'id'>>) => {
    let dependentName = '';
    const newDependents = dependents.map(d => {
        if (d.id === id) {
            const updated = { ...d, ...updates };
            dependentName = updated.name;
            return updated;
        }
        return d;
    });
    saveDependents(newDependents);
    toast({ title: "Dependent Updated", description: `Details for ${dependentName} have been updated.` });
  }, [dependents, toast]);

  const removeDependent = useCallback((id: string) => {
    const dependentToRemove = dependents.find(d => d.id === id);
    const newDependents = dependents.filter(d => d.id !== id);
    saveDependents(newDependents);
    if (dependentToRemove) {
      toast({ title: "Dependent Removed", description: `${dependentToRemove.name} has been removed from the trust.` });
    }
  }, [dependents, toast]);

  const value = { dependents, addDependent, updateDependent, removeDependent, isFamilyLoaded };

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
};

export const useFamily = () => {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
};
