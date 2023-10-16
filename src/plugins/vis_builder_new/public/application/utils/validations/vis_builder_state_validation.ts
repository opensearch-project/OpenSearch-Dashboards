/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Ajv from 'ajv';
import visBuilderStateSchema from '../schema.json';
import { ValidationResult } from './types';

const ajv = new Ajv();
const validateState = ajv.compile(visBuilderStateSchema);

export const validateVisBuilderState = (visBuilderState: any): ValidationResult => {
  const isVisBuilderStateValid = validateState(visBuilderState);
  const errorMsg = validateState.errors
    ? validateState.errors[0].instancePath + ' ' + validateState.errors[0].message
    : undefined;

  return {
    valid: isVisBuilderStateValid,
    errorMsg,
  };
};
