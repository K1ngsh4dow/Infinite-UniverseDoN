
'use server';

/**
 * @fileOverview A flow for generating fictional market news for the Aetherium Exchange.
 *
 * - generateMarketNews - Generates a news event affecting a company.
 * - MarketNewsInput - The input type for the function.
 * - MarketNewsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CompanyInfoSchema = z.object({
  ticker: z.string().describe("The stock ticker symbol for the company."),
  name: z.string().describe("The full name of the company."),
});

const MarketNewsInputSchema = z.object({
  companies: z.array(CompanyInfoSchema).describe("A list of companies currently on the market."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type MarketNewsInput = z.infer<typeof MarketNewsInputSchema>;

const MarketNewsOutputSchema = z.object({
  headline: z.string().describe('A short, impactful news headline (max 10 words).'),
  summary: z.string().describe('A one-sentence summary explaining the news.'),
  affected_ticker: z.string().describe('The ticker symbol of the single company most affected by this news.'),
  effect: z.enum(['positive', 'negative', 'neutral']).describe('The overall effect of the news on the company stock price.'),
});
export type MarketNewsOutput = z.infer<typeof MarketNewsOutputSchema>;


export async function generateMarketNews(input: MarketNewsInput): Promise<MarketNewsOutput> {
  return generateMarketNewsFlow(input);
}


const generateMarketNewsFlow = ai.defineFlow(
  {
    name: 'generateMarketNewsFlow',
    inputSchema: MarketNewsInputSchema,
    outputSchema: MarketNewsOutputSchema,
  },
  async (input) => {
    const {output} = await ai.generate({
      model: input.model || 'googleai/gemini-2.0-flash',
      prompt: `You are the "Market Weaver," an AI that generates news for a fictional stock market in a futuristic universe.
      
      Here are the companies currently trading on the Aetherium Exchange:
      ${input.companies.map(c => `- ${c.name} (${c.ticker})`).join('\n')}

      Your task is to generate a single, plausible news event that would affect ONE of these companies. The event should be concise and sound like a real financial news alert.

      Your response MUST include:
      1.  **headline**: A short, impactful headline.
      2.  **summary**: A one-sentence summary of the event.
      3.  **affected_ticker**: The ticker symbol of the ONE company most impacted.
      4.  **effect**: The impact on the stock price ('positive', 'negative', 'neutral').
      `,
      output: { schema: MarketNewsOutputSchema },
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
