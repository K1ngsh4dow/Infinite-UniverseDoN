
'use server';

/**
 * @fileOverview A 6D systems architect AI agent that generates a full application design proposal.
 *
 * - donaldbein6d - A function that generates a complete 6D design document for a narrative game.
 * - Donaldbein6dInput - The input type for the donaldbein6d function.
 * - Donaldbein6dOutput - The return type for the donaldbein6d function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Input Schema ---
const Donaldbein6dInputSchema = z.object({
  gameConcept: z.string().describe("A one-sentence description of the game's core idea."),
  gameGenre: z.string().describe("The genre of the game (e.g., 'sci-fi horror', 'cyberpunk mystery')."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type Donaldbein6dInput = z.infer<typeof Donaldbein6dInputSchema>;


// --- Output Schema ---
const DataFieldSchema = z.object({
    fieldName: z.string().describe("The name of the data field (e.g., 'playerHealth', 'inventoryItem')."),
    fieldType: z.string().describe("The data type of the field (e.g., 'string', 'number', 'boolean', 'array')."),
    fieldDescription: z.string().describe("A brief description of what this field represents."),
});

const CoreFeatureSchema = z.object({
    featureName: z.string().describe("A concise name for the core game mechanic or feature."),
    featureDescription: z.string().describe("A detailed description of the mechanic's functionality and how the player interacts with it."),
});

const Donaldbein6dOutputSchema = z.object({
  finalGameTitle: z.string().describe("A creative, final title for the game."),
  gameSynopsis: z.string().describe("A short, compelling paragraph describing the game's story, setting, and core emotional experience."),
  coreMechanics: z.array(CoreFeatureSchema).min(3).max(5).describe("A list of 3-5 core game mechanics that define the primary gameplay loop."),
  dataModel: z.array(DataFieldSchema).min(3).max(8).describe("A simplified data model for tracking player state and game progress."),
  sparkIntegration: z.string().describe("A creative explanation of how SPARK utility tokens could be integrated for in-game actions, rewards, or progression."),
  iconPrompt: z.string().describe('A single, highly detailed and artistic prompt for an AI image generator to create a visually striking icon or logo for the game.'),
});
export type Donaldbein6dOutput = z.infer<typeof Donaldbein6dOutputSchema>;


export async function donaldbein6d(
  input: Donaldbein6dInput
): Promise<Donaldbein6dOutput> {
  return donaldbein6dFlow(input);
}

const donaldbein6dFlow = ai.defineFlow(
  {
    name: 'donaldbein6dFlow',
    inputSchema: Donaldbein6dInputSchema,
    outputSchema: Donaldbein6dOutputSchema,
  },
  async (input) => {
    const {output: spec} = await ai.generate({
      model: input.model || 'googleai/gemini-2.5-pro',
      prompt: `You are a Lead Narrative Game Designer for the Infinite Universe OS. You design innovative, story-driven games.
      A developer has proposed a new game concept. You must generate a complete 6D Game Design Document (GDD).

      The proposed game is:
      - Concept: "${input.gameConcept}"
      - Genre: "${input.gameGenre}"

      Your task is to generate a comprehensive GDD with the following structure:

      1.  **Final Game Title:** A polished, creative, and memorable name.
      2.  **Game Synopsis:** A compelling paragraph explaining the game's story, setting, and value proposition.
      3.  **Core Mechanics:** A list of 3-5 essential gameplay mechanics. Describe each one.
      4.  **Data Model:** Define a simple data model with 3-8 key fields for player and game state.
      5.  **SPARK Integration:** Describe a creative and integral use for SPARK utility tokens within the game.
      6.  **Icon Prompt:** A single, detailed, and artistic prompt for an AI to generate a beautiful icon or logo for the game.
      `,
      output: {schema: Donaldbein6dOutputSchema},
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH', },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE', },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE', },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE', },
        ],
      },
    });

    if (!spec) {
        throw new Error("Failed to generate the initial 6D design specification.");
    }
    
    return spec;
  }
);
