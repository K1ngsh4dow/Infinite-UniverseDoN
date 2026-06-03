
'use server';

/**
 * @fileOverview A flow for generating a unique "Consolation Puzzle" for a user who fails to enter the correct master key.
 *
 * - generateConsolationPuzzle - Generates a puzzle based on a user's wallet address.
 * - GenerateConsolationPuzzleInput - The input type for the function.
 * - GenerateConsolationPuzzleOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { GenerateGenesisPuzzleOutputSchema, type GenerateGenesisPuzzleOutput } from './generate-genesis-puzzle';

const GenerateConsolationPuzzleInputSchema = z.object({
  userAddress: z.string().describe("The user's unique DoN wallet address."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateConsolationPuzzleInput = z.infer<typeof GenerateConsolationPuzzleInputSchema>;

export type { GenerateGenesisPuzzleOutput as GenerateConsolationPuzzleOutput };
const GenerateConsolationPuzzleOutputSchema = GenerateGenesisPuzzleOutputSchema;


export async function generateConsolationPuzzle(
  input: GenerateConsolationPuzzleInput
): Promise<GenerateConsolationPuzzleOutput> {
  return generateConsolationPuzzleFlow(input);
}

const generateConsolationPuzzleFlow = ai.defineFlow(
  {
    name: 'generateConsolationPuzzleFlow',
    inputSchema: GenerateConsolationPuzzleInputSchema,
    outputSchema: GenerateConsolationPuzzleOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-2.0-flash',
      prompt: `You are the "Enigma Weaver," a creator of cryptic puzzles for the Infinite Universe OS.
      A user has failed to provide the master key. As a consolation and a test of their worthiness, you will generate a unique "Consolation Puzzle" based on the unique signature of their digital identity (their wallet address).

      The user's address signature is: "${input.userAddress}"

      The puzzle must be thematically linked to concepts of identity, keys, access, or digital archaeology. It should be a challenging but solvable riddle or logic puzzle.

      Your response MUST include:
      1.  **puzzleTitle**: A creative, cryptic title for the puzzle.
      2.  **puzzleText**: The full text of the puzzle or riddle.
      3.  **puzzleSolution**: The single, correct answer to the puzzle. The solution should be a word or short phrase.
      4.  **nftTitle**: A unique title for the "Consolation Fragment" NFT earned upon solving.
      5.  **nftDescription**: A brief, thematic description of the NFT, hinting at a larger mystery.
      6.  **nftImagePrompt**: A separate, highly detailed, and descriptive prompt for an AI to generate the visual artwork for the NFT. This prompt should be visually rich and artistic, matching the theme.
      `,
      output: {schema: GenerateConsolationPuzzleOutputSchema},
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
