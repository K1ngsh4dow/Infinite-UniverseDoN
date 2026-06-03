
'use server';

/**
 * @fileOverview A flow for generating unique abilities for the Quantum Ascent game.
 * - generateAbilities - Generates a set of abilities based on a theme.
 * - Ability - The schema for a single ability card.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AbilitySchema = z.object({
  name: z.string().describe("A creative, thematic name for the ability (e.g., 'Singularity Strike', 'Phase Shift')."),
  type: z.enum(['Attack', 'Skill', 'Power']).describe("The type of ability. Attack deals damage, Skill provides defense or utility, Power provides a lasting effect."),
  cost: z.number().int().min(0).max(3).describe("The energy cost to play this ability, from 0 to 3."),
  description: z.string().describe("A concise, player-facing description of what the ability does. Use placeholders like '[DMG]' for damage or '[BLK]' for block. e.g., 'Deal [DMG] damage. Gain [BLK] block.'"),
  effects: z.object({
      damage: z.number().int().optional().describe("The base damage dealt. Omit if not an Attack."),
      block: z.number().int().optional().describe("The amount of block gained. Omit if it doesn't provide block."),
      draw: z.number().int().optional().describe("The number of cards to draw. Omit if it doesn't draw cards."),
  }).describe("The mechanical effects of the ability."),
  imagePrompt: z.string().describe("A detailed, visually rich prompt for an AI to generate the card's artwork, matching the ability's theme and name."),
});
export type Ability = z.infer<typeof AbilitySchema>;

const GenerateAbilitiesInputSchema = z.object({
  theme: z.string().describe("The creative theme for the abilities (e.g., 'fire', 'ice', 'void', 'cybernetic')."),
  count: z.number().int().min(1).max(5).describe("The number of unique abilities to generate."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateAbilitiesInput = z.infer<typeof GenerateAbilitiesInputSchema>;

const GenerateAbilitiesOutputSchema = z.object({
  abilities: z.array(AbilitySchema),
});
export type GenerateAbilitiesOutput = z.infer<typeof GenerateAbilitiesOutputSchema>;

export async function generateAbilities(input: GenerateAbilitiesInput): Promise<GenerateAbilitiesOutput> {
  return generateAbilitiesFlow(input);
}

const generateAbilitiesFlow = ai.defineFlow(
  {
    name: 'generateAbilitiesFlow',
    inputSchema: GenerateAbilitiesInputSchema,
    outputSchema: GenerateAbilitiesOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-2.5-pro',
      prompt: `You are a game designer creating abilities for a sci-fi roguelike deck-builder.
      Generate ${input.count} unique and balanced abilities based on the theme: "${input.theme}".

      Ensure a good mix of Attack, Skill, and Power types.
      The cost should be balanced with the ability's effects. Higher cost abilities should be more powerful.
      The description must be clear and concise for the player.
      The image prompt must be artistic and evocative.
      `,
      output: { schema: GenerateAbilitiesOutputSchema },
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
