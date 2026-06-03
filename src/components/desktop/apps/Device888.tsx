
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Share2, Rss, Cpu, GitCommitHorizontal, Hash, Clock, CircleDot, Database, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Block {
    id: number;
    timestamp: number;
    transactions: number;
    hash: string;
}

const generateRandomHash = () => `0x${[...Array(8)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')}...`;

const generateInitialChain = (length: number): Block[] => {
    return Array.from({ length }, (_, i) => ({
        id: i + 1,
        timestamp: Date.now() - (length - i) * 5000,
        transactions: Math.floor(Math.random() * 10) + 1,
        hash: generateRandomHash(),
    }));
};

const Node = ({ id, position, isSelf }: { id: string; position: { x: number; y: number }, isSelf?: boolean }) => (
    <motion.div
        className={cn(
            "absolute w-12 h-12 rounded-full flex items-center justify-center border-2",
            isSelf ? "bg-primary/20 border-primary" : "bg-muted border-border"
        )}
        style={{ left: `${position.x}%`, top: `${position.y}%`, transform: 'translate(-50%, -50%)' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
    >
        {isSelf ? <Cpu className="w-6 h-6 text-primary" /> : <Server className="w-5 h-5 text-muted-foreground" />}
    </motion.div>
);

const Connection = ({ from, to }: { from: {x: number, y: number}, to: {x: number, y: number} }) => (
     <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
        <motion.line
            x1={`${from.x}%`} y1={`${from.y}%`}
            x2={`${to.x}%`} y2={`${to.y}%`}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
        />
    </svg>
)

export function Device888() {
    const [chain, setChain] = useState<Block[]>(() => generateInitialChain(5));
    const [status, setStatus] = useState<'ONLINE' | 'CONNECTING' | 'OFFLINE'>('CONNECTING');
    
    const nodes = useMemo(() => [
        { id: 'self', position: { x: 50, y: 50 }, isSelf: true },
        { id: 'p1', position: { x: 20, y: 30 } },
        { id: 'p2', position: { x: 80, y: 40 } },
        { id: 'p3', position: { x: 40, y: 80 } },
        { id: 'p4', position: { x: 70, y: 75 } },
    ], []);

    useEffect(() => {
        const connectTimeout = setTimeout(() => setStatus('ONLINE'), 2000);
        return () => clearTimeout(connectTimeout);
    }, []);

    useEffect(() => {
        if (status !== 'ONLINE') return;

        const interval = setInterval(() => {
            setChain(prevChain => {
                const newBlock: Block = {
                    id: prevChain.length > 0 ? prevChain[prevChain.length - 1].id + 1 : 1,
                    timestamp: Date.now(),
                    transactions: Math.floor(Math.random() * 15) + 1,
                    hash: generateRandomHash(),
                };
                return [...prevChain, newBlock].slice(-10); // Keep chain length manageable
            });
        }, 5000);

        return () => clearInterval(interval);
    }, [status]);

    return (
        <div className="flex flex-col h-full bg-slate-900 text-gray-300 font-mono">
            {/* Header */}
            <header className="flex-shrink-0 p-4 border-b border-slate-700/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Server className="w-7 h-7 text-primary" />
                    <div>
                        <h1 className="text-xl font-bold">Device 888</h1>
                        <p className="text-xs text-muted-foreground">DoN P2P Cryptochain Interface</p>
                    </div>
                </div>
                 <div className="flex items-center gap-3 text-sm">
                     <span className={cn(
                        "w-3 h-3 rounded-full animate-pulse",
                        status === 'ONLINE' && 'bg-green-500',
                        status === 'CONNECTING' && 'bg-yellow-500',
                        status === 'OFFLINE' && 'bg-red-500'
                     )}></span>
                    <span>Status: {status}</span>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4 p-4 overflow-hidden">
                {/* Left Panel: Chain visualization */}
                <div className="md:col-span-2 flex flex-col h-full overflow-hidden">
                    <h2 className="text-lg font-semibold mb-2 flex items-center gap-2"><Rss /> Live Block Feed</h2>
                    <div className="flex-grow rounded-lg bg-black/30 p-4 overflow-y-auto space-y-3">
                        <AnimatePresence>
                        {chain.map((block, index) => (
                             <motion.div
                                key={block.id}
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.5 }}
                                className="border border-slate-700 rounded-md p-3"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <GitCommitHorizontal className="w-5 h-5 text-primary"/>
                                        <span className="font-bold text-lg">Block #{block.id}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {new Date(block.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="text-xs space-y-1">
                                    <p className="flex items-center gap-2"><Hash className="w-3 h-3 text-cyan-400"/> Hash: <span className="text-cyan-400">{block.hash}</span></p>
                                    <p className="flex items-center gap-2"><Database className="w-3 h-3 text-amber-400"/> Transactions: <span className="text-amber-400">{block.transactions}</span></p>
                                </div>
                            </motion.div>
                        ))}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right Panel: Stats and P2P Graph */}
                <div className="flex flex-col gap-4 h-full overflow-hidden">
                     <div className="p-4 rounded-lg bg-black/30 border border-slate-700">
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><CircleDot /> Network Stats</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span>Current Block:</span> <span className="font-bold">{chain.length > 0 ? chain[chain.length - 1].id : 0}</span></div>
                            <div className="flex justify-between"><span>Transactions:</span> <span className="font-bold">{chain.length > 0 ? chain[chain.length-1].transactions : 0}</span></div>
                            <div className="flex justify-between"><span>Peers Connected:</span> <span className="font-bold">{status === 'ONLINE' ? nodes.length : 0}</span></div>
                        </div>
                    </div>
                    <div className="flex-grow p-4 rounded-lg bg-black/30 border border-slate-700 flex flex-col">
                        <h3 className="font-semibold mb-3 flex items-center gap-2"><Network /> P2P Network</h3>
                        <div className="relative flex-1 w-full h-full">
                           {nodes.map(node => (
                             <Node key={node.id} id={node.id} position={node.position} isSelf={node.isSelf} />
                           ))}
                           {status === 'ONLINE' && nodes.slice(1).map(node => (
                               <Connection key={`conn-${node.id}`} from={nodes[0].position} to={node.position} />
                           ))}
                        </div>
                    </div>
                    <Button variant="outline" className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700">
                        <Share2 className="w-4 h-4 mr-2" />
                        Broadcast Transaction
                    </Button>
                </div>
            </div>
        </div>
    );
}
