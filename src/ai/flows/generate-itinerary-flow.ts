
'use server';

/**
 * @fileOverview A flow for generating a detailed travel itinerary.
 *
 * - generateItinerary - Generates a travel plan based on user preferences.
 */

import { ai } from '@/ai/genkit';
import { GenerateItineraryInputSchema, GenerateItineraryOutputSchema, type GenerateItineraryInput, type GenerateItineraryOutput } from '@/ai/schemas/world-weaver';

export async function generateItinerary(input: GenerateItineraryInput): Promise<GenerateItineraryOutput> {
  return generateItineraryFlow(input);
}

const generateItineraryFlow = ai.defineFlow(
  {
    name: 'generateItineraryFlow',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: GenerateItineraryOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: input.model || 'googleai/gemini-1.5-flash-latest',
      prompt: `You are a world-class travel agent AI. Create a detailed, day-by-day itinerary for a trip based on the user's specifications.

      **Destination:** ${input.location}
      **Duration:** ${input.duration} days
      **Interests:** ${input.interests}
      **Budget:** ${input.budget}
      **Number of People:** ${input.numberOfPeople}

      Your task is to generate a comprehensive travel plan. Ensure the plan is logical, grouping activities by location where possible. Provide practical and inspiring suggestions.

      For each activity, you MUST provide:
      - A suggested time.
      - A detailed description.
      - An estimated cost in USD for the entire group. If an activity is free, omit this field.
      - A simple, effective Google Maps search query.
      - A detailed, artistic image prompt for an AI to generate a photo of the location or activity.

      Your response MUST be a single, valid JSON object that adheres strictly to the defined output schema.
      `,
      output: { schema: GenerateItineraryOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      },
    });
    return output!;
  }
);
