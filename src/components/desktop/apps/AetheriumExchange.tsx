
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { getFriendlyAIError } from '@/lib/utils';
import { generateMarketNews, MarketNewsOutput } from '@/ai/flows/generate-market-news';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDown, ArrowUp, Coins, LineChart as LineChartIcon, Newspaper, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';


interface Company {
    ticker: string;
    name: string;
    priceHistory: { time: number; price: number }[];
    sector: string;
}
type Portfolio = Record<string, number>; // ticker -> quantity

const initialCompanies: Company[] = [
    { ticker: 'QCI', name: 'Quantum Core Industries', priceHistory: [{ time: 0, price: 155.75 }], sector: 'Technology' },
    { ticker: 'ASTRA', name: 'Astra-Dynamics Corp.', priceHistory: [{ time: 0, price: 320.50 }], sector: 'Aerospace' },
    { ticker: 'BIOH', name: 'Bio-Harmonix', priceHistory: [{ time: 0, price: 88.20 }], sector: 'Biotech' },
    { ticker: 'HELIX', name: 'Helion Energy Solutions', priceHistory: [{ time: 0, price: 210.90 }], sector: 'Energy' },
    { ticker: 'CYB', name: 'CyberSec Innovations', priceHistory: [{ time: 0, price: 450.00 }], sector: 'Security' },
];

const STORAGE_KEY = 'aetherium-exchange-state';

export function AetheriumExchange() {
    const { balances, debit, credit, isReady } = useWallet();
    const { toast } = useToast();
    const isOnline = useOnlineStatus();

    const [companies, setCompanies] = useState<Company[]>(initialCompanies);
    const [portfolio, setPortfolio] = useState<Portfolio>({});
    const [news, setNews] = useState<MarketNewsOutput[]>([]);
    const [selectedTicker, setSelectedTicker] = useState<string>(initialCompanies[0].ticker);
    const [isMarketOpen, setIsMarketOpen] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
    const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
    const [tradeQuantity, setTradeQuantity] = useState(1);

    const marketUpdateIntervalRef = useRef<NodeJS.Timeout>();
    const donBalance = balances?.['DoN'] || 0;

    useEffect(() => {
        try {
            const savedState = localStorage.getItem(STORAGE_KEY);
            if (savedState) {
                const { companies, portfolio, news } = JSON.parse(savedState);
                if (companies && portfolio) {
                    setCompanies(companies);
                    setPortfolio(portfolio);
                    setNews(news || []);
                }
            }
        } catch (e) {
            console.error('Failed to load state from storage', e);
        }

        return () => {
            if (marketUpdateIntervalRef.current) {
                clearInterval(marketUpdateIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        try {
            const stateToSave = JSON.stringify({ companies, portfolio, news });
            localStorage.setItem(STORAGE_KEY, stateToSave);
        } catch (e) {
            console.error('Failed to save state to storage', e);
        }
    }, [companies, portfolio, news]);

    const marketTick = useCallback(async () => {
        if (!isOnline || isUpdating) return;
        setIsUpdating(true);
        try {
            const marketNews = await generateMarketNews({
                companies: companies.map(c => ({ ticker: c.ticker, name: c.name }))
            });

            setNews(prev => [marketNews, ...prev.slice(0, 9)]);
            
            setCompanies(prevCompanies => prevCompanies.map(c => {
                const lastPrice = c.priceHistory[c.priceHistory.length - 1].price;
                let newPrice = lastPrice;

                // Major news-driven event for the affected ticker
                if (c.ticker === marketNews.affected_ticker) {
                    const changePercent = (Math.random() * 0.03) + 0.01; // 1% to 4% change
                    let multiplier = 1;
                    if (marketNews.effect === 'positive') multiplier += changePercent;
                    if (marketNews.effect === 'negative') multiplier -= changePercent;
                    newPrice = lastPrice * multiplier;
                } else {
                    // Minor, random volatility for all other stocks
                    const volatility = (Math.random() - 0.5) * 0.01; // +/- 0.5% change
                    newPrice = lastPrice * (1 + volatility);
                }
                
                newPrice = Math.max(1, newPrice); // Don't let price go below 1

                return {
                    ...c,
                    priceHistory: [...c.priceHistory, { time: Date.now(), price: newPrice }]
                };
            }));

        } catch (error) {
            console.error('Market tick failed:', error);
            // Don't toast every time, could be annoying.
        } finally {
            setIsUpdating(false);
        }
    }, [isOnline, companies, isUpdating]);

    useEffect(() => {
        if (isMarketOpen && isOnline) {
            marketUpdateIntervalRef.current = setInterval(marketTick, 15000); // every 15s
        } else if (marketUpdateIntervalRef.current) {
            clearInterval(marketUpdateIntervalRef.current);
        }
        return () => clearInterval(marketUpdateIntervalRef.current);
    }, [isMarketOpen, isOnline, marketTick]);


    const selectedCompany = useMemo(() => companies.find(c => c.ticker === selectedTicker), [companies, selectedTicker]);
    const currentPrice = selectedCompany ? selectedCompany.priceHistory[selectedCompany.priceHistory.length - 1].price : 0;
    const priceChange = useMemo(() => {
        if (!selectedCompany || selectedCompany.priceHistory.length < 2) return { value: 0, percent: 0 };
        const current = selectedCompany.priceHistory[selectedCompany.priceHistory.length - 1].price;
        const previous = selectedCompany.priceHistory[selectedCompany.priceHistory.length - 2].price;
        const value = current - previous;
        const percent = (value / previous) * 100;
        return { value, percent };
    }, [selectedCompany]);

    const openTradeDialog = (type: 'buy' | 'sell') => {
        setTradeType(type);
        setTradeQuantity(1);
        setIsTradeDialogOpen(true);
    };

    const handleTrade = () => {
        if (!selectedCompany) return;
        const cost = tradeQuantity * currentPrice;
        
        if (tradeType === 'buy') {
            if (debit('DoN', cost, `Buy ${tradeQuantity} ${selectedTicker}`)) {
                setPortfolio(prev => ({
                    ...prev,
                    [selectedTicker]: (prev[selectedTicker] || 0) + tradeQuantity
                }));
                toast({ title: "Purchase Successful", description: `Bought ${tradeQuantity} share(s) of ${selectedTicker}.` });
            }
        } else { // sell
            if ((portfolio[selectedTicker] || 0) < tradeQuantity) {
                toast({ title: "Insufficient Shares", description: `You don't own enough shares to sell.`, variant: 'destructive' });
                return;
            }
            credit('DoN', cost, `Sell ${tradeQuantity} ${selectedTicker}`);
            setPortfolio(prev => ({
                ...prev,
                [selectedTicker]: prev[selectedTicker] - tradeQuantity
            }));
            toast({ title: "Sale Successful", description: `Sold ${tradeQuantity} share(s) of ${selectedTicker}.` });
        }
        setIsTradeDialogOpen(false);
    };

    const portfolioValue = useMemo(() => {
        return Object.entries(portfolio).reduce((acc, [ticker, quantity]) => {
            const company = companies.find(c => c.ticker === ticker);
            if (company) {
                const price = company.priceHistory[company.priceHistory.length - 1].price;
                return acc + (price * quantity);
            }
            return acc;
        }, 0);
    }, [portfolio, companies]);

    if (!isReady) {
        return (
            <div className="flex h-full w-full items-center justify-center">
                <Loader2 className="mx-auto h-12 w-12 animate-spin" />
            </div>
        );
    }
    
    return (
        <div className="p-4 h-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Left Column */}
                <div className="lg:col-span-1 space-y-6 flex flex-col">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Market</CardTitle>
                             <div className="flex items-center gap-2 text-xs">
                                <span className="relative flex h-3 w-3">
                                    <span className={cn("absolute inline-flex h-full w-full rounded-full opacity-75", isMarketOpen && isOnline && "animate-ping bg-green-400")}></span>
                                    <span className={cn("relative inline-flex rounded-full h-3 w-3", isMarketOpen && isOnline ? "bg-green-500" : "bg-red-500")}></span>
                                </span>
                                {isMarketOpen && isOnline ? 'OPEN' : 'CLOSED'}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ticker</TableHead>
                                        <TableHead className="text-right">Price (DoN)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {companies.map(c => {
                                        const price = c.priceHistory[c.priceHistory.length - 1].price;
                                        const prevPrice = c.priceHistory.length > 1 ? c.priceHistory[c.priceHistory.length - 2].price : price;
                                        const isUp = price >= prevPrice;
                                        return (
                                            <TableRow key={c.ticker} onClick={() => setSelectedTicker(c.ticker)} className={`cursor-pointer ${selectedTicker === c.ticker ? 'bg-muted/80' : ''}`}>
                                                <TableCell className="font-medium">{c.ticker}</TableCell>
                                                <TableCell className={`text-right font-mono flex items-center justify-end gap-2 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isUp ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                                    {price.toFixed(2)}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <Card className="flex-grow">
                        <CardHeader><CardTitle>My Portfolio</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-2">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Holdings Value</span>
                                    <span className="font-mono">{portfolioValue.toFixed(2)} DoN</span>
                                </div>
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Cash Balance</span>
                                    <span className="font-mono">{donBalance.toFixed(2)} DoN</span>
                                </div>
                                <div className="flex justify-between text-lg font-semibold pt-2 border-t">
                                    <span>Total Net Worth</span>
                                    <span className="font-mono">{(donBalance + portfolioValue).toFixed(2)} DoN</span>
                                </div>
                            </div>
                            {Object.keys(portfolio).length > 0 && (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Ticker</TableHead>
                                            <TableHead className="text-right">Shares</TableHead>
                                            <TableHead className="text-right">Value (DoN)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {Object.entries(portfolio).map(([ticker, quantity]) => {
                                            if (quantity <= 0) return null;
                                            const company = companies.find(c => c.ticker === ticker);
                                            if (!company) return null;
                                            const price = company.priceHistory[company.priceHistory.length - 1].price;
                                            const value = price * quantity;
                                            return (
                                                <TableRow key={ticker} onClick={() => setSelectedTicker(ticker)} className="cursor-pointer">
                                                    <TableCell>{ticker}</TableCell>
                                                    <TableCell className="text-right font-mono">{quantity}</TableCell>
                                                    <TableCell className="text-right font-mono">{value.toFixed(2)}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {/* Right Column */}
                <div className="lg:col-span-2 space-y-6 flex flex-col">
                    {selectedCompany && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>{selectedCompany.name} ({selectedCompany.ticker})</span>
                                    <span className="font-mono">{currentPrice.toFixed(2)} DoN</span>
                                </CardTitle>
                                <CardDescription className={`flex items-center gap-1 font-mono text-sm ${priceChange.value >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {priceChange.value >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                                    {priceChange.value.toFixed(2)} ({priceChange.percent.toFixed(2)}%)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={selectedCompany.priceHistory}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                        <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} hide />
                                        <YAxis domain={['dataMin - 5', 'dataMax + 5']} allowDataOverflow hide />
                                        <Tooltip 
                                            contentStyle={{
                                                backgroundColor: 'hsl(var(--background))',
                                                border: '1px solid hsl(var(--border))'
                                            }}
                                            formatter={(value: number) => [`${value.toFixed(2)} DoN`, "Price"]}
                                            labelFormatter={(label) => new Date(label).toLocaleString()}
                                        />
                                        <Line type="monotone" dataKey="price" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                            <CardFooter className="gap-4">
                                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => openTradeDialog('buy')}>Buy</Button>
                                <Button className="w-full bg-red-600 hover:bg-red-700" onClick={() => openTradeDialog('sell')}>Sell</Button>
                            </CardFooter>
                        </Card>
                    )}
                     <Card className="flex-grow flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2"><Newspaper className="h-5 w-5"/> Market News</CardTitle>
                             {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <ScrollArea className="h-64">
                                <div className="space-y-4">
                                {news.length === 0 && <p className="text-muted-foreground text-sm">No recent market news. Market is quiet.</p>}
                                {news.map((item, index) => (
                                    <div key={index} className="text-sm">
                                        <p className="font-semibold">{item.headline} <span className="font-mono text-primary">({item.affected_ticker})</span></p>
                                        <p className="text-muted-foreground">{item.summary}</p>
                                    </div>
                                ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="capitalize flex items-center gap-2">{tradeType} {selectedCompany?.name} ({selectedTicker})</DialogTitle>
                        <DialogDescription>
                            Current Price: {currentPrice.toFixed(2)} DoN/share
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="icon" onClick={() => setTradeQuantity(q => Math.max(1, q - 1))}><Minus className="h-4 w-4"/></Button>
                                <Input id="quantity" type="number" value={tradeQuantity} onChange={e => setTradeQuantity(Math.max(1, parseInt(e.target.value) || 1))} min="1" className="text-center" />
                                <Button variant="outline" size="icon" onClick={() => setTradeQuantity(q => q + 1)}><Plus className="h-4 w-4"/></Button>
                            </div>
                        </div>
                        <Card className="bg-muted/50 p-4">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <span className="text-muted-foreground">Cash</span>
                                <span className="text-right font-mono">{donBalance?.toFixed(2)} DoN</span>

                                <span className="text-muted-foreground">{tradeType === 'buy' ? 'Cost' : 'Proceeds'}</span>
                                <span className={cn('text-right font-mono', tradeType === 'buy' ? 'text-red-500' : 'text-green-500')}>
                                    {(tradeQuantity * currentPrice).toFixed(2)} DoN
                                </span>
                                
                                <span className="text-muted-foreground col-span-2 border-b my-1"></span>

                                <span className="text-muted-foreground font-semibold">New Cash Balance</span>
                                <span className="text-right font-mono font-semibold">
                                    {tradeType === 'buy'
                                        ? (donBalance - (tradeQuantity * currentPrice)).toFixed(2)
                                        : (donBalance + (tradeQuantity * currentPrice)).toFixed(2)} DoN
                                </span>

                                <span className="text-muted-foreground">{selectedTicker} Shares</span>
                                <span className="text-right font-mono">{portfolio[selectedTicker] || 0}</span>

                                <span className="text-muted-foreground">Quantity</span>
                                <span className={cn('text-right font-mono', tradeType === 'buy' ? 'text-green-500' : 'text-red-500')}>
                                    {tradeType === 'buy' ? '+' : '-'}{tradeQuantity}
                                </span>
                                
                                <span className="text-muted-foreground col-span-2 border-b my-1"></span>
                                
                                <span className="text-muted-foreground font-semibold">New {selectedTicker} Shares</span>
                                <span className="text-right font-mono font-semibold">
                                    {tradeType === 'buy'
                                        ? ((portfolio[selectedTicker] || 0) + tradeQuantity)
                                        : ((portfolio[selectedTicker] || 0) - tradeQuantity)}
                                </span>
                            </div>
                        </Card>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                        <Button onClick={handleTrade} className={cn("capitalize", tradeType === 'buy' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700")}>{tradeType}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
