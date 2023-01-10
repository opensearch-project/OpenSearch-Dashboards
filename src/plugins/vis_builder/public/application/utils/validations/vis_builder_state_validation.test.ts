/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from '../state_management';
import { validateVisBuilderState } from './vis_builder_state_validation';

describe('visBuilder state validation', () => {
  const validStyleState = {
    addLegend: true,
    addTooltip: true,
    legendPosition: '',
    type: 'metric',
  };

  const validVisualizationState: RootState['visualization'] = {
    activeVisualization: {
      name: 'metric',
      aggConfigParams: [],
    },
    indexPattern: '',
    searchField: '',
  };

  describe('correct return when validation suceeds', () => {
    test('with correct visBuilder state', () => {
      const validationResult = validateVisBuilderState({
        styleState: validStyleState,
        visualizationState: validVisualizationState,
      });
      expect(validationResult.valid).toBeTruthy();
      expect(validationResult.errorMsg).toBeUndefined();
    });
  });

  describe('correct return with errors when validation fails', () => {
    test('with non object type styleStyle', () => {
      const validationResult = validateVisBuilderState({
        styleState: [],
        visualizationState: validVisualizationState,
      });
      expect(validationResult.valid).toBeFalsy();
      expect(validationResult.errorMsg).toBeDefined();
    });
  });
});
