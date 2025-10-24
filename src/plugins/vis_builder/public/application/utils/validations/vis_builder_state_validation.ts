/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ValidationResult } from './types';

export const validateVisBuilderState = (visBuilderState: any): ValidationResult => {
  return {
    valid: true,
    errorMsg: undefined,
  };
};
