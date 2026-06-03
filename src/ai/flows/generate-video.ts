
'use server';

/**
 * @fileOverview AI video concept generation flow.
 *
 * - generateVideoConcept - A function that creates a full video concept.
 * - GenerateVideoConceptInput - The input type for the generateVideoConcept function.
 * - GenerateVideoConceptOutput - The return type for the generateVideoConcept function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateVideoConceptInputSchema = z.object({
  prompt: z.string().describe('The text prompt describing the video concept.'),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateVideoConceptInput = z.infer<typeof GenerateVideoConceptInputSchema>;

const GenerateVideoConceptOutputSchema = z.object({
  title: z.string().describe('A short, cinematic title for the video.'),
  storyboardPrompts: z
    .array(z.string().describe('A detailed image prompt for a single frame of the video storyboard.'))
    .length(4)
    .describe('An array of exactly 4 detailed image prompts representing the key scenes of the video.'),
  narrationScript: z.string().describe('A script for a voiceover narrator that describes the scenes.'),
});
export type GenerateVideoConceptOutput = z.infer<typeof GenerateVideoConceptOutputSchema>;

export async function generateVideoConcept(
  input: GenerateVideoConceptInput
): Promise<GenerateVideoConceptOutput> {
  return generateVideoConceptFlow(input);
}

const generateVideoConceptFlow = ai.defineFlow(
  {
    name: 'generateVideoConceptFlow',
    inputSchema: GenerateVideoConceptInputSchema,
    outputSchema: GenerateVideoConceptOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
        model: input.model || 'googleai/gemini-2.0-flash',
        prompt: `You are a creative film director. A user wants to create a short video concept. Based on their prompt, create a full package for them.

        Your response must include:
        1.  A short, cinematic title for the video.
        2.  A storyboard with exactly 4 keyframes. For each keyframe, provide a highly detailed, descriptive, and visually rich prompt suitable for an AI image generator. The prompts should describe a continuous sequence of action if possible.
        3.  A short narration script that a voiceover artist could read. The script should align with the 4 keyframes you've created.

        User's video idea: ${input.prompt}
        `,
        output: { schema: GenerateVideoConceptOutputSchema },
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
