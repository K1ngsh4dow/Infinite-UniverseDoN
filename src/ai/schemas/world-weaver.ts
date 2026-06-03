
import { z } from 'zod';

/**
 * @fileOverview Schemas for the Atlas/WorldWeaver application.
 */

// --- Itinerary Planner Schemas ---

export const GenerateItineraryInputSchema = z.object({
  location: z.string().describe("The destination city or country."),
  duration: z.number().int().min(1).max(30).describe("The duration of the trip in days."),
  interests: z.string().describe("A comma-separated list of interests (e.g., 'history, food, hiking, art')."),
  budget: z.enum(['budget', 'moderate', 'luxury']).describe("The budget for the trip."),
  numberOfPeople: z.number().int().min(1).describe("The number of people traveling."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateItineraryInput = z.infer<typeof GenerateItineraryInputSchema>;

const ActivitySchema = z.object({
  time: z.string().describe("Suggested time for the activity (e.g., 'Morning', '9:00 AM - 11:00 AM', 'Afternoon', 'Evening')."),
  description: z.string().describe("A detailed description of the activity or place to visit."),
  estimated_cost: z.number().optional().describe("An estimated cost for the activity for the entire group, in USD. Omit if free."),
  maps_query: z.string().optional().describe("A search query for Google Maps to find this location (e.g., 'Eiffel Tower, Paris' or 'best ramen in Shibuya')."),
  image_prompt: z.string().optional().describe("A detailed, visually rich prompt for an AI image generator to create a picture of this activity/location."),
});

export const GenerateItineraryOutputSchema = z.object({
  title: z.string().describe("A creative title for the overall trip plan."),
  summary: z.string().describe("A brief, one-paragraph summary of the trip, capturing the overall experience."),
  daily_plans: z.array(z.object({
    day: z.number().describe("The day number of the itinerary (e.g., 1, 2, 3)."),
    title: z.string().describe("A catchy title for the day's theme (e.g., 'Historic Downtown & Culinary Delights')."),
    activities: z.array(ActivitySchema).min(2).max(5).describe("An array of activities planned for the day."),
  })).describe("An array of daily plans, one for each day of the trip."),
});
export type GenerateItineraryOutput = z.infer<typeof GenerateItineraryOutputSchema>;


// --- Blueprint Weaver Schemas ---

export const WorldWeaverInputSchema = z.object({
  concept: z.string().describe("The high-level concept for the new application."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type WorldWeaverInput = z.infer<typeof WorldWeaverInputSchema>;

export const WorldWeaverOutputSchema = z.object({
    name: z.string(),
    synopsis: z.string(),
    coreFeatures: z.array(z.object({ name: z.string(), description: z.string() })),
    dataModel: z.array(z.object({ fieldName: z.string(), fieldType: z.string(), description: z.string() })),
    sparkIntegration: z.string(),
    iconPrompt: z.string(),
    uiSoundscapePrompt: z.string(),
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
export type WorldWeaverOutput = z.infer<typeof WorldWeaverOutputSchema>;
