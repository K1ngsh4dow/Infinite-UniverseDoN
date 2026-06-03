
'use server';

/**
 * @fileOverview AI song concept generation flow.
 *
 * - generateMusic - A function that handles the song concept generation process.
 * - GenerateMusicInput - The input type for the generateMusic function.
 * - GenerateMusicOutput - The return type for the generateMusic function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { generateImage } from './generate-image';
import { textToSpeech } from './text-to-speech';

const GenerateMusicInputSchema = z.object({
  prompt: z.string().describe('A theme or idea for a song.'),
  encoder: z.enum(['stable', 'experimental']).optional().describe('The WAV encoder to use for narration.'),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateMusicInput = z.infer<typeof GenerateMusicInputSchema>;

const SongConceptSchema = z.object({
    title: z.string().describe('A creative, catchy title for the song.'),
    lyrics: z.string().describe('The full lyrics of the song, including verses and chorus.'),
    imagePrompt: z.string().describe('A detailed, visually rich prompt for generating an album cover that captures the song\'s essence.'),
});

const GenerateMusicOutputSchema = z.object({
  title: z.string(),
  lyrics: z.string(),
  imageUrl: z.string().describe('The URL for the generated album cover image.'),
  audioDataUri: z.string().describe('The data URI for the spoken-word audio of the lyrics.'),
});
export type GenerateMusicOutput = z.infer<typeof GenerateMusicOutputSchema>;


export async function generateMusic(
  input: GenerateMusicInput
): Promise<GenerateMusicOutput> {
  return generateMusicFlow(input);
}


const generateMusicFlow = ai.defineFlow(
  {
    name: 'generateMusicFlow',
    inputSchema: GenerateMusicInputSchema,
    outputSchema: GenerateMusicOutputSchema,
  },
  async (input) => {
    // 1. Generate the song concept (title, lyrics, image prompt)
    const { output: songConcept } = await ai.generate({
        model: input.model || 'googleai/gemini-2.0-flash',
        prompt: `You are a creative songwriter and artist. Based on the user's prompt, create a song concept.

        Your response must include three things:
        1. A creative and catchy title for the song.
        2. The full lyrics for the song, including verse and chorus structure.
        3. A separate, highly detailed, and descriptive prompt for an AI to generate a beautiful and fitting album cover.
    
        User's song idea: ${input.prompt}
        `,
        output: { schema: SongConceptSchema },
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
    if (!songConcept) {
        throw new Error("Failed to generate song concept.");
    }
    
    // 2. Generate the album art and spoken-word audio in parallel
    const [imageResult, audioResult] = await Promise.all([
        generateImage({ prompt: songConcept.imagePrompt }),
        textToSpeech({ 
            text: `Song Title: ${songConcept.title}. \n\n ${songConcept.lyrics}`,
            encoder: input.encoder,
        })
    ]);

    // 3. Return the complete package
    return {
        title: songConcept.title,
        lyrics: songConcept.lyrics,
        imageUrl: imageResult.imageUrl,
        audioDataUri: audioResult.audioDataUri,
    };
  }
);
