
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreations, Creation } from '@/context/CreationsContext';
import { useToast } from '@/hooks/use-toast';
import { encryptBlob, decryptBlob } from '@/lib/crypto';
import { Loader2, Lock, Unlock, File as FileIcon, Wallet, Eye, EyeOff, KeyRound, Copy, BookOpenCheck, ArrowUpRight, ArrowDownLeft, CreditCard, WalletCards, Apple, Check } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { useWallet, OWNER_ADDRESS } from '@/context/WalletContext';
import { cn } from '@/lib/utils';
import { PREMINED_WALLETS, SUPPORTED_ASSETS } from '@/lib/constants';
import { useFamily } from '@/context/FamilyContext';


const getIcon = (type: Creation['type'], title: string) => {
    if (title.endsWith('.enc')) return <Lock className="h-5 w-5 text-indigo-500" />;
    switch (type) {
        case 'image':
        case 'file': return <FileIcon className="h-5 w-5 text-gray-500" />;
        default: return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
}

const BASE_TIMESTAMP = new Date('2025-07-08T00:00:00Z').getTime();
const mockLedgerEntries = Object.entries(PREMINED_WALLETS).map(([address, amount], index) => {
    const destinations = ['Core System Upgrade', 'Creative Content Initiative', 'Genesis Copilot Program', 'Network Stability Fund', 'User Growth Rewards'];
    const memos = ['Initial funding for v2.0 development.', 'Rewarding top universe creators.', 'Seed funding for featured agent development.', 'Insurance against sub-etha network events.', 'Onboarding incentives for new users.'];
    const source = address.includes('e4b4') ? 'Startup Capital' : address.includes('0b6f') ? 'Team Financials' : 'Treasury';
    
    return {
        id: index + 1,
        timestamp: new Date(BASE_TIMESTAMP - (index * 3 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        source: source,
        destination: destinations[index % destinations.length],
        amount: amount,
        memo: memos[index % memos.length],
    };
});

const GooglePayIcon = (props: React.HTMLAttributes<SVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M20.5,8.89a3.78,3.78,0,0,0-.52-2A3.83,3.83,0,0,0,18.23,5H5.77A3.83,3.83,0,0,0,4,6.85a3.78,3.78,0,0,0-.52,2V9.3H20.5Zm0,6.22V10.74H3.5v4.37a3.78,3.78,0,0,0,.52,2,3.83,3.83,0,0,0,1.75,1.85h12.46a3.83,3.83,0,0,0,1.75-1.85,3.78,3.78,0,0,0,.52-2Z" fill="#5f6368"/>
        <path d="M12,12.22A5.1,5.1,0,0,1,12,2.5H6.88A5.1,5.1,0,0,0,6.88,12.22Z" fill="#4285f4"/>
        <path d="M12,12.22A5.1,5.1,0,0,0,12,22h5.12A5.1,5.1,0,0,0,17.12,12.22Z" fill="#34a853"/>
        <path d="M6.88,12.22a5.1,5.1,0,0,1,0,9.78H12A5.1,5.1,0,0,0,12,12.22Z" fill="#fbbc04"/>
        <path d="M17.12,12.22a5.1,5.1,0,0,0,0-9.78H12A5.1,5.1,0,0,0,12,12.22Z" fill="#ea4335"/>
    </svg>
)

export function Device999() {
    const { creations, addCreation, isLoaded } = useCreations();
    const { toast } = useToast();
    const { address, privateKey, balances, transactions, sendAsset, credit, generateNewWallet, isReady, swapAssets } = useWallet();
    const { dependents } = useFamily();
    const isOwner = address === OWNER_ADDRESS;
    
    const [activeTab, setActiveTab] = useState('wallet');
    const [isLoading, setIsLoading] = useState(false);
    const [operation, setOperation] = useState<string | null>(null);
    
    // File Encryption State
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [filePassword, setFilePassword] = useState('');

    // Wallet State
    const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
    const [tradeType, setTradeType] = useState<'send' | 'receive'>('send');
    const [selectedAsset, setSelectedAsset] = useState('DoN');
    const [sendAddress, setSendAddress] = useState('');
    const [sendAmount, setSendAmount] = useState<number | string>('');
    
    // Secure Share State
    const [shareFileId, setShareFileId] = useState<string | null>(null);
    const [sharePassword, setSharePassword] = useState('');
    const [receivedData, setReceivedData] = useState<string | null>(null);
    const [decryptionPassword, setDecryptionPassword] = useState('');

    // Buy DoN State
    const [isBuyDonDialogOpen, setIsBuyDonDialogOpen] = useState(false);
    const [buyAmount, setBuyAmount] = useState<number | string>(100);
    const [paymentAsset, setPaymentAsset] = useState('USDC');

    // Fiat Gateway State
    const [isFiatDialogOpen, setIsFiatDialogOpen] = useState(false);
    const [fiatAmount, setFiatAmount] = useState<number | string>(50);
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'google' | 'apple'>('card');
    const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvc: '' });
    const [isProcessingFiat, setIsProcessingFiat] = useState(false);

    const files = creations.filter(c => c.type === 'file' || c.type === 'image');
    const trustedContacts = useMemo(() => dependents.filter(d => d.sharedSecret), [dependents]);

    const portfolioValue = useMemo(() => {
        if (!balances) return 0;
        return SUPPORTED_ASSETS.reduce((acc, asset) => {
            const balance = balances[asset.ticker] || 0;
            if (balance === Infinity) return Infinity;
            return acc + (balance * asset.price);
        }, 0);
    }, [balances]);

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            try {
                atob(hash); 
                setReceivedData(hash);
                setActiveTab('share');
                toast({ title: "Secure Package Received", description: "Enter the password to unlock." });
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                console.error("Invalid hash data received:", e);
                toast({ title: "Invalid Share Link", description: "The received data is corrupted.", variant: "destructive" });
            }
        }
    }, [toast]);
    
    const handleEncryptFile = async () => {
        if (!selectedFileId || !filePassword) {
            toast({ title: "Please select a file and enter a password.", variant: "destructive" });
            return;
        }
        setIsLoading(true); setOperation('encrypt');
        const fileToEncrypt = creations.find(c => c.id === selectedFileId);
        if (!fileToEncrypt || !(fileToEncrypt.data instanceof Blob) && !fileToEncrypt.data.imageUrl) {
            toast({ title: "Selected item is not a valid file for encryption.", variant: "destructive" });
            setIsLoading(false); setOperation(null);
            return;
        }

        try {
            let dataToEncrypt = fileToEncrypt.data;
            if (fileToEncrypt.data.imageUrl) {
                const response = await fetch(fileToEncrypt.data.imageUrl);
                dataToEncrypt = await response.blob();
            }
            const encryptedBlob = await encryptBlob(dataToEncrypt as Blob, filePassword);
            const newFileName = `${fileToEncrypt.title}.enc`;
            await addCreation({ type: 'file', title: newFileName, path: fileToEncrypt.path, prompt: `Encrypted from ${fileToEncrypt.title}`, data: encryptedBlob });
            toast({ title: "Encryption Successful", description: `"${fileToEncrypt.title}" encrypted as "${newFileName}".` });
            setSelectedFileId(null); setFilePassword('');
        } catch (e) { toast({ title: "Encryption Failed", variant: "destructive" }); } finally { setIsLoading(false); setOperation(null); }
    };
    
    const handleDecryptFile = async () => {
        if (!selectedFileId || !filePassword) { toast({ title: "Please select a file and enter a password.", variant: "destructive" }); return; }
        const fileToDecrypt = creations.find(c => c.id === selectedFileId);
        if (!fileToDecrypt || !fileToDecrypt.title.endsWith('.enc')) { toast({ title: "Please select an encrypted file (.enc).", variant: "destructive" }); return; }
        setIsLoading(true); setOperation('decrypt');

        if (!(fileToDecrypt.data instanceof Blob)) return;
        try {
            const decryptedBlob = await decryptBlob(fileToDecrypt.data, filePassword);
            const url = URL.createObjectURL(decryptedBlob);
            const a = document.createElement('a');
            a.download = fileToDecrypt.title.replace(/\.enc$/, '');
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: "Decryption Successful", description: `Your download for "${a.download}" should start.` });
            setSelectedFileId(null); setFilePassword('');
        } catch (e: any) { toast({ title: "Decryption Failed", description: e.message, variant: "destructive" }); } finally { setIsLoading(false); setOperation(null); }
    };

    const handleGenerateWallet = async () => {
        setIsGeneratingWallet(true);
        await generateNewWallet();
        setIsGeneratingWallet(false);
    };

    const handleSend = () => {
        const amount = parseFloat(sendAmount as string);
        if (!sendAddress || !amount || amount <= 0) {
            toast({ title: "Invalid Input", description: "Please enter a valid recipient address and amount.", variant: "destructive" });
            return;
        }
        const success = sendAsset(selectedAsset, sendAddress, amount);
        if (success) {
            setIsTradeDialogOpen(false);
            setSendAddress('');
            setSendAmount('');
        }
    };
    
    const openTradeDialog = (type: 'send' | 'receive', assetTicker: string) => {
        setSelectedAsset(assetTicker);
        setTradeType(type);
        setSendAmount('');
        setSendAddress('');
        setIsTradeDialogOpen(true);
    };

    const handleCreateShareLink = async () => {
        if (!shareFileId || !sharePassword) { toast({ title: "Select a file and enter a one-time password.", variant: "destructive" }); return; }
        setIsLoading(true); setOperation('share-create');
        const fileToShare = creations.find(c => c.id === shareFileId);
        if (!fileToShare) { toast({ title: "File not found", variant: "destructive" }); setIsLoading(false); setOperation(null); return; }

        try {
            let dataToShare: Blob;
            if (fileToShare.data.imageUrl && typeof fileToShare.data.imageUrl === 'string') {
                 const response = await fetch(fileToShare.data.imageUrl);
                 dataToShare = await response.blob();
            } else if (fileToShare.data instanceof Blob) {
                dataToShare = fileToShare.data
            } else if (fileToShare.type === 'story' && typeof fileToShare.data.story === 'string') {
                dataToShare = new Blob([fileToShare.data.story], { type: 'text/plain' });
            } else {
                 toast({ title: "Unsupported File", description: "This file type cannot be shared.", variant: "destructive" });
                 setIsLoading(false); setOperation(null);
                 return;
            }
            
            const fileInfo = { name: fileToShare.title.replace(/\.enc$/, ''), type: dataToShare.type };
            const encryptedBlob = await encryptBlob(dataToShare, sharePassword);

            const reader = new FileReader();
            reader.readAsDataURL(new Blob([JSON.stringify(fileInfo), '\n', encryptedBlob]));
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const encodedData = btoa(base64data);
                const shareUrl = `${window.location.origin}/secure-share#${encodedData}`;
                navigator.clipboard.writeText(shareUrl);
                toast({ title: "Secure Link Copied!", description: "Send the link and share the password separately." });
                setShareFileId(null); setSharePassword('');
                setIsLoading(false); setOperation(null);
            };
        } catch (e) { console.error(e); toast({ title: "Failed to create share link", variant: "destructive" }); setIsLoading(false); setOperation(null); }
    };

    const handleReceiveSharedFile = async () => {
        if (!receivedData || !decryptionPassword) { toast({ title: "No data to decrypt or no password provided.", variant: "destructive" }); return; }
        setIsLoading(true); setOperation('share-receive');
        try {
            const base64data = atob(receivedData);
            const response = await fetch(base64data);
            const combinedBuffer = await response.arrayBuffer();
            
            const view = new Uint8Array(combinedBuffer);
            const newlineIndex = view.findIndex(b => b === 10);
            
            if (newlineIndex === -1) { throw new Error("Invalid package format."); }

            const fileInfoBytes = view.slice(0, newlineIndex);
            const encryptedBytes = view.slice(newlineIndex + 1);

            const fileInfo = JSON.parse(new TextDecoder().decode(fileInfoBytes));
            const encryptedBlob = new Blob([encryptedBytes]);
            
            const decryptedBlob = await decryptBlob(encryptedBlob, decryptionPassword);

            const url = URL.createObjectURL(decryptedBlob);
            const a = document.createElement('a');
            a.download = fileInfo.name || 'shared-file';
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);

            toast({ title: "Decryption Successful!", description: `Your download for "${a.download}" should start.` });
            setReceivedData(null); setDecryptionPassword('');
        } catch (e) { console.error(e); toast({ title: "Decryption Failed", description: "Incorrect password or corrupted data.", variant: "destructive" });
        } finally { setIsLoading(false); setOperation(null); }
    };
    
    const handleBuyDon = async () => {
        const amount = parseFloat(buyAmount as string);
        if (!amount || amount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a valid amount to buy.", variant: "destructive" });
            return;
        }
        const success = await swapAssets(paymentAsset, 'DoN', amount, amount);
        if (success) {
            setIsBuyDonDialogOpen(false);
            setBuyAmount(100);
        }
    };

    const openBuyDialog = () => {
        setBuyAmount(100);
        setPaymentAsset('USDC');
        setIsBuyDonDialogOpen(true);
    };

    const handleFiatPurchase = async () => {
        const amount = parseFloat(fiatAmount as string);
        if (!amount || amount <= 0) {
            toast({ title: "Invalid Amount", variant: "destructive" });
            return;
        }
        
        if (paymentMethod === 'card') {
            if (cardInfo.number.length < 19 || cardInfo.expiry.length < 5 || cardInfo.cvc.length < 3) {
                 toast({ title: "Invalid Card Details", description: "Please enter valid card information.", variant: "destructive" });
                 return;
            }
        }

        setIsProcessingFiat(true);
        toast({ title: "Processing Payment...", description: "Please do not close this window."});

        await new Promise(resolve => setTimeout(resolve, 3000));
        
        credit('USDC', amount, 'Simulated Fiat Purchase');

        toast({ title: "Purchase Successful!", description: `Your wallet has been credited with ${amount.toLocaleString()} USDC.` });
        
        setIsProcessingFiat(false);
        setIsFiatDialogOpen(false);
        setCardInfo({ number: '', expiry: '', cvc: '' });
        setFiatAmount(50);
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        const formatted = value.match(/.{1,4}/g)?.join(' ') || '';
        setCardInfo(c => ({...c, number: formatted.slice(0, 19)}));
    };
    
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, '');
        let formatted = value;
        if (value.length > 2) {
            formatted = `${value.slice(0, 2)}/${value.slice(2)}`;
        }
        setCardInfo(c => ({...c, expiry: formatted.slice(0, 5)}));
    };

    const selectedAssetInfo = SUPPORTED_ASSETS.find(a => a.ticker === selectedAsset);
    
    return (
        <ScrollArea className="h-full">
            <div className="p-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Security Center</h1>
                    <p className="text-muted-foreground">Manage file encryption, secure sharing, and your universal wallet. All operations are performed locally in your browser.</p>
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="wallet">Universal Wallet</TabsTrigger>
                        <TabsTrigger value="encryption">File Encryption</TabsTrigger>
                        <TabsTrigger value="share">Secure Share</TabsTrigger>
                        <TabsTrigger value="ledger">Universe Ledger</TabsTrigger>
                    </TabsList>

                    <TabsContent value="wallet" className="mt-6">
                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="md:col-span-1 space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" />Portfolio Value</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-3xl font-bold font-mono text-primary">
                                            {isOwner ? '∞' : portfolioValue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </div>
                                        <p className="text-xs text-muted-foreground">Estimated total value of all assets.</p>
                                    </CardContent>
                                    <CardFooter>
                                        {!isOwner && (
                                            <Button onClick={() => setIsFiatDialogOpen(true)} className="w-full">
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Add Funds with Fiat
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Wallet Credentials</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Wallet Address (Public)</Label>
                                            <Input readOnly value={isOwner ? "System Master Address (Immutable)" : address || ''} placeholder="Generate a wallet to see your public address" className="font-mono text-xs" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Encrypted Private Key</Label>
                                            <div className="flex gap-2">
                                                <Input readOnly type={showPrivateKey ? "text" : "password"} value={isOwner ? "********************************" : privateKey || ''} placeholder="Generate a wallet to see your private key" className="font-mono text-xs" />
                                                <Button variant="outline" size="icon" onClick={() => setShowPrivateKey(!showPrivateKey)} title={showPrivateKey ? "Hide Key" : "Reveal Key"} disabled={isOwner}>
                                                    {isOwner ? <EyeOff className="h-4 w-4" /> : (showPrivateKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />)}
                                                </Button>
                                            </div>
                                        </div>
                                        <Button onClick={handleGenerateWallet} disabled={isGeneratingWallet || isOwner} className="w-full" variant="secondary">
                                            {isGeneratingWallet ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                                            {address ? 'Generate New Wallet' : 'Generate Wallet'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-2">
                                <Card className="h-full">
                                    <CardHeader><CardTitle>Asset Holdings</CardTitle></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Asset</TableHead>
                                                    <TableHead className="text-right">Balance</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {!isReady || !balances ? Array.from({length: 5}).map((_, i) => (
                                                    <TableRow key={i}><TableCell colSpan={3}><div className="h-8 bg-muted animate-pulse rounded-md" /></TableCell></TableRow>
                                                )) : SUPPORTED_ASSETS.map(asset => (
                                                    <TableRow key={asset.ticker}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <asset.icon className="h-6 w-6" />
                                                                <div>
                                                                    <div className="font-medium">{asset.name}</div>
                                                                    <div className="text-xs text-muted-foreground">{asset.ticker}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono">
                                                            {isOwner ? '∞' : (balances[asset.ticker] || 0).toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex gap-2 justify-end">
                                                                {asset.isNative && !isOwner && (
                                                                    <Button size="sm" onClick={() => openBuyDialog()}>Buy</Button>
                                                                )}
                                                                <Button size="sm" variant="outline" onClick={() => openTradeDialog('send', asset.ticker)}><ArrowUpRight className="h-4 w-4" /></Button>
                                                                <Button size="sm" variant="outline" onClick={() => openTradeDialog('receive', asset.ticker)}><ArrowDownLeft className="h-4 w-4" /></Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="md:col-span-3">
                                <Card className="h-full">
                                    <CardHeader><CardTitle>Transaction History</CardTitle></CardHeader>
                                    <CardContent>
                                        <ScrollArea className="h-[250px]">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Date</TableHead>
                                                        <TableHead>Type</TableHead>
                                                        <TableHead>Memo</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {transactions.length > 0 ? transactions.map(tx => (
                                                        <TableRow key={tx.id} className={tx.status === 'pending' ? 'opacity-60' : ''}>
                                                            <TableCell className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2 capitalize">
                                                                    {tx.status === 'pending' && <Loader2 className="h-4 w-4 animate-spin"/>}
                                                                    {tx.type} {tx.status === 'pending' && `(${tx.status})`}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-muted-foreground">{tx.memo}</TableCell>
                                                            <TableCell className={cn("text-right font-mono", tx.amount > 0 ? 'text-green-500' : 'text-red-500')}>
                                                            {tx.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {tx.ticker}
                                                            </TableCell>
                                                        </TableRow>
                                                    )) : <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No transactions yet.</TableCell></TableRow>}
                                                </TableBody>
                                            </Table>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="encryption" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>File Encryption</CardTitle>
                                <CardDescription>Encrypt or decrypt files from your virtual drive using a password. Operations are performed locally.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><Lock /> Encrypt</h3>
                                        <div className="space-y-2">
                                            <Label>File to Encrypt</Label>
                                            <RadioGroup onValueChange={setSelectedFileId}>
                                                <ScrollArea className="h-48 border rounded-md p-2">
                                                    {isLoaded && files.filter(f => !f.title.endsWith('.enc')).map(file => (
                                                        <div key={file.id} className="flex items-center space-x-2 p-1">
                                                            <RadioGroupItem value={file.id} id={`enc-${file.id}`} />
                                                            <Label htmlFor={`enc-${file.id}`} className="font-normal flex items-center gap-2">{getIcon(file.type, file.title)} {file.title}</Label>
                                                        </div>
                                                    ))}
                                                </ScrollArea>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Encrypt for (Optional)</Label>
                                            <Select onValueChange={(depId) => setFilePassword(dependents.find(d => d.id === depId)?.sharedSecret || '')}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select a trusted contact..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {trustedContacts.map(dep => (
                                                        <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="enc-password">Password</Label>
                                            <Input id="enc-password" type="password" value={filePassword} onChange={(e) => setFilePassword(e.target.value)} placeholder="Enter a strong password or select a contact" />
                                        </div>
                                        <Button onClick={handleEncryptFile} disabled={isLoading || !selectedFileId || !filePassword}>
                                            {isLoading && operation === 'encrypt' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Lock className="mr-2 h-4 w-4"/>}
                                            Encrypt File
                                        </Button>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><Unlock /> Decrypt</h3>
                                        <div className="space-y-2">
                                            <Label>File to Decrypt</Label>
                                            <RadioGroup onValueChange={setSelectedFileId}>
                                                <ScrollArea className="h-48 border rounded-md p-2">
                                                    {isLoaded && files.filter(f => f.title.endsWith('.enc')).map(file => (
                                                        <div key={file.id} className="flex items-center space-x-2 p-1">
                                                            <RadioGroupItem value={file.id} id={`dec-${file.id}`} />
                                                            <Label htmlFor={`dec-${file.id}`} className="font-normal flex items-center gap-2">{getIcon(file.type, file.title)} {file.title}</Label>
                                                        </div>
                                                    ))}
                                                </ScrollArea>
                                            </RadioGroup>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="dec-password">Password</Label>
                                            <Input id="dec-password" type="password" value={filePassword} onChange={(e) => setFilePassword(e.target.value)} placeholder="Enter decryption password" />
                                        </div>
                                        <Button onClick={handleDecryptFile} disabled={isLoading || !selectedFileId || !filePassword}>
                                            {isLoading && operation === 'decrypt' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Unlock className="mr-2 h-4 w-4"/>}
                                            Decrypt & Download
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    
                    <TabsContent value="share" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Secure Share</CardTitle>
                                <CardDescription>Create a secure, password-protected link to share a file with anyone. The file is encrypted before it leaves your device.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2"><ArrowUpRight /> Create Share Link</h3>
                                    <div className="space-y-2">
                                        <Label>File to Share</Label>
                                        <Select onValueChange={setShareFileId} value={shareFileId || ''}>
                                            <SelectTrigger disabled={!isLoaded}>
                                                <SelectValue placeholder="Select a file..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {files.filter(f => !f.title.endsWith('.enc')).map(file => (
                                                    <SelectItem key={file.id} value={file.id}>{file.title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Share with (Optional)</Label>
                                        <Select onValueChange={(depId) => setSharePassword(dependents.find(d => d.id === depId)?.sharedSecret || '')}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a trusted contact..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {trustedContacts.map(dep => (
                                                    <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="share-password">One-Time Password</Label>
                                        <Input id="share-password" type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} placeholder="Enter a strong password or select a contact" />
                                    </div>
                                    <Button onClick={handleCreateShareLink} disabled={isLoading || !shareFileId || !sharePassword} className="w-full">
                                        {isLoading && operation === 'share-create' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Copy className="mr-2 h-4 w-4"/>}
                                        Create & Copy Link
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-lg flex items-center gap-2"><ArrowDownLeft /> Open Secure Package</h3>
                                    {receivedData ? (
                                        <div className="space-y-2">
                                            <Label htmlFor="decryption-password">Password for Received Package</Label>
                                            <Input id="decryption-password" type="password" value={decryptionPassword} onChange={(e) => setDecryptionPassword(e.target.value)} placeholder="Enter decryption password" />
                                            <Button onClick={handleReceiveSharedFile} disabled={isLoading || !decryptionPassword} className="w-full">
                                                {isLoading && operation === 'share-receive' ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Unlock className="mr-2 h-4 w-4"/>}
                                                Decrypt & Download
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-muted-foreground text-center py-8 border-2 border-dashed rounded-lg h-full flex items-center justify-center">
                                            Awaiting a secure package... Open a secure link to begin.
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="ledger" className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Universe Ledger</CardTitle>
                                <CardDescription>A record of significant transactions across the Infinite Universe. This is a public, immutable record.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[500px]">
                                <Table>
                                    <TableCaption>End of known transactions.</TableCaption>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Source</TableHead>
                                            <TableHead>Destination</TableHead>
                                            <TableHead>Memo</TableHead>
                                            <TableHead className="text-right">Amount (DoN)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mockLedgerEntries.map((tx) => (
                                            <TableRow key={tx.id}>
                                                <TableCell className="font-medium">{tx.timestamp}</TableCell>
                                                <TableCell>{tx.source}</TableCell>
                                                <TableCell>{tx.destination}</TableCell>
                                                <TableCell className="text-muted-foreground">{tx.memo}</TableCell>
                                                <TableCell className="text-right font-mono">{tx.amount.toLocaleString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="capitalize flex items-center gap-2">{tradeType} {selectedAssetInfo?.name}</DialogTitle>
                            {tradeType === 'receive' ? (
                                <DialogDescription>Share your public address to receive {selectedAsset}.</DialogDescription>
                            ) : (
                                <DialogDescription>Enter recipient and amount. Current balance: {(balances?.[selectedAsset] || 0).toLocaleString()} {selectedAsset}</DialogDescription>
                            )}
                        </DialogHeader>
                        {tradeType === 'receive' ? (
                            <div className="py-4 space-y-2">
                                <Label>Your Public Address</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={isOwner ? "System Master Address (Immutable)" : address || ''} className="font-mono text-xs" />
                                    <Button variant="outline" onClick={() => { if (!isOwner) { navigator.clipboard.writeText(address || ''); toast({title: "Address Copied!"})}}} disabled={isOwner}>Copy</Button>
                                </div>
                                {isOwner && <p className="text-xs text-muted-foreground">The Master Address cannot be shared for security reasons.</p>}
                            </div>
                        ) : (
                            <div className="py-4 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="send-address">Recipient Address</Label>
                                    <Input id="send-address" value={sendAddress} onChange={(e) => setSendAddress(e.target.value)} placeholder="don_addr_..." />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="send-amount">Amount ({selectedAsset})</Label>
                                    <Input id="send-amount" type="number" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} placeholder="0.00" />
                                </div>
                            </div>
                        )}
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            {tradeType === 'send' && <Button onClick={handleSend}>Send</Button>}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isBuyDonDialogOpen} onOpenChange={setIsBuyDonDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Buy DoN Coin</DialogTitle>
                            <DialogDescription>Purchase DoN using your stablecoin balance. Price: 1 DoN = 1 USD.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="buy-amount">Amount of DoN to Buy</Label>
                                <Input id="buy-amount" type="number" value={buyAmount} onChange={(e) => setBuyAmount(e.target.value)} placeholder="100" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="payment-asset">Pay with</Label>
                                <Select value={paymentAsset} onValueChange={setPaymentAsset}>
                                    <SelectTrigger id="payment-asset">
                                        <SelectValue placeholder="Select a stablecoin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USDC">USDC (Balance: {balances?.['USDC']?.toLocaleString() || 0})</SelectItem>
                                        <SelectItem value="USDT">USDT (Balance: {balances?.['USDT']?.toLocaleString() || 0})</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Card className="bg-muted/50 p-4">
                                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <span className="text-muted-foreground">You Pay</span>
                                    <span className="text-right font-mono text-red-500">
                                        {(parseFloat(buyAmount as string) || 0).toLocaleString()} {paymentAsset}
                                    </span>
                                    <span className="text-muted-foreground">You Receive</span>
                                    <span className="text-right font-mono text-green-500">
                                        {(parseFloat(buyAmount as string) || 0).toLocaleString()} DoN
                                    </span>
                                </div>
                            </Card>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            <Button onClick={handleBuyDon}>Confirm Purchase</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <Dialog open={isFiatDialogOpen} onOpenChange={setIsFiatDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Funds via Fiat Gateway</DialogTitle>
                            <DialogDescription>Purchase stablecoins with a simulated payment. These can then be used to buy DoN.</DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fiat-amount">Amount (USD)</Label>
                                <Input id="fiat-amount" type="number" value={fiatAmount} onChange={e => setFiatAmount(e.target.value)} placeholder="50.00" />
                            </div>
                            <Tabs defaultValue="card" onValueChange={val => setPaymentMethod(val as any)}>
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="card"><WalletCards className="mr-2 h-4 w-4"/>Card</TabsTrigger>
                                    <TabsTrigger value="google"><GooglePayIcon className="mr-2 h-5 w-5"/>Pay</TabsTrigger>
                                    <TabsTrigger value="apple"><Apple className="mr-2 h-5 w-5"/>Pay</TabsTrigger>
                                </TabsList>
                                <TabsContent value="card" className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="card-number">Card Number</Label>
                                        <Input id="card-number" value={cardInfo.number} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="expiry">Expiry</Label>
                                            <Input id="expiry" value={cardInfo.expiry} onChange={handleExpiryChange} placeholder="MM/YY" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cvc">CVC</Label>
                                            <Input id="cvc" value={cardInfo.cvc} onChange={e => setCardInfo(c => ({...c, cvc: e.target.value.replace(/\D/g, '').slice(0,3)}))} placeholder="123" />
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="google" className="text-center p-8 space-y-2">
                                    <GooglePayIcon className="h-10 w-10 mx-auto text-gray-400" />
                                    <p className="text-sm text-muted-foreground">This is a simulated Google Pay flow.</p>
                                </TabsContent>
                                <TabsContent value="apple" className="text-center p-8 space-y-2">
                                    <Apple className="h-10 w-10 mx-auto" />
                                    <p className="text-sm text-muted-foreground">This is a simulated Apple Pay flow.</p>
                                </TabsContent>
                            </Tabs>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost" disabled={isProcessingFiat}>Cancel</Button></DialogClose>
                            <Button onClick={handleFiatPurchase} disabled={isProcessingFiat}>
                                {isProcessingFiat && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                {isProcessingFiat ? 'Processing...' : `Purchase ${parseFloat(fiatAmount as string) || 0} USDC`}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ScrollArea>
    );
}
