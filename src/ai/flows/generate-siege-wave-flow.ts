
'use server';

/**
 * @fileOverview A flow for generating enemy waves for the Quantum Siege game.
 * - generateSiegeWave - Generates a wave of enemies.
 * - EnemyUnit - The schema for a single enemy unit in a wave.
 * - GenerateSiegeWaveInput - The input type for the function.
 * - GenerateSiegeWaveOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnemyUnitSchema = z.object({
  name: z.string().describe("A thematic name for this enemy type (e.g., 'Quantum Scuttler', 'Void Brute')."),
  health: z.number().int().min(5).max(500).describe("The health of a single enemy of this type."),
  speed: z.number().min(0.5).max(3.0).describe("The movement speed of the enemy (e.g., 1.0 is normal speed)."),
  count: z.number().int().min(1).max(20).describe("How many enemies of this type will be in this group."),
  special: z.enum(['none', 'shielded', 'fast']).optional().describe("A special characteristic for this enemy group."),
});
export type EnemyUnit = z.infer<typeof EnemyUnitSchema>;

const GenerateSiegeWaveInputSchema = z.object({
  waveNumber: z.number().int().min(1).describe("The current wave number, used to scale difficulty."),
  playerHealth: z.number().int().describe("The player's current core health."),
  playerResources: z.number().int().describe("The player's current resources (Constructs)."),
});
export type GenerateSiegeWaveInput = z.infer<typeof GenerateSiegeWaveInputSchema>;

const GenerateSiegeWaveOutputSchema = z.object({
    wave: z.array(EnemyUnitSchema).min(1).max(3).describe("An array of 1 to 3 enemy groups that comprise this wave."),
    waveName: z.string().optional().describe("A cool, thematic name for this specific wave (e.g., 'The Scuttler Swarm', 'Void Brute Assault')."),
});
export type GenerateSiegeWaveOutput = z.infer<typeof GenerateSiegeWaveOutputSchema>;


export async function generateSiegeWave(input: GenerateSiegeWaveInput): Promise<GenerateSiegeWaveOutput> {
  return generateSiegeWaveFlow(input);
}


const generateSiegeWaveFlow = ai.defineFlow(
  {
    name: 'generateSiegeWaveFlow',
    inputSchema: GenerateSiegeWaveInputSchema,
    outputSchema: GenerateSiegeWaveOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are the Siege Master for a tower defense game called Quantum Siege.
      Your task is to design the next enemy wave based on the player's current state.
      
      Player State:
      - Wave Number: ${input.waveNumber}
      - Core Health: ${input.playerHealth}
      - Constructs (Resources): ${input.playerResources}

      Generate a challenging but fair wave. The difficulty should increase with the wave number.
      - Early waves (1-5) should be simple.
      - Mid waves (6-15) can introduce more enemies or enemies with special abilities.
      - Late waves (16+) should be very difficult.

      Create 1 to 3 groups of enemies for this wave.
      Give the overall wave a cool, thematic name.
      `,
      output: { schema: GenerateSiegeWaveOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH', },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE', },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE', },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE', },
        ],
      },
    });
    return output!;
  }
);
