/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Schemas } from '../../../../../vis_default_editor/public';
import { VisualizationState } from '../state_management';
import { validateSchemaState } from './validate_schema_state';

describe('validateSchemaState', () => {
  const schemas = new Schemas([
    {
      name: 'metrics',
      group: 'metrics',
      min: 1,
    },
    {
      name: 'buckets',
      group: 'buckets',
    },
  ]);

  test('should error if schema min agg requirement not met', () => {
    const visState: VisualizationState = {
      searchField: '',
      activeVisualization: {
        name: 'Test vis',
        aggConfigParams: [],
      },
    };

    const { valid, errorMsg } = validateSchemaState(schemas, visState);

    expect(valid).toBe(false);
    expect(errorMsg).toMatchInlineSnapshot(
      `"The Test vis visualization needs at least 1 field(s) in the agg type \\"metrics\\""`
    );
  });

  test('should be valid if schema requirements are met', () => {
    const visState: VisualizationState = {
      searchField: '',
      activeVisualization: {
        name: 'Test vis',
        aggConfigParams: [
          {
            type: 'count',
            schema: 'metrics',
          },
        ],
      },
    };

    const { valid, errorMsg } = validateSchemaState(schemas, visState);

    expect(valid).toBe(true);
    expect(errorMsg).not.toBeDefined();
  });
});
