import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { ratgeberSchema } from './utils/ratgeber-schema';

const ratgeber = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/ratgeber' }),
  schema: ratgeberSchema,
});

export const collections = { ratgeber };
