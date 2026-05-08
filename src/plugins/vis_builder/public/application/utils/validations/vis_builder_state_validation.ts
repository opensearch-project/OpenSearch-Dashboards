/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { ValidationResult } from './types';

const visBuilderStateSchema = z
  .object({
    styleState: z.object({}).passthrough(),
    visualizationState: z
      .object({
        activeVisualization: z
          .object({
            name: z.string(),
            aggConfigParams: z.array(z.any()),
          })
          .strict()
          .optional(),
        indexPattern: z.string().optional(),
        searchField: z.string(),
      })
      .strict(),
    uiState: z.object({}).passthrough().optional(),
  })
  .strict();

export const validateVisBuilderState = (visBuilderState: any): ValidationResult => {
  const result = visBuilderStateSchema.safeParse(visBuilderState);

  if (result.success) {
    return { valid: true };
  }

  // Format error message as "/{path} {message}"
  const firstError = result.error.issues[0];
  const path = firstError.path.length > 0 ? '/' + firstError.path.join('/') : '';
  const errorMsg = path + ' ' + firstError.message;

  return {
    valid: false,
    errorMsg,
  };
};
