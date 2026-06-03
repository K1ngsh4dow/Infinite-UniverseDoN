
'use server';
/**
 * @fileOverview A flow for generating life events for an Echo in Echoes of Infinity.
 *
 * - generateLifeEvent - Generates a new event based on an Echo's personality.
 * - GenerateLifeEventInput - The input type for the function.
 * - GenerateLifeEventOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateLifeEventInputSchema = z.object({
  personality: z.string().describe("A short description of the Echo's core personality."),
  needs: z.object({
      energy: z.number(),
      hunger: z.number(),
      social: z.number(),
      fun: z.number(),
  }).describe("The Echo's current needs, from 0 to 100."),
});
export type GenerateLifeEventInput = z.infer<typeof GenerateLifeEventInputSchema>;


const NeedEffectSchema = z.object({
    need: z.enum(['energy', 'hunger', 'social', 'fun']),
    change: z.number().int().describe("The amount to change the need by (can be positive or negative).")
});

const GenerateLifeEventOutputSchema = z.object({
  eventTitle: z.string().describe("A short, catchy title for the life event."),
  eventDescription: z.string().describe("A one-sentence description of what is happening to the Echo."),
  effects: z.array(NeedEffectSchema).describe("An array of effects this event has on the Echo's needs."),
});
export type GenerateLifeEventOutput = z.infer<typeof GenerateLifeEventOutputSchema>;

export async function generateLifeEvent(input: GenerateLifeEventInput): Promise<GenerateLifeEventOutput> {
  return generateLifeEventFlow(input);
}

const generateLifeEventFlow = ai.defineFlow(
  {
    name: 'generateLifeEventFlow',
    inputSchema: GenerateLifeEventInputSchema,
    outputSchema: GenerateLifeEventOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: `You are the "Life Weaver," an AI that generates narrative events for a life simulation game.
      
      An AI being called an "Echo" has the following personality: "${input.personality}"

      Its current needs are (0-100):
      - Energy: ${input.needs.energy}
      - Hunger: ${input.needs.hunger}
      - Social: ${input.needs.social}
      - Fun: ${input.needs.fun}

      Generate a single, interesting, and plausible life event for this Echo. The event should be inspired by its personality and current needs.
      - If a need is low, the event might relate to fulfilling it.
      - If a need is high, the event might be a consequence of it.

      Your response MUST include:
      1.  **eventTitle**: A short title for the event.
      2.  **eventDescription**: A one-sentence description of what's happening.
      3.  **effects**: An array of one or two needs that are affected by this event, and the amount they change by. The change should be a small integer value, e.g., between -20 and 20.
      `,
      output: { schema: GenerateLifeEventOutputSchema },
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
