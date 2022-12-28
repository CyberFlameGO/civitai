import { TagTarget } from '@prisma/client';
import { z } from 'zod';
import { getAllQuerySchema } from '~/server/schema/base.schema';

export type GetTagByNameInput = z.infer<typeof getTagByNameSchema>;
export const getTagByNameSchema = z.object({
  name: z.string(),
});

type TagUpsertSchema = z.infer<typeof tagSchema>;
export const tagSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, 'Name cannot be empty.'),
  color: z.string().nullish(),
});

export const isTag = (tag: TagUpsertSchema): tag is Omit<TagUpsertSchema, 'id'> & { id: number } =>
  !!tag.id;
export const isNotTag = (
  tag: TagUpsertSchema
): tag is Omit<TagUpsertSchema, 'id'> & { id: undefined } => !tag.id;

export const getTagsInput = getAllQuerySchema.extend({
  withModels: z
    .preprocess((val) => {
      return val === 'true' || val === true;
    }, z.boolean().default(false))
    .optional(),
  entityType: z.nativeEnum(TagTarget),
});
export type GetTagsInput = z.infer<typeof getTagsInput>;
