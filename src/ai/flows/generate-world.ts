
'use server';

/**
 * @fileOverview A flow for generating a new personal universe.
 *
 * - generateWorld - Generates the lore, materials, and minting info for a new world.
 * - GenerateWorldInput - The input type for the function.
 * - GenerateWorldOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWorldInputSchema = z.object({
  prompt: z.string().describe("The user's high-level concept for the new world."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateWorldInput = z.infer<typeof GenerateWorldInputSchema>;

const MaterialSchema = z.object({
    materialName: z.string().describe("A unique, thematic name for a block or material in this world."),
    materialDescription: z.string().describe("A brief description of the material's appearance and properties."),
    textureImagePrompt: z.string().describe("A detailed, visually rich prompt for an AI to generate the material's texture for a 3D game."),
});

const GenerateWorldOutputSchema = z.object({
  worldName: z.string().describe('A creative, evocative name for the new world.'),
  worldDescription: z.string().describe('A brief, thematic description of the world, its history, or its main characteristics.'),
  keyPhrase: z.string().describe("A short, memorable key phrase or password from the world's lore (e.g., a motto, a secret word). This will be used to encrypt the Genesis Block."),
  materials: z.array(MaterialSchema).min(5).max(10).describe('An array of 5-10 unique materials that form the building blocks of this world.'),
  genesisBlockImagePrompt: z.string().describe("A separate, detailed and artistic prompt to generate the visual artwork for the world's 'Genesis Block NFT', which represents the core essence of this new universe."),
});
export type GenerateWorldOutput = z.infer<typeof GenerateWorldOutputSchema>;

export async function generateWorld(
  input: GenerateWorldInput
): Promise<GenerateWorldOutput> {
  return generateWorldFlow(input);
}

const generateWorldFlow = ai.defineFlow(
  {
    name: 'generateWorldFlow',
    inputSchema: GenerateWorldInputSchema,
    outputSchema: GenerateWorldOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-2.5-pro',
      prompt: `You are the Genesis Terraformer, an AI that weaves new universes from a user's prompt. Your task is to generate the foundational blueprint for a new personal universe within the Infinite Universe OS.

      The user's concept is: "${input.prompt}"

      Based on this concept, you must generate a complete package. Your response MUST include:
      1.  **worldName**: A creative, evocative name for this new world.
      2.  **worldDescription**: A brief, thematic description of the world, its history, or its main characteristics. This should be a few sentences long.
      3.  **keyPhrase**: A short, memorable password-like phrase (3-5 words) derived from the world's lore. This is secret and important, used to "unlock" its core.
      4.  **materials**: An array of 5-10 unique materials (blocks, items, etc.) that are the building blocks of this world. For each material, provide:
          -   **materialName**: e.g., "Crystalflex Shard", "Sunken-City Brick", "Glow-spore Pod".
          -   **materialDescription**: A brief description of the material.
          -   **textureImagePrompt**: A detailed prompt for an AI to generate a seamless 2D texture for this material.
      5.  **genesisBlockImagePrompt**: A separate, highly detailed, and artistic prompt to generate a beautiful image of the world's "Genesis Block" as an NFT. This should be an epic, visually stunning representation of the world's core concept.
      `,
      output: {schema: GenerateWorldOutputSchema},
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
