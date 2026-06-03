'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Loader2 } from 'lucide-react';

export default function OldP2PChatRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // This is a legacy route. Redirect to the new dedicated Secure Share app.
    router.replace(`/secure-share`);
  }, [router]);

  return (
    <DashboardLayout>
      <div className="flex h-full w-full items-center justify-center text-center">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Redirecting to Secure Share...</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
