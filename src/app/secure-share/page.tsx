
'use client';

import React, { useState, useEffect } from 'react';
import { useCreations, Creation } from '@/context/CreationsContext';
import { useToast } from '@/hooks/use-toast';
import { encryptBlob, decryptBlob } from '@/lib/crypto';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Lock, Unlock, Copy, Check } from 'lucide-react';

export default function SecureSharePage() {
    const { creations, isLoaded } = useCreations();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    
    // Create Share State
    const [shareFileId, setShareFileId] = useState<string | null>(null);
    const [sharePassword, setSharePassword] = useState('');
    
    // Receive Share State
    const [receivedData, setReceivedData] = useState<string | null>(null);
    const [decryptionPassword, setDecryptionPassword] = useState('');
    const [hasCopied, setHasCopied] = useState(false);

    useEffect(() => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            try {
                atob(hash); 
                setReceivedData(hash);
                toast({ title: "Secure Package Received", description: "Enter the password to unlock it." });
                // Clear the hash from the URL
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                console.error("Invalid hash data received:", e);
                toast({ title: "Invalid Share Link", description: "The received data is corrupted.", variant: "destructive" });
            }
        }
    }, [toast]);
    
    const handleCreateShareLink = async () => {
        if (!shareFileId || !sharePassword) {
            toast({ title: "Select a file and enter a password.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        const fileToShare = creations.find(c => c.id === shareFileId);
        if (!fileToShare) {
            toast({ title: "File not found", variant: "destructive" });
            setIsLoading(false);
            return;
        }

        try {
            let dataToShare: Blob;
            if (fileToShare.data.imageUrl && typeof fileToShare.data.imageUrl === 'string') {
                 const response = await fetch(fileToShare.data.imageUrl);
                 dataToShare = await response.blob();
            } else if (fileToShare.data instanceof Blob) {
                dataToShare = fileToShare.data;
            } else if (fileToShare.type === 'story' && typeof fileToShare.data.story === 'string') {
                dataToShare = new Blob([fileToShare.data.story], { type: 'text/plain' });
            } else {
                 toast({ title: "Unsupported File", description: "This file type cannot be shared.", variant: "destructive" });
                 setIsLoading(false);
                 return;
            }
            
            const fileInfo = { name: fileToShare.title, type: dataToShare.type };
            const encryptedBlob = await encryptBlob(dataToShare, sharePassword);

            const reader = new FileReader();
            reader.readAsDataURL(new Blob([JSON.stringify(fileInfo), '\n', encryptedBlob]));
            reader.onloadend = () => {
                const base64data = reader.result as string;
                const encodedData = btoa(base64data);
                const shareUrl = `${window.location.origin}/secure-share#${encodedData}`;
                
                navigator.clipboard.writeText(shareUrl);
                setHasCopied(true);
                setTimeout(() => setHasCopied(false), 2000);
                
                toast({ title: "Secure Link Copied!", description: "Share the link and password separately." });
                setShareFileId(null);
                setSharePassword('');
            };
        } catch (e) {
            console.error(e);
            toast({ title: "Failed to create share link", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReceiveSharedFile = async () => {
        if (!receivedData || !decryptionPassword) {
            toast({ title: "No data to decrypt or no password provided.", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            const base64data = atob(receivedData);
            const response = await fetch(base64data);
            const combinedBuffer = await response.arrayBuffer();
            
            const view = new Uint8Array(combinedBuffer);
            const newlineIndex = view.findIndex(b => b === 10); // Find the first newline character (ASCII 10)
            
            if (newlineIndex === -1) { throw new Error("Invalid package format: No metadata found."); }

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
            setReceivedData(null);
            setDecryptionPassword('');
        } catch (e) {
            console.error(e);
            toast({ title: "Decryption Failed", description: "Incorrect password or corrupted data.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const files = creations.filter(c => c.type !== 'folder');

    return (
        <DashboardLayout>
            <PageHeader
                title="Secure Share"
                description="Create and open end-to-end encrypted packages to share files with anyone."
            />
            <div className="grid md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Lock />Create Secure Package</CardTitle>
                        <CardDescription>Encrypt a file from your drive with a one-time password and generate a shareable link.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>File to Encrypt</Label>
                            <Select onValueChange={setShareFileId} value={shareFileId || ''}>
                                <SelectTrigger disabled={!isLoaded}>
                                    <SelectValue placeholder="Select a file from your drive..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {files.map(file => (
                                        <SelectItem key={file.id} value={file.id}>{file.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="share-password">One-Time Password</Label>
                            <Input id="share-password" type="password" value={sharePassword} onChange={(e) => setSharePassword(e.target.value)} placeholder="Enter a strong password" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleCreateShareLink} disabled={isLoading || !shareFileId || !sharePassword}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (hasCopied ? <Check className="mr-2 h-4 w-4 text-green-400" /> : <Copy className="mr-2 h-4 w-4" />)}
                            {hasCopied ? "Copied!" : "Create & Copy Link"}
                        </Button>
                    </CardFooter>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Unlock />Open Secure Package</CardTitle>
                        <CardDescription>If you've received a secure link, paste it in your browser. Then enter the password here to decrypt and download the file.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {receivedData ? (
                            <div className="space-y-2">
                                <Label htmlFor="decryption-password">Password for Received Package</Label>
                                <Input id="decryption-password" type="password" value={decryptionPassword} onChange={(e) => setDecryptionPassword(e.target.value)} placeholder="Enter decryption password" />
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground text-center py-8">
                                Awaiting a secure package... Open a secure link to begin.
                            </div>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full" onClick={handleReceiveSharedFile} disabled={isLoading || !receivedData || !decryptionPassword}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Decrypt & Download File
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </DashboardLayout>
    );
}
