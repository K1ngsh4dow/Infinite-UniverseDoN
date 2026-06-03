
'use server';

import { config } from 'dotenv';
config();

import '@/ai/flows/generate-image.ts';
import '@/ai/flows/generate-music.ts';
import '@/ai/flows/generate-video.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/generate-story.ts';
import '@/ai/flows/refine-prompt.ts';
import '@/ai/flows/manage-api-key.ts';
import '@/ai/flows/generate-genesis-puzzle.ts';
import '@/ai/flows/generate-consolation-puzzle.ts';
import '@/ai/flows/generate-world.ts';
import '@/ai/flows/architect-flow.ts';
import '@/ai/flows/architect-feature-flow.ts';
import '@/ai/flows/generate-market-news.ts';
import '@/ai/flows/generate-ability-flow.ts';
import '@/ai/flows/generate-enemy-flow.ts';
import '@/ai/flows/generate-siege-wave-flow.ts';
import '@/ai/flows/generate-life-event-flow.ts';
import '@/ai/flows/bug-hunter-flow.ts';
import '@/ai/flows/forge-world-flow.ts';
import '@/ai/flows/generate-riddle-key-flow.ts';
import '@/ai/flows/generate-terminal-puzzle-flow.ts';
import '@/ai/flows/world-weaver-flow.ts';
import '@/ai/flows/donaldbein-8d-flow.ts';
import '@/ai/flows/generate-mystery-flow.ts';
import '@/ai/flows/generate-itinerary-flow.ts';
import '@/ai/tools.ts';
