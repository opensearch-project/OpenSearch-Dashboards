/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Panel } from '../builders/panel';
import { Query } from '../builders/query';
import { VisualizationType } from '../types';

describe('Panel Builder', () => {
  const allVisualizationTypes: VisualizationType[] = [
    'line',
    'bar',
    'pie',
    'heatmap',
    'table',
    'metric',
    'markdown',
    'area',
    'gauge',
  ];

  it.each(allVisualizationTypes)(
    'should create a panel with visualization type "%s"',
    (vizType) => {
      const panel = Panel.create('test-panel').visualization(vizType).build();
      expect(panel.visualization).toBe(vizType);
    }
  );

  it('should set grid position', () => {
    const panel = Panel.create('test')
      .visualization('line')
      .gridPosition({ x: 5, y: 10, w: 20, h: 15 })
      .build();

    expect(panel.gridPosition).toEqual({ x: 5, y: 10, w: 20, h: 15 });
  });

  it('should set query', () => {
    const panel = Panel.create('test')
      .visualization('bar')
      .query(Query.ppl('source = logs | stats count() by status'))
      .build();

    expect(panel.query).toEqual({
      language: 'PPL',
      query: 'source = logs | stats count() by status',
    });
  });

  it('should set multiple options', () => {
    const panel = Panel.create('test')
      .visualization('line')
      .option('showLegend', true)
      .option('showGridLines', false)
      .option('lineWidth', 2)
      .option('colorScheme', 'warm')
      .build();

    expect(panel.options).toEqual({
      showLegend: true,
      showGridLines: false,
      lineWidth: 2,
      colorScheme: 'warm',
    });
  });

  it('should have default values', () => {
    const panel = Panel.create('minimal').build();

    expect(panel.name).toBe('minimal');
    expect(panel.type).toBe('visualization');
    expect(panel.visualization).toBe('line');
    expect(panel.gridPosition).toEqual({ x: 0, y: 0, w: 12, h: 8 });
    expect(panel.query).toBeUndefined();
    expect(panel.options).toEqual({});
  });

  it('should produce independent copies on build', () => {
    const builder = Panel.create('test')
      .visualization('bar')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 });

    const panel1 = builder.build();
    const panel2 = builder.build();

    panel1.gridPosition.x = 99;
    expect(panel2.gridPosition.x).toBe(0);
  });

  it('should support chaining all methods', () => {
    const panel = Panel.create('chained')
      .visualization('heatmap')
      .gridPosition({ x: 0, y: 0, w: 12, h: 12 })
      .query(Query.sql('SELECT * FROM logs'))
      .option('intensity', 'high')
      .build();

    expect(panel.name).toBe('chained');
    expect(panel.visualization).toBe('heatmap');
    expect(panel.query?.language).toBe('SQL');
    expect(panel.options.intensity).toBe('high');
  });
});
