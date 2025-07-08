/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createGanttSpec } from './gantt_chart_spec';

describe('gantt_chart_spec', () => {
  it('creates a valid Vega specification', () => {
    const spec = createGanttSpec(400, 10, 1000, 100);

    // Check that the spec has the required top-level properties
    expect(spec).toHaveProperty('$schema');
    expect(spec).toHaveProperty('description');
    expect(spec).toHaveProperty('width');
    expect(spec).toHaveProperty('height');
    expect(spec).toHaveProperty('padding');
    expect(spec).toHaveProperty('data');
    expect(spec).toHaveProperty('scales');
    expect(spec).toHaveProperty('axes');
    expect(spec).toHaveProperty('marks');
  });

  it('calculates proper dimensions based on input parameters', () => {
    const height = 400;
    const dataLength = 10;
    const containerWidth = 1000;

    const spec = createGanttSpec(height, dataLength, containerWidth);

    // Check that width is calculated correctly
    const leftPadding = Math.max(60, Math.min(90, containerWidth * 0.08));
    const rightPadding = 50;
    const expectedWidth = containerWidth - leftPadding - rightPadding;
    expect(spec.width).toBe(expectedWidth);

    // Check that height is calculated correctly
    const minRowHeight = 30;
    const calculatedHeight = Math.max(height, dataLength * minRowHeight + 100);
    const expectedHeight = calculatedHeight - 60; // Account for top/bottom padding
    expect(spec.height).toBe(expectedHeight);

    // Check padding
    expect(spec.padding).toEqual({
      left: leftPadding,
      right: rightPadding,
      top: 30,
      bottom: 30,
    });
  });

  it('handles zero data length gracefully', () => {
    const spec = createGanttSpec(400, 0, 1000);

    // Should still create a valid spec with minimum height
    expect(spec.height).toBe(400 - 60); // 400 (input height) - 60 (padding)
  });

  it('handles minimum height requirements', () => {
    const dataLength = 20;
    const minRowHeight = 30;
    const minExpectedHeight = dataLength * minRowHeight + 100 - 60; // Account for padding

    // Input height is less than calculated minimum
    const spec = createGanttSpec(200, dataLength, 1000);

    // Should use the calculated minimum height
    expect(spec.height).toBe(minExpectedHeight);
  });

  it('creates proper data sources', () => {
    const spec = createGanttSpec(400, 10, 1000);

    // Check data sources
    expect(spec.data).toBeDefined();
    if (spec.data) {
      expect(spec.data.length).toBe(2);
      expect(spec.data[0].name).toBe('spans');
      expect(spec.data[1].name).toBe('error_spans');

      // Check error_spans filter
      expect((spec.data[1] as any).source).toBe('spans');

      if (spec.data[1].transform && spec.data[1].transform.length > 0) {
        expect(spec.data[1].transform.length).toBe(1);
        const transform = spec.data[1].transform[0] as any;
        expect(transform.type).toBe('filter');
        expect(transform.expr).toBe('datum.hasError');
      }
    }
  });

  it('creates proper scales', () => {
    const spec = createGanttSpec(400, 10, 1000);

    // Check scales
    expect(spec.scales).toBeDefined();
    if (spec.scales) {
      expect(spec.scales.length).toBe(2);

      // Check x scale
      const xScale = spec.scales.find((scale) => scale.name === 'xscale');
      expect(xScale).toBeDefined();
      if (xScale) {
        expect(xScale.type).toBe('linear');
        expect((xScale as any).range).toBe('width');
        expect(xScale.domain).toEqual({ data: 'spans', fields: ['startTime', 'endTime'] });
      }

      // Check y scale
      const yScale = spec.scales.find((scale) => scale.name === 'yscale');
      expect(yScale).toBeDefined();
      if (yScale) {
        expect(yScale.type).toBe('band');
        expect((yScale as any).range).toBe('height');
        expect(yScale.domain).toEqual({ data: 'spans', field: 'label' });
        expect(yScale.reverse).toBe(true);
      }
    }
  });

  it('creates proper axes', () => {
    const spec = createGanttSpec(400, 10, 1000);

    // Check axes
    expect(spec.axes).toBeDefined();
    if (spec.axes) {
      expect(spec.axes.length).toBe(2);

      // Check x axis
      const xAxis = spec.axes.find((axis) => axis.scale === 'xscale');
      expect(xAxis).toBeDefined();
      if (xAxis) {
        expect(xAxis.orient).toBe('top');
        expect(xAxis.grid).toBe(true);
      }

      // Check y axis
      const yAxis = spec.axes.find((axis) => axis.scale === 'yscale');
      expect(yAxis).toBeDefined();
      if (yAxis) {
        expect(yAxis.orient).toBe('left');
        expect(yAxis.grid).toBe(false);
        expect(yAxis.labels).toBe(false);
      }
    }
  });

  it('creates proper marks for visualization', () => {
    const spec = createGanttSpec(400, 10, 1000);

    // Check marks
    expect(spec.marks).toBeDefined();
    if (spec.marks) {
      expect(spec.marks.length).toBeGreaterThan(0);

      // Check for main span bars
      const spanBars = spec.marks.find(
        (mark) => mark.type === 'rect' && mark.from && (mark.from as any).data === 'spans'
      );
      expect(spanBars).toBeDefined();

      // Check for error indicators
      const errorIndicators = spec.marks.find(
        (mark) => mark.type === 'symbol' && mark.from && (mark.from as any).data === 'error_spans'
      );
      expect(errorIndicators).toBeDefined();

      // Check for text labels
      const textLabels = spec.marks.filter((mark) => mark.type === 'text');
      expect(textLabels.length).toBeGreaterThan(0);
    }
  });
});
