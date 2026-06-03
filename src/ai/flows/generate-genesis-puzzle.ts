
'use server';

/**
 * @fileOverview A flow for generating a complete "Genesis Puzzle" package for a new AI Copilot.
 *
 * - generateGenesisPuzzle - Generates a puzzle, solution, and NFT concept.
 * - GenerateGenesisPuzzleInput - The input type for the function.
 * - GenerateGenesisPuzzleOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateGenesisPuzzleInputSchema = z.object({
  copilotName: z.string().describe("The name of the new AI Copilot."),
  copilotDescription: z.string().describe("The description of what the new AI Copilot does."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateGenesisPuzzleInput = z.infer<typeof GenerateGenesisPuzzleInputSchema>;

export const GenerateGenesisPuzzleOutputSchema = z.object({
  puzzleTitle: z.string().describe('A creative, intriguing title for the puzzle.'),
  puzzleText: z.string().describe('The full text of the puzzle or riddle.'),
  puzzleSolution: z.string().describe('The correct answer to the puzzle.'),
  nftTitle: z.string().describe('A unique and cool title for the NFT that is minted upon solving the puzzle.'),
  nftDescription: z.string().describe('A brief, thematic description of the minted NFT, tying into the puzzle.'),
  nftImagePrompt: z.string().describe('A separate, highly detailed, and descriptive prompt for an AI to generate the visual artwork for the NFT.'),
});
export type GenerateGenesisPuzzleOutput = z.infer<typeof GenerateGenesisPuzzleOutputSchema>;

export async function generateGenesisPuzzle(
  input: GenerateGenesisPuzzleInput
): Promise<GenerateGenesisPuzzleOutput> {
  return generateGenesisPuzzleFlow(input);
}

const generateGenesisPuzzleFlow = ai.defineFlow(
  {
    name: 'generateGenesisPuzzleFlow',
    inputSchema: GenerateGenesisPuzzleInputSchema,
    outputSchema: GenerateGenesisPuzzleOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-2.0-flash',
      prompt: `You are a master puzzle and riddle creator for a futuristic, secure OS called Infinite Universe.
      A user has just created a new AI Copilot agent. To celebrate its "birth", you will generate a unique "Genesis Puzzle".
      Solving this puzzle allows the user to mint the very first tokenized asset for this new AI agent's universe, the "Genesis NFT".

      The puzzle should be thematically related to the Copilot's purpose.

      Copilot Name: "${input.copilotName}"
      Copilot Description: "${input.copilotDescription}"

      Your response MUST include:
      1.  **puzzleTitle**: A creative, intriguing title for the puzzle, inspired by the Copilot.
      2.  **puzzleText**: The full text of the logic puzzle or riddle. It should be challenging but fair.
      3.  **puzzleSolution**: The single, correct answer to the puzzle. The solution should be a word or short phrase.
      4.  **nftTitle**: A unique and cool title for the Genesis NFT, related to the Copilot's theme.
      5.  **nftDescription**: A brief, thematic description of the minted NFT, connecting it to the puzzle and the Copilot's birth.
      6.  **nftImagePrompt**: A separate, highly detailed, and descriptive prompt for an AI to generate the visual artwork for the NFT. This prompt should be visually rich and artistic.
      `,
      output: {schema: GenerateGenesisPuzzleOutputSchema},
      config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_LOW_AND_ABOVE',
          },
        ],
      },
    });
    return output!;
  }
);
