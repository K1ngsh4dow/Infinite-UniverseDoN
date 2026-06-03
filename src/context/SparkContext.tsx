
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from './WalletContext';
import { OWNER_ADDRESS } from './WalletContext';

const MAX_SPARK = 100;
const REFILL_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in ms
const STORAGE_KEY_BALANCE = 'infinite-universe-spark-balance';
const STORAGE_KEY_TIMESTAMP = 'infinite-universe-spark-timestamp';

interface SparkContextType {
  sparkBalance: number;
  spendSpark: (amount: number) => boolean;
  isLoaded: boolean;
}

const SparkContext = createContext<SparkContextType | undefined>(undefined);

export const SparkProvider = ({ children }: { children: ReactNode }) => {
  const [sparkBalance, setSparkBalance] = useState<number>(MAX_SPARK);
  const [lastRefillTimestamp, setLastRefillTimestamp] = useState<number>(Date.now());
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();
  const { address } = useWallet();
  const isOwner = address === OWNER_ADDRESS;

  useEffect(() => {
    if (isOwner) {
        setSparkBalance(Infinity);
        setIsLoaded(true);
        return;
    }
    try {
      const savedBalance = localStorage.getItem(STORAGE_KEY_BALANCE);
      const savedTimestamp = localStorage.getItem(STORAGE_KEY_TIMESTAMP);
      const now = Date.now();

      let currentBalance = savedBalance ? parseInt(savedBalance, 10) : MAX_SPARK;
      let currentTimestamp = savedTimestamp ? parseInt(savedTimestamp, 10) : now;

      if (now - currentTimestamp >= REFILL_INTERVAL) {
        currentBalance = MAX_SPARK;
        currentTimestamp = now;
        localStorage.setItem(STORAGE_KEY_BALANCE, String(currentBalance));
        localStorage.setItem(STORAGE_KEY_TIMESTAMP, String(currentTimestamp));
        toast({ title: "SPARK Refilled!", description: `Your creative energy has been restored to ${MAX_SPARK}.` });
      }
      
      setSparkBalance(currentBalance);
      setLastRefillTimestamp(currentTimestamp);
    } catch (error) {
      console.error("Failed to load SPARK state from localStorage", error);
      setSparkBalance(MAX_SPARK);
      setLastRefillTimestamp(Date.now());
    } finally {
        setIsLoaded(true);
    }
  }, [toast, isOwner]);

  const spendSpark = useCallback((amount: number): boolean => {
    if (isOwner) return true;

    if (sparkBalance < amount) {
      toast({
        title: "Insufficient SPARK",
        description: `You need ${amount} SPARK for this action. Your balance is ${sparkBalance}. SPARK refills daily.`,
        variant: "destructive",
      });
      return false;
    }

    const newBalance = sparkBalance - amount;
    setSparkBalance(newBalance);
    localStorage.setItem(STORAGE_KEY_BALANCE, String(newBalance));
    return true;
  }, [sparkBalance, toast, isOwner]);

  return (
    <SparkContext.Provider value={{ sparkBalance, spendSpark, isLoaded }}>
      {children}
    </SparkContext.Provider>
  );
};

export const useSpark = () => {
  const context = useContext(SparkContext);
  if (context === undefined) {
    throw new Error('useSpark must be used within a SparkProvider');
  }
  return context;
};
