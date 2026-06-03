
'use client';

import Link from 'next/link';
import { Vault, ArrowRight, Loader2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AGE_GATE_KEY = 'infinite-universe-age-verified';

export default function VaultSplashPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    if (localStorage.getItem(AGE_GATE_KEY) !== 'true') {
      router.replace('/age-gate');
    } else {
      setIsVerifying(false);
    }
  }, [router]);

  if (isVerifying) {
    return (
       <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-background p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-background p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Glow Effect */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-[40vw] h-[40vh] bg-primary/20 blur-3xl rounded-full"></div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center py-16">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-foreground">
          Infinite Universe
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          A secure, quantum-resistant desktop environment. Click the vault to enter your secure enclave.
        </p>
        
        <Link href="/unlock" className="group">
          <div className="relative">
            {/* Pulsing glow */}
            <div className="absolute -inset-2 bg-primary/50 rounded-full blur-xl opacity-75 animate-pulse group-hover:opacity-100 transition-opacity"></div>
            
            {/* Icon container */}
            <div className="relative flex items-center justify-center w-40 h-40 bg-card border rounded-full shadow-2xl transition-transform group-hover:scale-105">
              <Vault className="h-20 w-20 text-primary" />
            </div>
          </div>
        </Link>
        
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Link href="/unlock">
            Launch Secure Enclave <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        
        <Card className="max-w-md bg-background/50 text-left animate-in fade-in-50 delay-500 duration-500 fill-mode-both">
          <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-xl">
                  <Coins className="h-5 w-5 text-primary" />
                  The Universe Economy
              </CardTitle>
              <CardDescription>How to thrive in the Infinite Universe.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Earning DoN Coin:</strong> Contribute value to the universe by forging Genesis Blocks for new worlds or winning high-stakes matches in the Strategic Command center.</p>
              <p><strong className="text-foreground">The Master Key:</strong> For development access, the master key is "<strong className="text-primary font-mono">don</strong>". Using this key will grant a one-time bonus of 1,000 DoN to begin your journey. Any other key will be denied.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="absolute bottom-4 text-xs text-muted-foreground z-10">
        &copy; 2025 DoN
      </div>
    </div>
  );
}
