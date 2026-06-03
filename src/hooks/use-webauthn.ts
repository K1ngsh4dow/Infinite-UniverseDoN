'use client';

import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { useWallet } from '@/context/WalletContext';

// --- Helper functions for ArrayBuffer <-> Base64URL conversion ---
// This format is required by the WebAuthn spec for transport.
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// --- Local Storage Key ---
const WEBAUTHN_CREDENTIAL_KEY = 'don-wallet-webauthn-credential';

/**
 * A hook for managing WebAuthn registration and authentication.
 */
export const useWebAuthn = () => {
  const { toast } = useToast();
  const { address, isReady } = useWallet();
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [credentialId, setCredentialId] = useState<string | null>(null);

  // Check for WebAuthn support and existing registration on component mount.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.PublicKeyCredential) {
      setIsSupported(true);
      const storedCredentialId = localStorage.getItem(WEBAUTHN_CREDENTIAL_KEY);
      if (storedCredentialId) {
        setIsRegistered(true);
        setCredentialId(storedCredentialId);
      }
    }
  }, []);

  /**
   * Registers the current device using WebAuthn.
   * This creates a public/private key pair, with the private key stored
   * securely in the device's hardware.
   */
  const registerDevice = useCallback(async () => {
    if (!isSupported || !isReady || !address) {
      toast({ title: 'Prerequisites not met', description: 'WebAuthn is not supported or wallet is not ready.', variant: 'destructive' });
      return;
    }
    if (isRegistered) {
      toast({ title: 'Device Already Registered', description: 'This device already has a biometric key associated with it.', variant: 'destructive' });
      return;
    }
    
    setIsProcessing(true);

    try {
      // A unique challenge is sent from the server in a real application
      // to prevent replay attacks. Here we generate it on the client for simplicity.
      const challenge = window.crypto.getRandomValues(new Uint8Array(32));
      const userId = new TextEncoder().encode(address);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { // Relying Party (this website)
            name: 'Infinite Universe',
          },
          user: {
            id: userId,
            name: address, // email
            displayName: address,
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256 algorithm
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Use built-in authenticator like Touch ID, Windows Hello
            userVerification: 'required', // Require user verification (biometrics, PIN)
            residentKey: 'required', // Ask the authenticator to store the key
          },
          timeout: 60000,
        },
      });

      if (!credential || !('rawId' in credential)) {
        throw new Error('Credential creation was cancelled or failed.');
      }
      
      // Store the credential ID (as a Base64URL string) for future authentications
      const newCredentialId = arrayBufferToBase64(credential.rawId);
      localStorage.setItem(WEBAUTHN_CREDENTIAL_KEY, newCredentialId);
      setCredentialId(newCredentialId);
      setIsRegistered(true);

      toast({ title: 'Biometrics Enabled', description: 'This device has been successfully registered.' });

    } catch (err: any) {
      console.error('WebAuthn registration failed:', err);
      // Provide user-friendly error messages
      if (err.name === 'NotAllowedError') {
        toast({ title: 'Registration Cancelled', description: 'You cancelled the biometric registration process.', variant: 'destructive' });
      } else {
        toast({ title: 'Registration Failed', description: err.message || 'An unknown error occurred.', variant: 'destructive' });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isSupported, isReady, address, isRegistered, toast]);
  
  /**
   * Unregisters the current device by removing its credential ID from storage.
   */
  const unregisterDevice = useCallback(() => {
    localStorage.removeItem(WEBAUTHN_CREDENTIAL_KEY);
    setIsRegistered(false);
    setCredentialId(null);
    toast({ title: 'Device Unregistered', description: 'Biometric key has been removed from this device.' });
  }, [toast]);

  // Note: The authentication function will be added in Phase 2.
  // For now, we only need registration.

  return {
    isSupported,
    isRegistered,
    isProcessing,
    registerDevice,
    unregisterDevice,
  };
};
