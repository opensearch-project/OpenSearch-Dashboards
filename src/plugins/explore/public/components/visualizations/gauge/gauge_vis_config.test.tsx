/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createGaugeConfig, defaultGaugeChartStyles } from './gauge_vis_config';
import { GaugeVisStyleControls } from './gauge_vis_options';
import { GaugeChartRender } from './gauge_component';
import { VisFieldType } from '../types';

// Mock the React.createElement function
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  createElement: jest.fn(),
}));

describe('createGaugeConfig', () => {
  it('should create a gauge visualization type configuration', () => {
    const config = createGaugeConfig();

    // Verify the basic structure
    expect(config).toHaveProperty('name', 'Gauge');
    expect(config).toHaveProperty('type', 'gauge');
    expect(config).toHaveProperty('ui.style.defaults');
    expect(config).toHaveProperty('ui.style.render');
  });

  it('should have the correct default style settings', () => {
    const config = createGaugeConfig();
    const defaults = config.ui.style.defaults;
    // Verify basic controls
    expect(defaults.showTitle).toBe(true);
    expect(defaults.title).toBe('');
    expect(defaults.thresholdOptions).toMatchObject({
      baseColor: '#00BD6B',
      thresholds: [],
    });
    expect(defaults.valueCalculation).toBe('last');
  });

  it('should render the GaugeVisStyleControls component with the provided props', () => {
    const config = createGaugeConfig();
    const renderFunction = config.ui.style.render;
    // Mock props
    const mockProps = {
      styleOptions: defaultGaugeChartStyles,
      onStyleChange: jest.fn(),
      numericalColumns: [],
      categoricalColumns: [],
      dateColumns: [],
      axisColumnMappings: {},
      updateVisualization: jest.fn(),
    };
    // Call the render function
    renderFunction(mockProps);
    // Verify that React.createElement was called with the correct arguments
    expect(React.createElement).toHaveBeenCalledWith(GaugeVisStyleControls, mockProps);
  });

  it('passes render context series name to GaugeChartRender', () => {
    const config = createGaugeConfig();
    const renderFunction = config.getRules()[0].render;
    const valueColumn = {
      id: 1,
      name: 'COUNT()',
      schema: VisFieldType.Numerical,
      column: 'count',
    };

    const renderedGauge = renderFunction({
      data: [{ count: 519, extension: 'jpg' }],
      allData: [{ count: 519, extension: 'jpg' }],
      styleOptions: config.ui.style.defaults,
      axisColumnMappings: { value: [valueColumn] },
      renderContext: { seriesName: 'jpg' },
    }) as React.ReactElement;

    expect(renderedGauge.type).toBe(GaugeChartRender);
    expect(renderedGauge.props.seriesName).toBe('jpg');
  });
});
