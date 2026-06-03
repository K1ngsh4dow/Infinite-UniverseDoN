
'use server';

/**
 * @fileOverview An 8D systems architect AI agent that generates a full application design proposal.
 *
 * - donaldbein8d - A function that generates a complete development roadmap.
 * - Donaldbein8dInput - The input type for the donaldbein8d function.
 * - Donaldbein8dOutput - The return type for the donaldbein8d function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const Donaldbein8dInputSchema = z.object({
  featureName: z.string().describe("The name of the new game or feature."),
  featureDescription: z.string().describe("A one-sentence description of the feature's core concept."),
  coreMechanics: z.string().describe("A brief description of the core mechanics or user interactions."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type Donaldbein8dInput = z.infer<typeof Donaldbein8dInputSchema>;

const RoadmapStepSchema = z.object({
    stepNumber: z.number().describe("The step number within the phase."),
    stepTitle: z.string().describe("A concise title for this implementation step."),
    stepDescription: z.string().describe("A detailed explanation of what this step entails."),
});

const RoadmapPhaseSchema = z.object({
    phaseTitle: z.string().describe("The title of this development phase (e.g., 'Phase 1: Core Gameplay Loop')."),
    phaseDescription: z.string().describe("A brief summary of the phase's goal."),
    steps: z.array(RoadmapStepSchema).describe("An array of 2-4 concrete steps for this phase."),
});

const Donaldbein8dOutputSchema = z.object({
  grandVision: z.string().describe("A paragraph describing the ultimate goal and feel of the fully-realized feature."),
  critique: z.string().describe("A critical evaluation of a hypothetical, basic version of this feature, identifying its key weaknesses."),
  roadmap: z.array(RoadmapPhaseSchema).min(3).max(4).describe("A 3-4 phase roadmap detailing the development plan."),
});
export type Donaldbein8dOutput = z.infer<typeof Donaldbein8dOutputSchema>;

export async function donaldbein8d(
  input: Donaldbein8dInput
): Promise<Donaldbein8dOutput> {
  return donaldbein8dFlow(input);
}

const donaldbein8dFlow = ai.defineFlow(
  {
    name: 'donaldbein8dFlow',
    inputSchema: Donaldbein8dInputSchema,
    outputSchema: Donaldbein8dOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-1.5-flash-latest',
      prompt: `You are the Lead Systems Architect for the Infinite Universe OS, a secure, AI-powered desktop environment. A developer has proposed a new feature and you must generate a full, end-to-end development proposal.

      The proposed feature is:
      - Name: "${input.featureName}"
      - Description: "${input.featureDescription}"
      - Core Mechanics: "${input.coreMechanics}"

      Your task is to generate a comprehensive architectural plan. You must structure your response in three distinct parts:

      1.  **Grand Vision:** Write a single, compelling paragraph describing the ultimate goal of this feature. How should it feel to the user? What core principles of the Infinite Universe does it embody (e.g., cryptographic identity, P2P interaction, AI-driven creation)?

      2.  **Critique of a Basic Prototype:** First, imagine a bare-bones, minimally-functional version of this feature has been built. Then, write a critique of this prototype. Identify its core weaknesses in terms of user experience, technical limitations, and thematic integration with the OS.

      3.  **The Roadmap:** Create a detailed, multi-phase roadmap to evolve the feature from its basic prototype to the grand vision. The roadmap must have 3-4 distinct phases. Each phase must contain 2-4 concrete, actionable implementation steps. Each step must have a title and a detailed description. Ensure the plan integrates with existing Infinite Universe concepts like the DoN Wallet, SPARK utility tokens, the Virtual Desktop, Genesis Blocks, and Secure P2P communication where appropriate.

      Your final output must be a fully-formed plan that a development team can follow to implement the feature from beginning to end.
      `,
      output: {schema: Donaldbein8dOutputSchema},
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
