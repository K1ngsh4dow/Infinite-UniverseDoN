
'use server';

/**
 * @fileOverview The master architect flow for the Infinite Universe OS.
 * This flow interprets a user's design request and routes it to the appropriate
 * sub-architect to generate a design document of a specific "dimension" (level of detail).
 *
 * - architect - The main function to handle all architectural design requests.
 * - ArchitectInput - The input type for the architect function.
 * - ArchitectOutput - The return type for the architect function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// --- Input Schema ---
const ArchitectInputSchema = z.object({
  request: z.string().describe("The user's full request for application or feature design."),
  dimension: z.number().min(1).max(8).describe("A number from 1 to 8 representing the requested level of detail for the architectural plan, as defined in the master AI blueprint."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type ArchitectInput = z.infer<typeof ArchitectInputSchema>;

// --- Schemas for Each Dimension ---
const ArchitectOutputSchema1D = z.object({ dimension: z.literal(1), name: z.string() });
const ArchitectOutputSchema2D = ArchitectOutputSchema1D.extend({ synopsis: z.string() });
const ArchitectOutputSchema3D = ArchitectOutputSchema2D.extend({ coreFeatures: z.array(z.object({ name: z.string(), description: z.string() })) });
const ArchitectOutputSchema4D = ArchitectOutputSchema3D.extend({ dataModel: z.array(z.object({ fieldName: z.string(), fieldType: z.string(), description: z.string() })) });
const ArchitectOutputSchema5D = ArchitectOutputSchema4D.extend({ sparkIntegration: z.string() });
const ArchitectOutputSchema6D = ArchitectOutputSchema5D.extend({ iconPrompt: z.string() });
const ArchitectOutputSchema7D = ArchitectOutputSchema6D.extend({ uiSoundscapePrompt: z.string() });
const ArchitectOutputSchema8D = ArchitectOutputSchema7D.extend({
    grandVision: z.string(),
    critique: z.string(),
    roadmap: z.array(z.object({
        phaseTitle: z.string(),
        phaseDescription: z.string(),
        steps: z.array(z.object({
            stepNumber: z.number(),
            stepTitle: z.string(),
            stepDescription: z.string(),
        })),
    })),
});

// --- Final Union Output Schema ---
const ArchitectOutputSchema = z.union([
    ArchitectOutputSchema1D,
    ArchitectOutputSchema2D,
    ArchitectOutputSchema3D,
    ArchitectOutputSchema4D,
    ArchitectOutputSchema5D,
    ArchitectOutputSchema6D,
    ArchitectOutputSchema7D,
    ArchitectOutputSchema8D,
]);
export type ArchitectOutput = z.infer<typeof ArchitectOutputSchema>;


// --- Main Exported Function ---
export async function architect(
  input: ArchitectInput
): Promise<ArchitectOutput> {
  return architectFlow(input);
}


// --- The Flow ---
const architectFlow = ai.defineFlow(
  {
    name: 'architectFlow',
    inputSchema: ArchitectInputSchema,
    outputSchema: ArchitectOutputSchema,
  },
  async (input) => {

    const { dimension, request } = input;

    let outputSchema: z.ZodTypeAny = ArchitectOutputSchema1D;
    if (dimension === 2) outputSchema = ArchitectOutputSchema2D;
    if (dimension === 3) outputSchema = ArchitectOutputSchema3D;
    if (dimension === 4) outputSchema = ArchitectOutputSchema4D;
    if (dimension === 5) outputSchema = ArchitectOutputSchema5D;
    if (dimension === 6) outputSchema = ArchitectOutputSchema6D;
    if (dimension === 7) outputSchema = ArchitectOutputSchema7D;
    if (dimension === 8) outputSchema = ArchitectOutputSchema8D;

    // The AI's prompt includes the master blueprint, which defines the dimensions.
    // This prompt asks the AI to act as the requested dimensional architect.
    const { output } = await ai.generate({
      model: input.model || 'googleai/gemini-1.5-flash-latest',
      prompt: `You are DonaldBein${dimension}D, a ${dimension}-dimensional systems architect.
      A user has a request: "${request}".
      Your task is to generate a design document that strictly adheres to the schema for a ${dimension}D plan.
      Refer to the master AI Blueprint for the definitions of each dimension.
      Provide ONLY the required fields for the specified dimension.
      `,
      output: { schema: outputSchema },
       config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH', },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE', },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE', },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_LOW_AND_ABOVE', },
        ],
      },
    });

    if (!output) {
      throw new Error(`Failed to generate a ${dimension}D architectural plan.`);
    }

    return output;
  }
);
