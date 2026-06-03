
'use server';
/**
 * @fileOverview A flow for managing API keys.
 *
 * - generateApiKey - A function that handles generating a new API key.
 * - saveApiSettings - A server action to save the user's API key preferences.
 * - GenerateApiKeyOutput - The return type for the generateApiKey function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import * as crypto from 'crypto';
import { cookies } from 'next/headers';

// No input is needed for this flow.
const GenerateApiKeyOutputSchema = z.object({
  newApiKey: z.string().describe('The newly generated API key.'),
});
export type GenerateApiKeyOutput = z.infer<typeof GenerateApiKeyOutputSchema>;

export async function generateApiKey(): Promise<GenerateApiKeyOutput> {
  return generateApiKeyFlow();
}

const generateApiKeyFlow = ai.defineFlow(
  {
    name: 'generateApiKeyFlow',
    // No input schema needed.
    outputSchema: GenerateApiKeyOutputSchema,
  },
  async () => {
    // This is a placeholder for a real key generation process.
    // In a real app, this would involve creating and storing credentials securely.
    const newKey = `gsk_dev_${crypto.randomBytes(24).toString('hex')}`;
    return { newApiKey: newKey };
  }
);


export async function saveApiSettings(source: string, key: string) {
  const oneYear = 60 * 60 * 24 * 365;
  const cookieOptions = {
    name: 'X-User-Api-Key',
    value: key,
    maxAge: oneYear,
    path: '/',
    sameSite: 'lax' as const,
  };

  const sourceCookieOptions = {
    name: 'X-Api-Key-Source',
    value: source,
    maxAge: oneYear,
    path: '/',
    sameSite: 'lax' as const,
  };

  if (source === 'custom' && key) {
    cookies().set(cookieOptions);
    cookies().set(sourceCookieOptions);
  } else {
    // Clear the key cookie if switching to default or key is empty
    cookies().delete('X-User-Api-Key');
    cookies().set({ ...sourceCookieOptions, value: 'default' });
  }
}
