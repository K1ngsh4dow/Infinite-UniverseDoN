'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Loader2 } from 'lucide-react';

export default function QuantumAscentRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/desktop`);
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex h-full w-full items-center justify-center text-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Launching Quantum Ascent on the Desktop...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
