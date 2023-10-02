/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { countBy } from 'lodash';
import { Schemas } from '../../../../../vis_default_editor/public';
import { VisualizationState } from '../state_management';
import { ValidationResult } from './types';

/**
 * Validate if the visualization state fits the  vis type schema criteria
 * @param schemas Visualization type config Schema objects
 * @param state visualization state
 * @returns ValidationResult
 */
export const validateSchemaState = (
  schemas: Schemas,
  state: VisualizationState
): ValidationResult => {
  const activeViz = state.activeVisualization;
  const vizName = activeViz?.name;
  const aggs = activeViz?.aggConfigParams;

  // Check if each schema's min agg requirement is met
  const aggSchemaCount = countBy(aggs, (agg) => agg.schema);
  const invalidsSchemas = schemas.all.filter((schema) => {
    if (!schema.min) return false;
    if (!aggSchemaCount[schema.name] || aggSchemaCount[schema.name] < schema.min) return true;

    return false;
  });

  if (invalidsSchemas.length > 0) {
    return {
      valid: false,
      errorMsg: `The ${vizName} visualization needs at least ${invalidsSchemas[0].min} field(s) in the agg type "${invalidsSchemas[0].name}"`,
    };
  }

  return { valid: true };
};
