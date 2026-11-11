/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AxisRole, VisColumn, VisFieldType } from '../types';
import { createHeatmapConfig } from '../heatmap/heatmap_vis_config';
import { VisualizationRegistry } from '../visualization_registry';
import { createSankeyConfig } from './sankey_vis_config';

describe('createSankeyConfig', () => {
  it('registers a lower-priority rule for source, target, and value fields', () => {
    const config = createSankeyConfig();
    const [rule] = config.getRules();

    expect(config).toMatchObject({
      name: 'Sankey',
      type: 'sankey',
      icon: 'graphApp',
    });
    expect(rule.priority).toBeLessThan(90);
    expect(rule.mappings).toEqual([
      {
        [AxisRole.SOURCE]: { type: VisFieldType.Categorical },
        [AxisRole.TARGET]: { type: VisFieldType.Categorical },
        [AxisRole.Value]: { type: VisFieldType.Numerical },
      },
    ]);
  });

  it('does not replace Heatmap as the automatic match for the same field counts', () => {
    const registry = new VisualizationRegistry();
    const numericalColumn: VisColumn = {
      id: 1,
      name: 'Value',
      column: 'value',
      schema: VisFieldType.Numerical,
    };
    const categoricalColumns: VisColumn[] = [
      {
        id: 2,
        name: 'Source',
        column: 'source',
        schema: VisFieldType.Categorical,
      },
      {
        id: 3,
        name: 'Target',
        column: 'target',
        schema: VisFieldType.Categorical,
      },
    ];

    registry.registerVisualization([createHeatmapConfig(), createSankeyConfig()]);

    expect(registry.findBestMatch([numericalColumn], categoricalColumns, [])?.chartType).toBe(
      'heatmap'
    );
  });

  it('maps the first two categorical fields to source and target', () => {
    const registry = new VisualizationRegistry();
    const [rule] = createSankeyConfig().getRules();
    const numericalColumn: VisColumn = {
      id: 1,
      name: 'Flow',
      column: 'flow',
      schema: VisFieldType.Numerical,
    };
    const categoricalColumns: VisColumn[] = [
      {
        id: 2,
        name: 'From',
        column: 'from',
        schema: VisFieldType.Categorical,
      },
      {
        id: 3,
        name: 'To',
        column: 'to',
        schema: VisFieldType.Categorical,
      },
    ];

    expect(registry.getAxesMappingByRule(rule, [numericalColumn], categoricalColumns, [])).toEqual({
      [AxisRole.SOURCE]: 'From',
      [AxisRole.TARGET]: 'To',
      [AxisRole.Value]: 'Flow',
    });
  });
});
