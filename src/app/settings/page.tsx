
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import JSZip from "jszip";
import { useCreations } from '@/context/CreationsContext';
import { DashboardLayout } from '@/components/dashboard-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Key, Bot, Loader2, HardDrive, ArrowRight, DownloadCloud, Shield, LayoutDashboard, Cpu, MemoryStick, GanttChartSquare, BrainCircuit, Heart, Trash2, Fingerprint, Coins, Globe, Terminal as TerminalIcon, Server, Wallet as WalletIcon, Map, Bug, Upload, BookOpen } from 'lucide-react';
import { generateApiKey, saveApiSettings } from '@/ai/flows/manage-api-key';
import { getFriendlyAIError } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useFamily, Dependent } from '@/context/FamilyContext';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useWebAuthn } from '@/hooks/use-webauthn';
import { useWallet, OWNER_ADDRESS } from '@/context/WalletContext';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useBlueprint } from '@/hooks/use-blueprint';


export default function SettingsPage() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [apiKeySource, setApiKeySource] = useState('default');
  const [model, setModel] = useState('googleai/gemini-1.5-flash-latest');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const { creations, isLoaded } = useCreations();
  const [isZipping, setIsZipping] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isOnline = useOnlineStatus();
  
  const { address } = useWallet();
  const isOwner = address === OWNER_ADDRESS;

  const { dependents, addDependent, removeDependent, isFamilyLoaded, updateDependent } = useFamily();
  const [newDependentName, setNewDependentName] = useState('');
  const [newDependentAddress, setNewDependentAddress] = useState('');

  const { isSupported: isWebAuthnSupported, isRegistered, isProcessing: isWebAuthnProcessing, registerDevice, unregisterDevice } = useWebAuthn();

  const [usdcTreasuryAddress, setUsdcTreasuryAddress] = useState('');
  const [usdtTreasuryAddress, setUsdtTreasuryAddress] = useState('');

  const [editingDependent, setEditingDependent] = useState<Dependent | null>(null);
  const [updatedName, setUpdatedName] = useState('');
  const [updatedSecret, setUpdatedSecret] = useState('');
  
  const { blueprintContent, setBlueprintContent } = useBlueprint();

  // Load settings from localStorage and set up PWA install prompt listener
  useEffect(() => {
    const storedApiKey = localStorage.getItem('infinite-universe-api-key');
    const storedApiKeySource = localStorage.getItem('infinite-universe-api-key-source');
    if (storedApiKey) setApiKey(storedApiKey);
    if (storedApiKeySource) setApiKeySource(storedApiKeySource);
    
    const storedModel = localStorage.getItem('infinite-universe-model');
    if (storedModel) setModel(storedModel);

    const usdcAddr = localStorage.getItem('don-treasury-usdc-addr');
    const usdtAddr = localStorage.getItem('don-treasury-usdt-addr');
    if (usdcAddr) setUsdcTreasuryAddress(usdcAddr);
    if (usdtAddr) setUsdtTreasuryAddress(usdtAddr);
    
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };

  }, []);

  const handleSaveSettings = async () => {
    if (!isOnline) {
      toast({ title: "You are offline", description: "Settings cannot be saved while offline.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    // Save non-sensitive settings to localStorage for UI persistence
    localStorage.setItem('infinite-universe-model', model);
    localStorage.setItem('infinite-universe-api-key-source', apiKeySource);
    // Also save the key to LS so the user can see what they've entered.
    // The secure cookie is the source of truth for the server.
    if (apiKeySource === 'custom') {
      localStorage.setItem('infinite-universe-api-key', apiKey);
    } else {
      localStorage.removeItem('infinite-universe-api-key');
    }
    
    // Save treasury settings
    localStorage.setItem('don-treasury-usdc-addr', usdcTreasuryAddress);
    localStorage.setItem('don-treasury-usdt-addr', usdtTreasuryAddress);

    // Save the actual key and source to a secure cookie for server-side use
    try {
        await saveApiSettings(apiKeySource, apiKeySource === 'custom' ? apiKey : '');
        toast({
          title: 'Settings Saved',
          description: 'Your preferences have been updated.',
        });
    } catch (error) {
        console.error("Failed to save settings via server action", error);
        toast({ title: 'Save Failed', description: 'Could not update your API key settings.', variant: 'destructive'});
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleGenerateKey = async () => {
    setIsGeneratingKey(true);
    try {
      const result = await generateApiKey();
      setApiKey(result.newApiKey);
      toast({
        title: 'New API Key Generated',
        description: 'The new key has been populated in the input field. Remember to save it.',
      });
    } catch (error) {
      console.error("Error generating key:", error);
      toast({
        title: "Error Generating Key",
        description: getFriendlyAIError(error),
        variant: "destructive",
      });
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleDownloadBackup = async () => {
    if (!creations.length) {
        toast({ title: "Nothing to back up.", description: "Your virtual drive is empty." });
        return;
    }
    setIsZipping(true);
    toast({ title: "Creating Backup...", description: "Preparing your full virtual drive for download. This may take a moment." });

    const zip = new JSZip();

    for (const creation of creations) {
        if (creation.type !== 'folder') {
            const fullPath = (creation.path + creation.title).substring(1);
            let fileData: Blob | undefined;
            
            try {
                switch (creation.type) {
                    case 'image':
                    case 'file':
                         if (creation.data instanceof Blob) {
                            fileData = creation.data;
                         } else if (creation.data?.imageUrl) {
                            const response = await fetch(creation.data.imageUrl);
                            fileData = await response.blob();
                         }
                        break;
                    case 'music':
                    case 'speech':
                        if (creation.data?.audioDataUri) {
                            const response = await fetch(creation.data.audioDataUri);
                            fileData = await response.blob();
                        }
                        break;
                    case 'story':
                        const storyBasePath = (creation.path + creation.title).substring(1);
                        zip.file(`${storyBasePath}/story.txt`, creation.data.story || '');
                        if (creation.data.imageUrl) {
                             const response = await fetch(creation.data.imageUrl);
                             zip.file(`${storyBasePath}/illustration.png`, await response.blob());
                        }
                         if (creation.data.audioDataUri) {
                             const response = await fetch(creation.data.audioDataUri);
                             zip.file(`${storyBasePath}/narration.wav`, await response.blob());
                        }
                        break;
                    case 'video':
                         const videoBasePath = (creation.path + creation.title).substring(1);
                         if (Array.isArray(creation.data?.imageUrls)) {
                            for (let i = 0; i < creation.data.imageUrls.length; i++) {
                                const url = creation.data.imageUrls[i];
                                if(url) {
                                    const response = await fetch(url);
                                    zip.file(`${videoBasePath}/frame_${i + 1}.png`, await response.blob());
                                }
                            }
                         }
                        break;
                }

                if (fileData) {
                    zip.file(fullPath, fileData);
                }

            } catch (error) {
                console.error(`Failed to process ${creation.title} for backup:`, error);
            }
        }
    }

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = `infinite-universe-backup-${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        toast({ title: "Backup Successful!", description: "Your virtual drive has been downloaded." });
    } catch (error) {
        console.error("Failed to generate zip file:", error);
        toast({ title: "Backup Failed", description: "Could not create the zip file.", variant: "destructive" });
    } finally {
        setIsZipping(false);
    }
  };
  
  const handleInstallClick = async () => {
    if (!installPrompt) {
      toast({
        title: "Cannot Install Application",
        description: "The app may already be installed, or your browser doesn't support this feature. Try adding to your Home Screen or Desktop manually from the browser menu.",
      });
      return;
    }
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({ title: 'Installation successful!' });
    } else {
      toast({ title: 'Installation dismissed.' });
    }
    setInstallPrompt(null);
  };

  const handleAddDependent = () => {
    addDependent(newDependentName, newDependentAddress);
    setNewDependentName('');
    setNewDependentAddress('');
  }

  const handleManageClick = (dep: Dependent) => {
    setEditingDependent(dep);
    setUpdatedName(dep.name);
    setUpdatedSecret(dep.sharedSecret || '');
  }

  const handleUpdateDependent = () => {
    if (editingDependent) {
        updateDependent(editingDependent.id, { name: updatedName, sharedSecret: updatedSecret });
        setEditingDependent(null);
    }
  }

  const handleBlueprintUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && (file.name.endsWith('.md') || file.name.endsWith('.txt'))) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setBlueprintContent(content);
        toast({ title: "Blueprint Loaded", description: `${file.name} has been integrated into the session.` });
      };
      reader.onerror = () => {
        toast({ title: "Error reading file", variant: "destructive" });
      };
      reader.readAsText(file);
    } else if (file) {
      toast({ title: "Invalid File Type", description: "Please upload a markdown (.md) or text (.txt) file.", variant: "destructive" });
    }
  };

  const handleDownloadBlueprint = (format: 'md' | 'txt') => {
    if (!blueprintContent) {
      toast({ title: "No Blueprint to Download", description: "Upload or create a blueprint first.", variant: "destructive" });
      return;
    }
    const blob = new Blob([blueprintContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TECHNICAL_NOTES.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Settings"
        description="Manage your API keys, AI blueprint, and system preferences."
      />
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <CardDescription>
              Manage your API key and select your preferred generative models. {isOnline ? '' : '(Offline)'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>API Key Source</Label>
              <RadioGroup value={apiKeySource} onValueChange={(value) => setApiKeySource(value)} className="flex items-center gap-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="api-default" disabled={!isOnline} />
                  <Label htmlFor="api-default" className="font-normal">Default Provider (No key needed)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="api-custom" disabled={!isOnline} />
                  <Label htmlFor="api-custom" className="font-normal">Custom API Key</Label>
                </div>
              </RadioGroup>
            </div>

            {apiKeySource === 'custom' && (
              <div className="space-y-4 animate-in fade-in-0 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Your Google AI API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your Google AI API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    disabled={!isOnline}
                  />
                </div>
                <Button onClick={handleGenerateKey} variant="outline" disabled={isGeneratingKey || !isOnline}>
                  {isGeneratingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />}
                  {isGeneratingKey ? 'Generating...' : 'Generate New Dev Key'}
                </Button>
              </div>
            )}
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="model-select">Generative Model</Label>
              <Select value={model} onValueChange={setModel} disabled={!isOnline}>
                <SelectTrigger id="model-select" className="w-full md:w-1/2">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="googleai/gemini-1.5-flash-latest">Gemini 1.5 Flash (Fast & Cost-Effective)</SelectItem>
                  <SelectItem value="googleai/gemini-2.0-flash">Gemini 2.0 Flash (Fast & Efficient)</SelectItem>
                  <SelectItem value="googleai/gemini-1.5-pro-latest">Gemini 1.5 Pro (Powerful & Large Context)</SelectItem>
                  <SelectItem value="googleai/gemini-2.5-pro">Gemini 2.5 Pro (Most Powerful & Creative)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-6 w-6" /> Manage AI Blueprint</CardTitle>
             <CardDescription className="space-y-2 text-sm text-muted-foreground">
                <p>The AI Blueprint is the architect's "long-term memory" for this project. Use this section to manage your project's master plan and transfer it between projects.</p>
                <p className="font-semibold text-foreground">How it Works:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li><strong className="text-foreground">Upload:</strong> Start a new project by uploading an existing blueprint (.md or .txt). This file's content becomes the AI's primary context.</li>
                    <li><strong className="text-foreground">Autosave:</strong> Any uploaded blueprint is automatically saved to this browser's local storage for the current project.</li>
                    <li><strong className="text-foreground">Download:</strong> Save the currently loaded blueprint to your computer. This is how you transfer your architectural work between projects or back it up.</li>
                </ol>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="blueprint-upload">Upload Blueprint File (.md, .txt)</Label>
                <Input id="blueprint-upload" type="file" accept=".md,.txt" onChange={handleBlueprintUpload} />
              </div>
              {blueprintContent && (
                <div className="p-4 bg-muted/50 rounded-lg text-sm text-muted-foreground space-y-2">
                  <p className="font-semibold text-foreground">Blueprint Loaded (autosaved)</p>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-all max-h-48 overflow-y-auto p-2 bg-slate-800 text-slate-300 rounded">
                    {blueprintContent}
                  </pre>
                   <div className="flex gap-2 pt-2">
                        <Button variant="secondary" size="sm" onClick={() => handleDownloadBlueprint('md')}>Download TECHNICAL_NOTES.md</Button>
                        <Button variant="secondary" size="sm" onClick={() => handleDownloadBlueprint('txt')}>Download TECHNICAL_NOTES.txt</Button>
                    </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Virtual Desktop</CardTitle>
            <CardDescription>
                Access your personal, secure desktop environment. All files are stored on your device, not on a server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
                <Link href="/desktop">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Open Virtual Desktop
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Backup</CardTitle>
            <CardDescription>
                Download a full backup of your Virtual Desktop. This .zip file will contain all your creations and can be used for offline storage or migration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDownloadBackup} disabled={isZipping || !isLoaded}>
                {isZipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
                {isZipping ? 'Creating Backup...' : 'Download Full Backup'}
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DownloadCloud className="h-6 w-6" />
              Install Application
            </CardTitle>
            <CardDescription>
              Add Infinite Universe to your device for a native-like, offline-first experience. It works across desktops (Windows, macOS, Linux) and mobile (Android, iOS).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInstallClick} disabled={!installPrompt}>
              <DownloadCloud className="mr-2 h-4 w-4" />
              Install on this Device
            </Button>
            {!installPrompt && (
              <p className="text-sm text-muted-foreground mt-4">
                This application may already be installed, or your browser does not support direct installation. Try using the 'Add to Home Screen' or 'Install App' option in your browser's menu.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Fingerprint className="h-6 w-6" />
                Biometric Security
            </CardTitle>
            <CardDescription>
                Enable passwordless authorization for critical actions by registering this device's biometrics (e.g., Touch ID, Face ID, Windows Hello).
            </CardDescription>
          </CardHeader>
          <CardContent>
             {isWebAuthnSupported ? (
                isRegistered ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-green-500/10 text-green-700 dark:text-green-300 rounded-lg border border-green-500/30">
                        <div>
                            <h4 className="font-semibold">This Device is Registered</h4>
                            <p className="text-sm">Biometric authentication is active.</p>
                        </div>
                        <Button variant="destructive" onClick={unregisterDevice}>
                            Unregister Device
                        </Button>
                    </div>
                ) : (
                    <Button onClick={registerDevice} disabled={isWebAuthnProcessing}>
                        {isWebAuthnProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-2 h-4 w-4" />}
                        {isWebAuthnProcessing ? 'Registering...' : 'Register this Device'}
                    </Button>
                )
             ) : (
                <div className="p-4 bg-muted/50 rounded-lg text-muted-foreground text-sm">
                    Biometric authentication is not supported on this browser or device.
                </div>
             )}
          </CardContent>
           <CardFooter>
              <p className="text-xs text-muted-foreground">
                Powered by WebAuthn. Your biometric data never leaves your device and is not sent to any server.
              </p>
           </CardFooter>
        </Card>
        
        {isOwner && (
          <Card>
              <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                      <Coins className="h-6 w-6" />
                      Treasury Management
                  </CardTitle>
                  <CardDescription>
                      Set the destination addresses for stablecoin-based DoN purchases from users.
                  </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="usdc-addr">USDC Receiving Address</Label>
                      <Input
                          id="usdc-addr"
                          placeholder="Enter your USDC wallet address"
                          value={usdcTreasuryAddress}
                          onChange={(e) => setUsdcTreasuryAddress(e.target.value)}
                      />
                  </div>
                    <div className="space-y-2">
                      <Label htmlFor="usdt-addr">USDT Receiving Address</Label>
                      <Input
                          id="usdt-addr"
                          placeholder="Enter your USDT wallet address"
                          value={usdtTreasuryAddress}
                          onChange={(e) => setUsdtTreasuryAddress(e.target.value)}
                      />
                  </div>
              </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Heart className="h-6 w-6" />
                Family Trust
            </CardTitle>
            <CardDescription>
                 Recognize trusted individuals within your digital dynasty. Add their name and public DoN address to your trust, and assign them a shared secret for secure P2P interactions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4">
                <h4 className="font-medium">Add New Dependent</h4>
                <div className="space-y-2">
                    <Label htmlFor="dep-name">Dependent's Name</Label>
                    <Input id="dep-name" placeholder="e.g., Jane Doe" value={newDependentName} onChange={e => setNewDependentName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dep-address">Dependent's DoN Address</Label>
                    <Input id="dep-address" placeholder="don_addr_..." value={newDependentAddress} onChange={e => setNewDependentAddress(e.target.value)} />
                </div>
                <Button onClick={handleAddDependent}>Add to Trust</Button>
            </div>
            
            <div className="space-y-2">
                <h4 className="font-medium">Recognized Dependents</h4>
                {isFamilyLoaded ? (
                    dependents.length > 0 ? (
                        <div className="space-y-2">
                            {dependents.map(dep => (
                                <Card key={dep.id} className="flex items-center justify-between p-3">
                                    <div>
                                        <p className="font-semibold">{dep.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{dep.address}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button variant="outline" size="sm" onClick={() => handleManageClick(dep)}>Manage</Button>
                                        <Button variant="ghost" size="icon" onClick={() => removeDependent(dep.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No dependents have been added to the trust.</p>
                    )
                ) : (
                    <Skeleton className="h-10 w-full" />
                )}
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSaveSettings} disabled={isSaving || !isOnline}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
          Save All Settings
        </Button>
      </div>
      
      <Dialog open={!!editingDependent} onOpenChange={(open) => !open && setEditingDependent(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Manage Dependent</DialogTitle>
                <DialogDescription>Update the details and shared secret for this contact.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="manage-name">Name</Label>
                    <Input id="manage-name" value={updatedName} onChange={e => setUpdatedName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                    <Label>DoN Address</Label>
                    <Input readOnly disabled value={editingDependent?.address || ''} className="font-mono text-xs" />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="manage-secret">Shared Secret (Password)</Label>
                    <Input id="manage-secret" type="password" value={updatedSecret} onChange={e => setUpdatedSecret(e.target.value)} placeholder="Leave blank to remove secret" />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                <Button onClick={handleUpdateDependent}>Save Changes</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
