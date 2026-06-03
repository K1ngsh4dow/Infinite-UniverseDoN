
'use server';

/**
 * @fileOverview A "World Weaver" AI agent that generates a full 8D design document for a new application.
 *
 * - worldWeaver - A function that generates a complete 8D design.
 */

import {ai} from '@/ai/genkit';
import { donaldbein8d } from './donaldbein-8d-flow';
import { type WorldWeaverInput, WorldWeaverOutputSchema, type WorldWeaverOutput } from '@/ai/schemas/world-weaver';

export async function worldWeaver(input: WorldWeaverInput): Promise<WorldWeaverOutput> {
  const { output: initialSpec } = await ai.generate({
      model: input.model || 'googleai/gemini-1.5-flash-latest',
      prompt: `You are a 7D systems architect. Your task is to take a high-level application concept and generate the first 7 dimensions of its design blueprint: Name, Synopsis, Core Features, Data Model, SPARK Integration, Icon Prompt, and UI Soundscape Prompt.
      
      Concept: "${input.concept}"
      `,
      output: {
          schema: WorldWeaverOutputSchema.omit({ grandVision: true, critique: true, roadmap: true }),
      },
  });

  if (!initialSpec) {
      throw new Error("Failed to generate the initial 7D design specification.");
  }
  
  const roadmapSpec = await donaldbein8d({
      featureName: initialSpec.name,
      featureDescription: initialSpec.synopsis,
      coreMechanics: initialSpec.coreFeatures.map(f => f.featureDescription).join('; '),
      model: input.model,
  });

  return {
      ...initialSpec,
      ...roadmapSpec,
  };
}
