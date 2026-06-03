
'use server';
/**
 * @fileOverview A flow for refining a user's prompt for better generation results.
 *
 * - refinePrompt - A function that handles the prompt refinement process.
 * - RefinePromptInput - The input type for the refinePrompt function.
 * - RefinePromptOutput - The return type for the refinePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefinePromptInputSchema = z.object({
  prompt: z.string().describe('The user prompt to refine.'),
  assetType: z.enum(['image', 'story', 'speech', 'music', 'video']).describe('The target type of media to be generated.'),
  model: z.string().optional().describe('The generative model to use.'),
});
export type RefinePromptInput = z.infer<typeof RefinePromptInputSchema>;

const RefinePromptOutputSchema = z.object({
  suggestedPrompt: z.string().describe('The improved, more detailed prompt.'),
});
export type RefinePromptOutput = z.infer<typeof RefinePromptOutputSchema>;

export async function refinePrompt(input: RefinePromptInput): Promise<RefinePromptOutput> {
  return refinePromptFlow(input);
}

const refinePromptFlow = ai.defineFlow(
  {
    name: 'refinePromptFlow',
    inputSchema: RefinePromptInputSchema,
    outputSchema: RefinePromptOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-2.0-flash',
      prompt: `You are an expert prompt engineer for generative AI. Your task is to take a user's prompt and an asset type, and rewrite the prompt to be more descriptive, creative, and effective for generating the best possible result.

      Focus on adding details about style, composition, lighting, and mood appropriate for the asset type.

      User Prompt: ${input.prompt}
      Asset Type: ${input.assetType}
      `,
      output: { schema: RefinePromptOutputSchema },
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
