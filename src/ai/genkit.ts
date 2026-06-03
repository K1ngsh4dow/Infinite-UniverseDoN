import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {cookies} from 'next/headers';

// This is a server-side file. The `cookies()` call will work because
// Genkit flows called from server components/actions have access to the request context.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: () => {
        let userKey: string | undefined;
        try {
          // This code runs in a server-side context (Genkit flow).
          // The `cookies()` helper from Next.js gives us access to the request cookies.
          const keySource = cookies().get('X-Api-Key-Source')?.value;
          if (keySource === 'custom') {
            userKey = cookies().get('X-User-Api-Key')?.value;
          }
        } catch (error) {
          // This can happen if the flow is called in a context without cookies (e.g., build time).
          // We can safely ignore this and proceed to the fallback.
          console.log(
            'Could not access cookies, falling back to environment variable for API key.'
          );
        }
        
        // **Robust Key Resolution Strategy**
        // 1. Prioritize a valid user-provided key.
        // 2. Fallback to the system's environment variable.
        // 3. If neither exists, use an empty string which will cause a clear "Invalid API Key" error.
        return userKey || process.env.GOOGLE_API_KEY || '';
      },
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
