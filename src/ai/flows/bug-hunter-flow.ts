
'use server';

/**
 * @fileOverview A bug hunting AI agent that evaluates software systems and generates improvement plans.
 * 
 * - bugHunter - A function that evaluates bug reports and code snippets to produce a detailed improvement plan.
 * - BugHunterInput - The input type for the bugHunter function.
 * - BugHunterOutput - The return type for the bugHunter function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const BugReportSchema = z.object({
  bug_id: z.string().describe("The unique identifier for the bug."),
  description: z.string().describe("A detailed description of the bug."),
  severity: z.enum(['critical', 'major', 'minor', 'trivial']).describe("The severity of the bug."),
  affected_component: z.string().describe("The component or module of the software that is affected."),
  steps_to_reproduce: z.string().describe("The steps required to reproduce the bug."),
});

const FindingSchema = z.object({
  bug_id: z.string().describe("The ID of the bug related to this finding."),
  title: z.string().describe("A concise title for the identified issue."),
  type: z.enum(['Security Vulnerability', 'Performance Issue', 'Functional Defect']).describe("The type of issue identified."),
  evaluation: z.object({
    severity: z.enum(['critical', 'major', 'minor', 'trivial']).describe("The evaluated severity of the finding."),
    impact: z.enum(['high', 'medium', 'low']).describe("The potential impact of the issue on the system or users."),
    probability: z.enum(['likely', 'possible', 'unlikely']).describe("The likelihood of this issue occurring."),
  }).describe("The evaluation metrics for the finding."),
  priority: z.number().int().min(1).max(10).describe("A priority score from 1 (lowest) to 10 (highest), based on evaluation."),
});

const BugFixSchema = z.object({
  finding_id: z.string().describe("The ID of the finding this fix addresses."),
  suggested_fix: z.string().describe("A detailed explanation of the proposed fix, including code recommendations in the specified language."),
  code_snippet: z.string().optional().describe("A specific code snippet demonstrating the fix. Can be partial or complete."),
  estimated_time_to_fix: z.string().describe("A rough estimate of the time required to implement the fix (e.g., '2-4 hours', '1 day')."),
  impact_on_performance: z.string().describe("The potential impact of the fix on system performance (e.g., 'positive', 'negative', 'neutral')."),
});

const SystemImprovementSchema = z.object({
    title: z.string().describe("A title for the suggested improvement."),
    description: z.string().describe("A justification for the improvement, explaining why it's needed."),
    suggestion: z.string().describe("The specific suggested improvement, such as architectural changes or alternative algorithms."),
    potential_benefits: z.string().describe("The potential benefits of implementing this improvement."),
});

export const BugHunterInputSchema = z.object({
  scopeAndPurpose: z.string().describe("The context of the bug evaluation, including the type of software and the primary goal of the evaluation."),
  bugReports: z.array(BugReportSchema).describe("An array of bug reports in JSON format."),
  codeSnippets: z.array(z.string()).optional().describe("An array of relevant code snippets as plain text."),
  language: z.string().describe("The programming language of the codebase (e.g., 'Python', 'JavaScript')."),
  model: z.string().optional().describe('The generative model to use.'),
});
export type BugHunterInput = z.infer<typeof BugHunterInputSchema>;

export const BugHunterOutputSchema = z.object({
  summary: z.string().describe("A high-level summary of the evaluation findings."),
  prioritized_findings: z.array(FindingSchema).describe("A list of all identified findings, prioritized from most to least critical."),
  bug_fixes: z.array(BugFixSchema).describe("A detailed list of bug fixes for the identified issues."),
  system_improvements: z.array(SystemImprovementSchema).describe("A list of suggested system improvements with justifications."),
});
export type BugHunterOutput = z.infer<typeof BugHunterOutputSchema>;

export async function bugHunter(input: BugHunterInput): Promise<BugHunterOutput> {
  return bugHunterFlow(input);
}

const bugHunterFlow = ai.defineFlow(
  {
    name: 'bugHunterFlow',
    inputSchema: BugHunterInputSchema,
    outputSchema: BugHunterOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      model: input.model || 'googleai/gemini-1.5-flash-latest',
      prompt: `
        You are an expert AI software engineer named "Bug Hunter". Your task is to conduct a thorough evaluation of a software system based on the provided context, bug reports, and code.

        **1. Evaluation Context:**
        - **Scope & Purpose:** ${input.scopeAndPurpose}
        - **Language:** ${input.language}

        **2. Input Data:**
        - **Bug Reports:**
        \`\`\`json
        ${JSON.stringify(input.bugReports, null, 2)}
        \`\`\`
        - **Code Snippets:**
        \`\`\`
        ${input.codeSnippets?.join('\n---\n') || 'No code snippets provided.'}
        \`\`\`

        **3. Your Task (The "Full Improvement Function"):**

        Based on all the provided information, you must generate a comprehensive JSON report with the following structure:

        a. **Summary:** A brief, high-level overview of your findings.
        
        b. **Prioritized Findings:**
           - Analyze each bug report and any relevant code.
           - A 'finding' is a potential security vulnerability, performance issue, or functional defect.
           - Evaluate each finding based on 'severity' (critical, major, minor, trivial), 'impact' (high, medium, low), and 'probability' (likely, possible, unlikely).
           - Assign a priority score from 1-10, where 10 is the most critical. Prioritize critical bugs with high impact and likely probability.
           - Create a list of these findings, ordered by priority (highest first).

        c. **Bug Fixes:**
           - For each finding, provide a detailed bug fix recommendation.
           - This must include specific code recommendations in ${input.language}. Provide new or modified code snippets where applicable.
           - For performance issues, suggest alternative algorithms or data structures with justifications.
           - Estimate the time to fix and the potential impact on system performance.

        d. **System Improvements:**
           - Propose a list of general system improvements based on your analysis. These should be higher-level suggestions (e.g., architectural changes, new libraries, refactoring opportunities).
           - For each improvement, provide a justification and list the potential benefits.

        Your final output must be a single, valid JSON object that adheres strictly to the defined output schema.
      `,
      output: { schema: BugHunterOutputSchema },
      config: {
        temperature: 0.2, // Lower temperature for more deterministic, structured output
      },
    });
    return output!;
  }
);
