
'use server';

/**
 * @fileOverview A flow for generating a complete murder mystery case file.
 *
 * - generateMystery - Generates a full mystery with characters, clues, and a solution.
 */

import { ai } from '@/ai/genkit';
import { GenerateMysteryInputSchema, GenerateMysteryOutputSchema, type GenerateMysteryInput, type GenerateMysteryOutput } from '@/ai/schemas/alibi-archives';


export async function generateMystery(input: GenerateMysteryInput): Promise<GenerateMysteryOutput> {
  return generateMysteryFlow(input);
}

const generateMysteryFlow = ai.defineFlow(
  {
    name: 'generateMysteryFlow',
    inputSchema: GenerateMysteryInputSchema,
    outputSchema: GenerateMysteryOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: input.model || 'gemini-1.5-pro-latest',
      prompt: `You are a master mystery writer. Based on the user's theme, create a complete, self-contained murder mystery case file.

      Theme: "${input.theme}"

      Your response MUST include:
      1.  **caseTitle**: A creative title for the mystery.
      2.  **setting**: A vivid description of the location.
      3.  **victim**: Details about the person who was murdered.
      4.  **characters**: A cast of 3-5 unique suspects. ONE of these must be the murderer. Each character has a description, a secret, and a potential motive.
      5.  **clues**: A set of 4-6 clues. The clues must logically lead to the correct murderer when pieced together.
      6.  **solution**: The definitive answer, identifying the murderer, their true motive, and a clear explanation of how the clues prove their guilt.

      Ensure the mystery is solvable but not obvious. The secrets of non-murderer characters should act as red herrings.
      `,
      output: { schema: GenerateMysteryOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
      },
    });
    return output!;
  }
);
