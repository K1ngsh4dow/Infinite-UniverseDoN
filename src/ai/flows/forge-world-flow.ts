
'use server';

/**
 * @fileOverview A flow for forging a new personal universe, combining world generation with a genesis puzzle.
 *
 * - forgeWorld - Generates the world lore and a corresponding puzzle to mint its Genesis Block.
 * - ForgeWorldInput - The input type for the function.
 * - ForgeWorldOutput - The return type for the function.
 */

import { generateWorld, GenerateWorldOutput } from './generate-world';
import { generateGenesisPuzzle, GenerateGenesisPuzzleOutput } from './generate-genesis-puzzle';
import { z } from 'zod';

export type ForgeWorldInput = z.infer<typeof GenerateWorldInputSchema>;
const GenerateWorldInputSchema = z.object({
  prompt: z.string().describe("The user's high-level concept for the new world."),
});

export type ForgeWorldOutput = GenerateWorldOutput & GenerateGenesisPuzzleOutput;

export async function forgeWorld(
  input: ForgeWorldInput
): Promise<ForgeWorldOutput> {
  // 1. Generate the world's foundational blueprint
  const worldData = await generateWorld(input);

  // 2. Generate a puzzle thematically linked to the new world
  const puzzleData = await generateGenesisPuzzle({
    copilotName: worldData.worldName,
    copilotDescription: worldData.worldDescription,
  });

  // 3. Combine the results into a single package
  return {
    ...worldData,
    ...puzzleData,
  };
}
