import { z } from 'zod';

/**
 * Date range filter schema
 */
export const dateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type DateRangeInput = z.infer<typeof dateRangeSchema>;

/**
 * Date range with validation
 */
export const validatedDateRangeSchema = dateRangeSchema.refine(
  (data) => {
    if (data.from && data.to) {
      return new Date(data.from) <= new Date(data.to);
    }
    return true;
  },
  {
    message: 'From date must be before or equal to To date',
  }
);

export type ValidatedDateRangeInput = z.infer<typeof validatedDateRangeSchema>;
