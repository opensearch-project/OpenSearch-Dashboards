/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Ajv from 'ajv';
import visBuilderStateSchema from './schema.json';

const ajv = new Ajv();
const validateState = ajv.compile(visBuilderStateSchema);

export const validateVisBuilderState = (visBuilderState) => {
  const isVisBuilderStateValid = validateState(visBuilderState);

  return {
    valid: isVisBuilderStateValid,
    errors: validateState.errors,
  };
};
