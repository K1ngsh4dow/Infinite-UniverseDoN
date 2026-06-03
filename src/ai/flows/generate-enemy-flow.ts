
'use server';

/**
 * @fileOverview A flow for generating unique enemies for the Quantum Ascent game.
 * - generateEnemy - Generates an enemy with a move set and visual concept.
 * - Enemy - The schema for a single enemy.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnemyMoveSchema = z.object({
    name: z.string().describe("The name of the move (e.g., 'Laser Barrage', 'Reinforce Plating')."),
    type: z.enum(['Attack', 'Defend', 'Debuff']).describe("The type of move."),
    value: z.number().int().describe("The numerical value of the move (e.g., damage amount, block amount)."),
    description: z.string().describe("A short description of the move's effect."),
});
export type EnemyMove = z.infer<typeof EnemyMoveSchema>;


const EnemySchema = z.object({
  name: z.string().describe("A creative, thematic name for the enemy."),
  maxHealth: z.number().int().min(10).max(200).describe("The maximum health of the enemy."),
  imagePrompt: z.string().describe("A detailed, visually rich prompt for an AI to generate the enemy's portrait."),
  moveSet: z.array(EnemyMoveSchema).min(2).max(4).describe("A set of 2-4 unique moves the enemy can perform."),
});
export type Enemy = z.infer<typeof EnemySchema>;

const GenerateEnemyInputSchema = z.object({
  theme: z.string().describe("The creative theme for the enemy (e.g., 'crystal entities', 'scrap-metal robots', 'eldritch horrors')."),
  difficulty: z.enum(['easy', 'medium', 'hard']).describe("The difficulty of the enemy, which should influence its health and move power."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateEnemyInput = z.infer<typeof GenerateEnemyInputSchema>;

export async function generateEnemy(input: GenerateEnemyInput): Promise<Enemy> {
  return generateEnemyFlow(input);
}

const generateEnemyFlow = ai.defineFlow(
  {
    name: 'generateEnemyFlow',
    inputSchema: GenerateEnemyInputSchema,
    outputSchema: EnemySchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-2.5-pro',
      prompt: `You are a game designer creating an enemy for a sci-fi roguelike deck-builder.
      Generate a single, unique enemy based on the theme: "${input.theme}" and difficulty: "${input.difficulty}".

      - Health and move power should scale with difficulty.
      - The moveset should be thematic and interesting.
      - The image prompt should be artistic and detailed.
      `,
      output: { schema: EnemySchema },
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
