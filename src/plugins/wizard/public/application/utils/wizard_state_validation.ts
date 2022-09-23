/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Ajv from 'ajv';
import wizardStateSchema from './schema.json';

const ajv = new Ajv();
const validateState = ajv.compile(wizardStateSchema);

export const validateWizardState = (wizardState) => {
  const isWizardStateValid = validateState(wizardState);

  return {
    valid: isWizardStateValid,
    errors: validateState.errors,
  };
};
