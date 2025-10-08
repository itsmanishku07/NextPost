'use server';

/**
 * @fileOverview A text post content moderation AI agent.
 *
 * - moderateTextPostContent - A function that handles the text post content moderation process.
 * - ModerateTextPostContentInput - The input type for the moderateTextPostContent function.
 * - ModerateTextPostContentOutput - The return type for the moderateTextPostContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateTextPostContentInputSchema = z.object({
  text: z.string().describe('The text content of the post to be moderated.'),
});
export type ModerateTextPostContentInput = z.infer<typeof ModerateTextPostContentInputSchema>;

const ModerateTextPostContentOutputSchema = z.object({
  isFlagged: z.boolean().describe('Whether the content is flagged as potentially offensive or inappropriate.'),
  reason: z.string().describe('The reason for flagging the content, if applicable.'),
});
export type ModerateTextPostContentOutput = z.infer<typeof ModerateTextPostContentOutputSchema>;

export async function moderateTextPostContent(input: ModerateTextPostContentInput): Promise<ModerateTextPostContentOutput> {
  return moderateTextPostContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateTextPostContentPrompt',
  input: {schema: ModerateTextPostContentInputSchema},
  output: {schema: ModerateTextPostContentOutputSchema},
  prompt: `You are a content moderation expert responsible for identifying potentially offensive or inappropriate content in text posts.

  Given the following text post content, determine if it should be flagged based on whether it violates community guidelines regarding offensive, hateful, or harmful content.

  Text Post Content: {{{text}}}

  Respond with whether the content should be flagged and the reason for flagging it. Focus on clear policy violations, hate speech, abusive language, or promotion of harmful activities.
`,
});

const moderateTextPostContentFlow = ai.defineFlow(
  {
    name: 'moderateTextPostContentFlow',
    inputSchema: ModerateTextPostContentInputSchema,
    outputSchema: ModerateTextPostContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
