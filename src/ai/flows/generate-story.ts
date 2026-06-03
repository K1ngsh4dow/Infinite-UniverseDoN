
'use server';

/**
 * @fileOverview A flow for generating a short story with a title and an image prompt.
 *
 * - generateStory - A function that handles the story generation process.
 * - GenerateStoryInput - The input type for the generateStory function.
 * - GenerateStoryOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateStoryInputSchema = z.object({
  prompt: z.string().describe('The user prompt for the story.'),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateStoryInput = z.infer<typeof GenerateStoryInputSchema>;

const GenerateStoryOutputSchema = z.object({
  title: z.string().describe('A short, catchy title for the story.'),
  story: z.string().describe('The generated short story.'),
  imagePrompt: z.string().describe('A detailed prompt for an image that illustrates the story.'),
});
export type GenerateStoryOutput = z.infer<typeof GenerateStoryOutputSchema>;

export async function generateStory(input: GenerateStoryInput): Promise<GenerateStoryOutput> {
  return generateStoryFlow(input);
}

const generateStoryFlow = ai.defineFlow(
  {
    name: 'generateStoryFlow',
    inputSchema: GenerateStoryInputSchema,
    outputSchema: GenerateStoryOutputSchema,
  },
  async input => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-1.5-flash-latest',
      prompt: `You are a creative storyteller. Based on the user's prompt, create a short, engaging story for a general audience.
  
      Your response must include three things:
      1.  A short, catchy title for the story.
      2.  The full text of the story.
      3.  A separate, highly detailed, and descriptive prompt that can be used to generate a beautiful illustration for the story. This image prompt should capture the essence of a key moment or theme in the story.
    
      User prompt: ${input.prompt}
      `,
      output: { schema: GenerateStoryOutputSchema },
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
