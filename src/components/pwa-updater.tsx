
'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export function PwaUpdater() {
  const { toast } = useToast();

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window as any).workbox !== undefined
    ) {
      const wb = (window as any).workbox;

      // This function is called when a new service worker is waiting.
      const onWaiting = () => {
        toast({
          title: 'Update Available',
          description: 'A new version of the app is ready. Click the button to update.',
          variant: 'default',
          duration: Infinity, // Persist until user action
          action: (
            <Button onClick={() => wb.messageSW({ type: 'SKIP_WAITING' })}>
              Refresh
            </Button>
          ),
        });
      };

      // This function is called when the new service worker has taken control.
      const onControlling = (event: { isUpdate: boolean }) => {
        if (event.isUpdate) {
          window.location.reload();
        }
      };

      // Add event listeners
      wb.addEventListener('waiting', onWaiting);
      wb.addEventListener('controlling', onControlling);

      // Unregister the listeners when the component unmounts
      return () => {
        wb.removeEventListener('waiting', onWaiting);
        wb.removeEventListener('controlling', onControlling);
      };
    }
  }, [toast]);

  // This component does not render any UI itself
  return null;
}
