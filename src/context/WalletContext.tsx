
"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { generateApiKey } from '@/ai/flows/manage-api-key';
import { getFriendlyAIError } from '@/lib/utils';
import { PREMINED_WALLETS, SUPPORTED_ASSETS } from '@/lib/constants';

export interface Transaction {
  id: string;
  timestamp: number;
  type: 'send' | 'receive' | 'debit' | 'credit' | 'swap';
  ticker: string;
  amount: number;
  memo: string;
  to?: string;
  from?: string;
  status?: 'pending' | 'cleared' | 'failed';
}

type Balances = Record<string, number>;

interface WalletContextType {
  address: string | null;
  privateKey: string | null;
  balances: Balances | null;
  transactions: Transaction[];
  debit: (ticker: string, amount: number, memo?: string) => boolean;
  credit: (ticker: string, amount: number, memo?: string) => void;
  sendAsset: (ticker: string, to: string, amount: number) => boolean;
  swapAssets: (fromTicker: string, toTicker: string, fromAmount: number, toAmount: number) => Promise<boolean>;
  generateNewWallet: () => Promise<void>;
  isReady: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const OWNER_ADDRESS = 'don_addr_40cf623cf3b68d029228d20474e7e9514a11a980133a8125';
const OWNER_PRIVATE_KEY = 'don_sk_owner_of_the_infinite_universe_master_key_001';

const saveStateToLocalStorage = (state: { address: string | null, key: string | null, balances: Balances | null, transactions: Transaction[] }) => {
    if (typeof window === 'undefined') return;
    if (state.address) localStorage.setItem('don-wallet-address', state.address); else localStorage.removeItem('don-wallet-address');
    if (state.key) localStorage.setItem('don-wallet-private-key', state.key); else localStorage.removeItem('don-wallet-private-key');
    if (state.balances) localStorage.setItem('don-wallet-balances', JSON.stringify(state.balances)); else localStorage.removeItem('don-wallet-balances');
    if (state.transactions) localStorage.setItem('don-wallet-transactions', JSON.stringify(state.transactions)); else localStorage.removeItem('don-wallet-transactions');
};

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [balances, setBalances] = useState<Balances | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isReady, setIsReady] = useState(false);
  const { toast } = useToast();
  const isOwner = address === OWNER_ADDRESS;

  // Effect for initial loading from localStorage
  useEffect(() => {
    try {
      const savedAddress = localStorage.getItem('don-wallet-address');
      const savedKey = localStorage.getItem('don-wallet-private-key');
      const savedBalances = localStorage.getItem('don-wallet-balances');
      const savedTxs = localStorage.getItem('don-wallet-transactions');

      if (savedAddress && savedKey && savedBalances) {
        setAddress(savedAddress);
        setPrivateKey(savedKey);
        setBalances(JSON.parse(savedBalances));
        setTransactions(savedTxs ? JSON.parse(savedTxs) : []);
      } else {
        // Default to Owner wallet if no other wallet is found
        const ownerBalances: Balances = {};
        SUPPORTED_ASSETS.forEach(asset => {
            ownerBalances[asset.ticker] = Infinity;
        });
        const ownerDonBalance = PREMINED_WALLETS[OWNER_ADDRESS as keyof typeof PREMINED_WALLETS] || 1.99e12;
        ownerBalances['DoN'] = ownerDonBalance;

        setAddress(OWNER_ADDRESS);
        setPrivateKey(OWNER_PRIVATE_KEY);
        setBalances(ownerBalances);
        setTransactions([]);
        toast({
            title: "Master Identity Confirmed",
            description: "You have assumed the role of Owner of the Infinite Universe."
        });
      }
    } catch (error) {
        console.error("Error loading wallet from localStorage", error);
    } finally {
        setIsReady(true);
    }
  }, [toast]);
  
  // Effect for saving state changes to localStorage
  useEffect(() => {
    if (isReady) {
        saveStateToLocalStorage({ address, key: privateKey, balances, transactions });
    }
  }, [address, privateKey, balances, transactions, isReady]);

  const addTransaction = useCallback((txData: Omit<Transaction, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) => {
    setTransactions(prev => {
        const newTx: Transaction = {
            id: txData.id || `tx-${Date.now()}`,
            timestamp: txData.timestamp || Date.now(),
            type: txData.type,
            ticker: txData.ticker,
            amount: txData.amount,
            memo: txData.memo,
            to: txData.to,
            from: txData.from,
            status: txData.status,
        };
        return [newTx, ...prev].sort((a, b) => b.timestamp - a.timestamp);
    });
  }, []);

  const debit = useCallback((ticker: string, amount: number, memo = "OS Expense"): boolean => {
    const currentBalance = balances?.[ticker] || 0;
    if (currentBalance < amount) {
        toast({
            title: "Insufficient Funds",
            description: `You need at least ${amount} ${ticker}. Your balance is ${currentBalance}.`,
            variant: "destructive"
        });
        return false;
    }
    setBalances(prevBalances => {
        if (!prevBalances) return null;
        const newBalance = (prevBalances[ticker] || 0) - amount;
        addTransaction({ type: 'debit', ticker, amount: -amount, memo });
        return { ...prevBalances, [ticker]: newBalance };
    });
    return true;
  }, [balances, toast, addTransaction]);

  const credit = useCallback((ticker: string, amount: number, memo = "OS Credit") => {
    setBalances(prevBalances => {
        if (!prevBalances) return null;
        const newBalance = (prevBalances[ticker] || 0) + amount;
        addTransaction({ type: 'credit', ticker, amount, memo });
        return { ...prevBalances, [ticker]: newBalance };
    });
  }, [addTransaction]);

  const sendAsset = useCallback((ticker: string, to: string, amount: number): boolean => {
    const success = debit(ticker, amount, `Sent to ${to.substring(0, 15)}...`);
    if (success) {
      toast({ title: 'Transaction Sent', description: `${amount} ${ticker} sent to ${to}.` });
      return true;
    }
    return false;
  }, [debit, toast]);

  const swapAssets = useCallback(async (fromTicker: string, toTicker: string, fromAmount: number, toAmount: number): Promise<boolean> => {
    if (address === OWNER_ADDRESS) {
      toast({ title: "Action Not Applicable", description: "The Owner wallet does not perform swaps.", variant: "destructive" });
      return false;
    }

    const currentFromBalance = balances?.[fromTicker] || 0;
    if (currentFromBalance < fromAmount) {
      toast({ title: "Insufficient Funds", description: `You need ${fromAmount.toLocaleString()} ${fromTicker}.`, variant: "destructive" });
      return false;
    }

    const pendingTxId = `tx-swap-${Date.now()}`;
    const memo = `Purchased ${toAmount.toLocaleString()} ${toTicker}`;
    
    // 1. Add a pending transaction immediately
    addTransaction({
      id: pendingTxId,
      type: 'swap',
      ticker: fromTicker, // Show what was spent
      amount: -fromAmount,
      memo: `${memo} (Verifying...)`,
      status: 'pending'
    });

    toast({ title: "Purchase Submitted", description: "Your transaction is being verified by the network." });

    // 2. Simulate verification delay
    setTimeout(() => {
        // 3. Update balances and finalize transaction
        setBalances(prevBalances => {
            if (!prevBalances) return null;
            const newFromBalance = (prevBalances[fromTicker] || 0) - fromAmount;
            const newToBalance = (prevBalances[toTicker] || 0) + toAmount;
            return { ...prevBalances, [fromTicker]: newFromBalance, [toTicker]: newToBalance };
        });

        // 4. Update the transaction to 'cleared'
        setTransactions(prevTxs => prevTxs.map(tx => {
            if (tx.id === pendingTxId) {
                return { ...tx, status: 'cleared', memo: `${memo} (Cleared)` };
            }
            return tx;
        }));

        toast({ title: "Transaction Verified", description: `You received ${toAmount.toLocaleString()} ${toTicker}.` });
    }, 3500); // 3.5 second delay

    return true; // Return true immediately to close the dialog
  }, [address, balances, toast, addTransaction]);


  const generateNewWallet = useCallback(async () => {
    if (isOwner) {
      toast({ title: "Action Not Permitted", description: "The Owner's identity is immutable.", variant: "destructive" });
      return;
    }
    try {
      const [addressResult, keyResult] = await Promise.all([generateApiKey(), generateApiKey()]);
      const newAddress = addressResult.newApiKey.replace('gsk_dev_', 'don_addr_');
      const newKey = keyResult.newApiKey.replace('gsk_dev_', 'don_sk_');
      
      const premineBalance = PREMINED_WALLETS[newAddress as keyof typeof PREMINED_WALLETS] || 1000;
      
      const newBalances: Balances = {};
      SUPPORTED_ASSETS.forEach(asset => {
        newBalances[asset.ticker] = asset.ticker === 'DoN' ? premineBalance : 0;
      });

      setAddress(newAddress);
      setPrivateKey(newKey);
      setBalances(newBalances);
      setTransactions([]);
      
      toast({ title: 'Wallet Generated Successfully!', description: 'Your new credentials have been saved on this device.' });
    } catch (error) {
      toast({ title: 'Wallet Generation Failed', description: getFriendlyAIError(error), variant: 'destructive' });
    }
  }, [toast, isOwner]);

  const value = { address, privateKey, balances, transactions, debit, credit, sendAsset, generateNewWallet, isReady, swapAssets };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
