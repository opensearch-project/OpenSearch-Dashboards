/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisualizationRegistry } from '../visualization_registry';
import { createLineConfig } from '../line/line_vis_config';
import { VisualizationType } from '../utils/use_visualization_types';
import { createAutoVisMeta, createTextToDashboardMeta } from './utils';

const createVisualization = (
  type: string,
  name: string,
  description?: string
): VisualizationType<any> =>
  ({
    type,
    name,
    metadata: description ? { description } : undefined,
    getRules: () => [],
    ui: {
      style: {
        defaults: {},
        render: jest.fn(),
      },
    },
  }) as unknown as VisualizationType<any>;

describe('visualization assistant action metadata', () => {
  let registry: VisualizationRegistry;

  beforeEach(() => {
    registry = new VisualizationRegistry();
    registry.registerVisualization(createLineConfig());
    registry.registerVisualization(
      createVisualization('network_graph', 'Network graph', 'Relationship flows between nodes.')
    );
    registry.registerVisualization(createVisualization('internal_debug', 'Internal debug'));
  });

  it('derives auto visualization chart guide and enum from assistant-capable registrations', () => {
    const meta = createAutoVisMeta(registry) as any;
    const potentialChartType = meta.parameters.properties.potentialChartType;

    expect(potentialChartType.enum).toEqual(['line', 'network_graph']);
    expect(potentialChartType.enum).not.toContain('internal_debug');
    expect(meta.description).toContain('"line" (Line)');
    expect(meta.description).toContain('"network_graph" (Network graph)');
    expect(meta.description).not.toContain('internal_debug');
  });

  it('derives auto visualization transformation guide from transformation definitions', () => {
    const meta = createAutoVisMeta(registry) as any;
    const definitionId =
      meta.parameters.properties.transformations.items.properties.definitionId.description;

    expect(definitionId).toContain('"limit"');
    expect(definitionId).toContain('"add_field"');
    expect(meta.description).toContain('"limit" - Keep only the first N rows of the result.');
    expect(meta.description).toContain(
      '"add_field" - Create a new field using binary or unary calculations on existing numerical fields'
    );
  });

  it('derives text-to-dashboard chart guide and enum from assistant-capable registrations', () => {
    const meta = createTextToDashboardMeta(registry) as any;
    const potentialChartType =
      meta.parameters.properties.visualizations.items.properties.potentialChartType;

    expect(potentialChartType.enum).toEqual(['line', 'network_graph']);
    expect(potentialChartType.enum).not.toContain('internal_debug');
    expect(meta.description).toContain('"line" (Line)');
    expect(meta.description).toContain('"network_graph" (Network graph)');
    expect(meta.description).not.toContain('internal_debug');
  });

  it('derives text-to-dashboard transformation guide from transformation definitions', () => {
    const meta = createTextToDashboardMeta(registry) as any;
    const definitionId =
      meta.parameters.properties.visualizations.items.properties.transformations.items.properties
        .definitionId.description;

    expect(definitionId).toContain('"limit"');
    expect(definitionId).toContain('"add_field"');
    expect(meta.description).toContain('"limit" - Keep only the first N rows of the result.');
    expect(meta.description).toContain(
      '"add_field" - Create a new field using binary or unary calculations on existing numerical fields'
    );
  });
});
