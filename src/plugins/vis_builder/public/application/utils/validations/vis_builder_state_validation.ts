/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { z } from 'zod';
import { ValidationResult } from './types';

// Zod schema equivalent to the JSON schema
const visBuilderStateSchema = z
  .object({
    styleState: z.object({}).passthrough(), // Allow any properties in styleState
    visualizationState: z
      .object({
        activeVisualization: z
          .object({
            name: z.string(),
            aggConfigParams: z.array(z.any()),
          })
          .strict()
          .optional(), // strict() prevents additional properties
        indexPattern: z.string().optional(),
        searchField: z.string(),
      })
      .strict(),
    uiState: z.object({}).passthrough().optional(), // Allow any properties in uiState
  })
  .strict();

export const validateVisBuilderState = (visBuilderState: any): ValidationResult => {
  try {
    visBuilderStateSchema.parse(visBuilderState);
    return {
      valid: true,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format error message to be similar to AJV format
      const firstError = error.errors[0];
      const path = firstError.path.length > 0 ? '/' + firstError.path.join('/') : '';
      const errorMsg = `${path} ${firstError.message}`;

      return {
        valid: false,
        errorMsg,
      };
    }

    return {
      valid: false,
      errorMsg: 'Unknown validation error',
    };
  }
};
