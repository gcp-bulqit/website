import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Blog posts: one Markdown file per post in src/content/writing. The file name is the URL slug.
const writing = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    // The Projects entry this post writes up, by its exact title; that entry's title links here.
    project: z.string().optional(),
    // Drafts build locally but are left out of the list and the production build.
    draft: z.boolean().default(false),
  }),
});

export const collections = { writing };
