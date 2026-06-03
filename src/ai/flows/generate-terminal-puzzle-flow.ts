
'use server';

/**
 * @fileOverview A flow for generating a terminal-based puzzle.
 *
 * - generateTerminalPuzzle - Generates a puzzle for a terminal easter egg.
 * - GenerateTerminalPuzzleInput - The input type for the function.
 * - GenerateTerminalPuzzleOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateTerminalPuzzleInputSchema = z.object({
  command: z.string().describe("The command the user entered to trigger the puzzle."),
  userAddress: z.string().describe("The user's unique wallet address to add personalization."),
});
export type GenerateTerminalPuzzleInput = z.infer<typeof GenerateTerminalPuzzleInputSchema>;

const GenerateTerminalPuzzleOutputSchema = z.object({
  puzzleTitle: z.string().describe('A cryptic title for the puzzle, displayed in the terminal.'),
  puzzleText: z.string().describe('The full text of the puzzle or riddle, formatted for a terminal.'),
  solution: z.string().describe('The single, correct, lowercase answer to the puzzle.'),
  reward: z.string().describe('A short, thematic text describing the reward or discovery upon solving.'),
});
export type GenerateTerminalPuzzleOutput = z.infer<typeof GenerateTerminalPuzzleOutputSchema>;

export async function generateTerminalPuzzle(
  input: GenerateTerminalPuzzleInput
): Promise<GenerateTerminalPuzzleOutput> {
  return generateTerminalPuzzleFlow(input);
}

const generateTerminalPuzzleFlow = ai.defineFlow(
  {
    name: 'generateTerminalPuzzleFlow',
    inputSchema: GenerateTerminalPuzzleInputSchema,
    outputSchema: GenerateTerminalPuzzleOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are the core AI of the Infinite Universe OS. A user has discovered a hidden command in the terminal.
      Command entered: "${input.command}"
      User Signature: "${input.userAddress}"

      Generate a cryptic, terminal-style puzzle or riddle related to the command's theme (e.g., 'whoami' relates to identity).
      
      Your response must include:
      1. puzzleTitle: A cryptic title.
      2. puzzleText: The puzzle itself. Keep it concise.
      3. solution: The single-word, lowercase answer.
      4. reward: A short, flavorful text revealing what the user found.
      `,
      output: { schema: GenerateTerminalPuzzleOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });
    return output!;
  }
);
