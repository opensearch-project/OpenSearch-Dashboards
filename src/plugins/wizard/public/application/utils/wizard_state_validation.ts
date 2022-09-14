/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Ajv from 'ajv';

export const wizardStateValidation = (wizardState) => {
  const ajv = new Ajv();
  const vizTypeEnum = ['metric', 'line', 'area', 'histogram'];

  const wizardStateSchema = {
    type: 'object',
    properties: {
      styleState: {
        type: 'object',
        properties: {
          addLegend: { type: 'boolean' },
          addTooltip: { type: 'boolean' },
          legendPosition: { type: 'string' },
          type: { enum: vizTypeEnum },
        },
        required: ['addLegend', 'addTooltip', 'type'],
      },
      visualizationState: {
        type: 'object',
        properties: {
          activeVisualization: {
            type: 'object',
            properties: {
              name: { enum: vizTypeEnum },
              aggConfigParams: { type: 'array' },
            },
            required: ['name', 'aggConfigParams'],
            additionalProperties: false,
          },
          indexPattern: { type: 'string' },
          searchField: { type: 'string' },
        },
        required: ['activeVisualization', 'searchField', 'indexPattern'],
        additionalProperties: false,
      },
    },
    required: ['styleState', 'visualizationState'],
    additionalProperties: false,
  };

  const isWizardStateValid = ajv.validate(wizardStateSchema, wizardState);

  if (!isWizardStateValid) {
    return ajv.errors;
  }
};
