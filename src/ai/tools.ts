
'use server';
/**
 * @fileoverview This file defines the centralized list of tools available to the AI System Agent.
 * Using `ai.defineTool` provides a structured and type-safe way for the AI to interact with
 * various applications and functionalities within the Infinite Universe OS.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { generateMystery, GenerateMysteryInputSchema } from './flows/generate-mystery-flow';
import { generateItinerary, GenerateItineraryInputSchema } from './flows/generate-itinerary-flow';
import { worldWeaver, WorldWeaverInputSchema } from './flows/world-weaver-flow';

const openApp = ai.defineTool(
  {
    name: 'openApp',
    description: 'Opens a system application on the user\'s virtual desktop.',
    inputSchema: z.object({
      appName: z.enum([
        'vault', 'desktop', 'creations', 'settings', 'copilots',
        'terraformer', 'exchange',
        // Removed alibi-archives, etc. to avoid ambiguity. They have their own tools.
      ]).describe('The name of the OS app to open.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => `Opening the ${input.appName} application.`
);

const alibiArchivesTool = ai.defineTool(
  {
    name: 'alibiArchives',
    description: 'Generates a complete murder mystery case file, including characters, clues, and a solution, based on a user-provided theme.',
    inputSchema: GenerateMysteryInputSchema,
    outputSchema: z.any(),
  },
  async (input) => generateMystery(input)
);

const itineraryPlannerTool = ai.defineTool(
  {
    name: 'itineraryPlanner',
    description: 'Creates a detailed, day-by-day travel itinerary based on a specified destination, duration, interests, and budget.',
    inputSchema: GenerateItineraryInputSchema,
    outputSchema: z.any(),
  },
  async (input) => generateItinerary(input)
);

const worldWeaverTool = ai.defineTool(
  {
    name: 'worldWeaver',
    description: 'Designs a comprehensive, multi-dimensional blueprint for a brand-new application based on a high-level user concept.',
    inputSchema: WorldWeaverInputSchema,
    outputSchema: z.any(),
  },
  async (input) => worldWeaver(input)
);


// The comprehensive list of all tools the AI can use.
export const tools = [
  openApp,
  alibiArchivesTool,
  itineraryPlannerTool,
  worldWeaverTool,
];
