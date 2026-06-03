
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const AGE_GATE_KEY = 'infinite-universe-age-verified';

export default function AgeGatePage() {
  const [isAgreed, setIsAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Ensure localStorage is only accessed on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // If user has already verified, send them away.
    // This now only runs on the client after the initial render.
    if (isClient && localStorage.getItem(AGE_GATE_KEY) === 'true') {
      router.replace('/welcome');
    }
  }, [router, isClient]);

  const handleProceed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return;

    setIsLoading(true);

    // Simulate a brief delay
    setTimeout(() => {
      localStorage.setItem(AGE_GATE_KEY, 'true');
      router.replace('/welcome');
    }, 500);
  };
  
  // Don't render the form until we are on the client to avoid mismatch
  if (!isClient) {
    return (
        <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-background p-4">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden flex items-center justify-center bg-background p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Glow Effect */}
      <div className="absolute -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2 w-[40vw] h-[40vh] bg-primary/20 blur-3xl rounded-full"></div>

      <Card className="w-full max-w-lg z-10 animate-in fade-in-50 zoom-in-95">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="font-headline text-2xl">Access Verification</CardTitle>
          <CardDescription>Please confirm the following to enter the Infinite Universe.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProceed} className="space-y-6">
             <div className="space-y-4 text-sm text-muted-foreground p-4 border rounded-lg bg-muted/50">
                <p>By entering, you affirm that you are of legal adult age in your jurisdiction and agree to the following principles:</p>
                <ul className="list-disc list-inside space-y-2">
                    <li>You will not use this platform to generate hateful, harassing, violent, or illegal content.</li>
                    <li>You understand that AI-generated content may be unpredictable or inaccurate.</li>
                    <li>You accept full responsibility for your creations and their use.</li>
                </ul>
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={isAgreed} onCheckedChange={(checked) => setIsAgreed(checked as boolean)} />
                <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    I agree to these terms and confirm I am of legal age.
                </label>
            </div>
            <Button type="submit" className="w-full" disabled={!isAgreed || isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Verifying...' : 'Enter Universe'}
            </Button>
          </form>
        </CardContent>
         <CardFooter>
          <div className="w-full text-center text-muted-foreground text-xs">
            <p>Safety and responsibility are core principles of the Infinite Universe.</p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
