
import React from 'react';
import { Coins, Bitcoin, Sun, CircleDollarSign, Box } from 'lucide-react';

export const PREMINED_WALLETS = Object.freeze({
    'don_addr_0b6ffce4ccb3aeacbdd420bbd68fe54d41662ffc8a2f584a': 21000000,        // Team Financial Support
    'don_addr_05e2f7e6ff21da949509159395ba8bb3ed2d4c7c92b4b5af': 21000000000,   // Universe Insurance
    'don_addr_40cf623cf3b68d029228d20474e7e9514a11a980133a8125': 1990000000000,   // Owner - Team Financial Support
    'don_addr_e4b4fe8395d9357664603864a53adefd7e0f8b464be2dfd0': 210000000,   // Startup Capital - Team Financial Support
    'don_addr_1765b199258a9783269281c0e24a07f94c4be5fedeadba38': 10000000,    // Flexibility Fund - Team Financial Support
});


const EthIcon = (props: React.SVGProps<SVGSVGElement>) => {
    return React.createElement('svg', { role: "img", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", ...props },
        React.createElement('title', null, 'Ethereum'),
        React.createElement('path', { d: "M11.944 17.97L4.58 13.62l7.364 4.35l7.364-4.35l-7.364 4.35zm.004-17.97l-7.368 9.25l7.368 4.35l7.368-4.35l-7.368-9.25zM12 12.39L4.58 8.046l7.42 9.27L19.42 8.046L12 12.39z", fill: "currentColor" })
    );
};

export const SUPPORTED_ASSETS = [
    { ticker: 'DoN', name: 'DoN', icon: Coins, isNative: true, price: 1.00 },
    { ticker: 'BTC', name: 'Bitcoin', icon: Bitcoin, price: 68000.00 },
    { ticker: 'ETH', name: 'Ethereum', icon: EthIcon, price: 3500.00 },
    { ticker: 'SOL', name: 'Solana', icon: Sun, price: 150.00 },
    { ticker: 'USDC', name: 'USD Coin', icon: CircleDollarSign, price: 1.00 },
    { ticker: 'USDT', name: 'Tether', icon: CircleDollarSign, price: 1.00 },
    { ticker: 'BNB', name: 'Binance Coin', icon: Box, price: 600.00 },
];
