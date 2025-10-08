import { config } from 'dotenv';
config();

import '@/ai/flows/moderate-text-post-content.ts';
import '@/ai/flows/moderate-comment-content.ts';