
import { z } from 'zod';

/**
 * @fileOverview Schemas for the Alibi Archives application.
 */

export const GenerateMysteryInputSchema = z.object({
  theme: z.string().describe("A brief theme or setting for the mystery (e.g., 'a locked-room mystery on a starship', 'a poisoning at a 1920s gala')."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type GenerateMysteryInput = z.infer<typeof GenerateMysteryInputSchema>;

const CharacterSchema = z.object({
  name: z.string().describe('The full name of the character.'),
  description: z.string().describe("A brief description of the character's personality and appearance."),
  motive: z.string().optional().describe("The character's potential motive for the murder. Only the murderer's motive is the true one."),
  secret: z.string().describe("A secret the character is hiding, which may or may not be related to the murder."),
});

const ClueSchema = z.object({
    id: z.string().describe("A short identifier for the clue (e.g., 'CLUE-01')."),
    description: z.string().describe("The description of the clue as the detective would find it."),
    significance: z.string().describe("What this clue reveals or implies."),
});

const SolutionSchema = z.object({
    murderer: z.string().describe("The name of the character who is the murderer."),
    motive: z.string().describe("The true motive for the murder."),
    reasoning: z.string().describe("A step-by-step explanation of how the clues point to the murderer and their motive, solving the case."),
});

export const GenerateMysteryOutputSchema = z.object({
  caseTitle: z.string().describe('A catchy, thematic title for the case file.'),
  setting: z.string().describe('A detailed description of the setting where the murder took place.'),
  victim: z.object({
      name: z.string().describe("The victim's name."),
      description: z.string().describe("A description of the victim and how they were found."),
  }),
  characters: z.array(CharacterSchema).min(3).max(5).describe('An array of 3-5 suspects, one of whom is the murderer.'),
  clues: z.array(ClueSchema).min(4).max(6).describe('An array of 4-6 clues for the player to find and interpret.'),
  solution: SolutionSchema,
});
export type GenerateMysteryOutput = z.infer<typeof GenerateMysteryOutputSchema>;
