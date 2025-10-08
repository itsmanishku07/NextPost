'use server';

/**
 * @fileOverview Implements a Genkit flow to moderate comment content, flagging potentially offensive or inappropriate comments.
 *
 * - moderateCommentContent - A function that moderates comment content.
 * - ModerateCommentContentInput - The input type for the moderateCommentContent function.
 * - ModerateCommentContentOutput - The return type for the moderateCommentContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateCommentContentInputSchema = z.object({
  text: z.string().describe('The comment text to be moderated.'),
});
export type ModerateCommentContentInput = z.infer<typeof ModerateCommentContentInputSchema>;

const ModerateCommentContentOutputSchema = z.object({
  flagged: z.boolean().describe('Whether the comment is flagged as inappropriate.'),
  reason: z.string().optional().describe('The reason why the comment was flagged.'),
});
export type ModerateCommentContentOutput = z.infer<typeof ModerateCommentContentOutputSchema>;

export async function moderateCommentContent(input: ModerateCommentContentInput): Promise<ModerateCommentContentOutput> {
  return moderateCommentContentFlow(input);
}

const moderateCommentContentPrompt = ai.definePrompt({
  name: 'moderateCommentContentPrompt',
  input: {schema: ModerateCommentContentInputSchema},
  output: {schema: ModerateCommentContentOutputSchema},
  prompt: `You are a content moderation expert. Your task is to determine if the given comment text is offensive, inappropriate, or violates community guidelines.

  Comment Text: {{{text}}}

  Based on the comment text, determine if it should be flagged.  If it should, explain your reasoning in the reason field.
  Return a JSON object with 'flagged' set to true if the comment is inappropriate, and false otherwise. If flagged is true, provide a 'reason'.`,
});

const moderateCommentContentFlow = ai.defineFlow(
  {
    name: 'moderateCommentContentFlow',
    inputSchema: ModerateCommentContentInputSchema,
    outputSchema: ModerateCommentContentOutputSchema,
  },
  async input => {
    const {output} = await moderateCommentContentPrompt(input);
    return output!;
  }
);
