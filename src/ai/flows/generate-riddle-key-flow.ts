
'use server';

/**
 * @fileOverview A flow for generating a riddle whose answer serves as a password.
 *
 * - generateRiddleKey - Generates a riddle and a secret answer.
 * - GenerateRiddleKeyInput - The input type for the function.
 * - GenerateRiddleKeyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateRiddleKeyInputSchema = z.object({
  topic: z.string().describe("The topic or theme for the riddle (e.g., 'a secret', 'a key', 'a cat')."),
});
export type GenerateRiddleKeyInput = z.infer<typeof GenerateRiddleKeyInputSchema>;

const GenerateRiddleKeyOutputSchema = z.object({
  riddle: z.string().describe("The generated riddle text."),
  answer: z.string().describe("The single-word, lowercase answer to the riddle. This will be used as the encryption key."),
});
export type GenerateRiddleKeyOutput = z.infer<typeof GenerateRiddleKeyOutputSchema>;

export async function generateRiddleKey(input: GenerateRiddleKeyInput): Promise<GenerateRiddleKeyOutput> {
  return generateRiddleKeyFlow(input);
}

const generateRiddleKeyFlow = ai.defineFlow(
  {
    name: 'generateRiddleKeyFlow',
    inputSchema: GenerateRiddleKeyInputSchema,
    outputSchema: GenerateRiddleKeyOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are a master riddle-smith. Create a challenging but fair riddle based on the following topic: "${input.topic}".
      The answer to the riddle must be a single, common, lowercase word.
      Your response MUST include the riddle and the one-word answer.`,
      output: { schema: GenerateRiddleKeyOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });
    return output!;
  }
);
