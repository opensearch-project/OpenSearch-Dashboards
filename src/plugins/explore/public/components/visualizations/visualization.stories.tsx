/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Visualization } from './visualization';
import { Positions } from './utils/collections';
import { LineVisStyleControls } from './line/line_vis_options';
import { VisualizationType, VisualizationTypeResult } from './utils/use_visualization_types';
import { ThresholdLineStyle, VisFieldType } from './types';
import { LineChartStyleControls } from './line/line_vis_config';
import { IExpressionLoaderParams } from '../../../../expressions/public';

export default {
  title: 'src/plugins/explore/public/components/visualizations/visualization',
  component: Visualization,
} as ComponentMeta<typeof Visualization>;

// Mock ReactExpressionRenderer component
const MockReactExpressionRenderer: React.FC<any> = ({ expression }) => {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#fff',
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h3>Visualization Preview</h3>
        <div
          style={{
            marginTop: '20px',
            padding: '20px',
            backgroundColor: '#f5f7fa',
            borderRadius: '4px',
          }}
        >
          <svg width="300" height="200" viewBox="0 0 300 200">
            {/* Mock line chart */}
            <line x1="50" y1="150" x2="250" y2="50" stroke="#0079a5" strokeWidth="2" />
            <circle cx="50" cy="150" r="4" fill="#0079a5" />
            <circle cx="100" cy="120" r="4" fill="#0079a5" />
            <circle cx="150" cy="100" r="4" fill="#0079a5" />
            <circle cx="200" cy="80" r="4" fill="#0079a5" />
            <circle cx="250" cy="50" r="4" fill="#0079a5" />
            {/* Axes */}
            <line x1="50" y1="150" x2="250" y2="150" stroke="#69707D" strokeWidth="1" />
            <line x1="50" y1="150" x2="50" y2="50" stroke="#69707D" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const mockStyleOptions: LineChartStyleControls = {
  // Basic controls
  addTooltip: true,
  addLegend: true,
  legendPosition: Positions.RIGHT,
  addTimeMarker: false,
  showLine: true,
  lineMode: 'smooth',
  lineWidth: 2,
  showDots: true,
  // Threshold and grid
  thresholdLine: {
    color: '#E7664C',
    show: false,
    style: ThresholdLineStyle.Full,
    value: 10,
    width: 1,
  },
  grid: {
    categoryLines: true,
    valueLines: true,
  },
  // Axes
  categoryAxes: [
    {
      id: 'CategoryAxis-1',
      type: 'category' as const,
      position: Positions.BOTTOM,
      show: true,
      labels: {
        show: true,
        filter: true,
        rotate: 0,
        truncate: 100,
      },
      title: { text: 'Time' },
    },
  ],
  valueAxes: [
    {
      id: 'ValueAxis-1',
      name: 'LeftAxis-1',
      type: 'value' as const,
      position: Positions.LEFT,
      show: true,
      labels: {
        show: true,
        rotate: 0,
        filter: false,
        truncate: 100,
      },
      title: { text: 'Sales' },
    },
  ],
};

// Mock the line configuration to avoid importing toExpression
const mockLineConfig: VisualizationType = {
  name: 'line',
  type: 'line',
  ui: {
    style: {
      defaults: mockStyleOptions,
      render: (props: any) => {
        return <LineVisStyleControls {...props} />;
      },
    },
  },
};

// Create mock data
const mockVisualizationData: VisualizationTypeResult = {
  visualizationType: mockLineConfig,
  transformedData: [
    { date: '2024-01-01', value: 100, category: 'A' },
    { date: '2024-01-02', value: 150, category: 'A' },
    { date: '2024-01-03', value: 120, category: 'B' },
    { date: '2024-01-04', value: 180, category: 'B' },
  ],
  numericalColumns: [
    { id: 1, column: 'value', name: 'Sales Value', schema: VisFieldType.Numerical },
  ],
  categoricalColumns: [
    { id: 2, column: 'category', name: 'Product Category', schema: VisFieldType.Categorical },
  ],
  dateColumns: [
    { id: 3, column: VisFieldType.Date, name: VisFieldType.Date, schema: VisFieldType.Categorical },
  ],
};

const mockSearchContext: IExpressionLoaderParams['searchContext'] = {
  query: { query: 'stats(sum(value)) by category', language: 'SQL' },
  filters: [],
  timeRange: { from: 'now-7d', to: 'now' },
};

const Template: ComponentStory<typeof Visualization> = (args) => <Visualization {...args} />;

export const Default = Template.bind({});
Default.args = {
  expression: 'opensearchDashboards | opensearch_dashboards_context | vega spec="{...}"',
  searchContext: mockSearchContext,
  styleOptions: mockStyleOptions,
  visualizationData: mockVisualizationData,
  onStyleChange: () => {},
  ReactExpressionRenderer: MockReactExpressionRenderer,
};

export const WithThresholdLine = Template.bind({});
WithThresholdLine.args = {
  ...Default.args,
  styleOptions: {
    ...mockStyleOptions,
    thresholdLine: {
      ...mockStyleOptions.thresholdLine,
      show: true,
      value: 150,
      color: '#FF0000',
    },
  },
};

export const HiddenLineShowDots = Template.bind({});
HiddenLineShowDots.args = {
  ...Default.args,
  styleOptions: {
    ...mockStyleOptions,
    showLine: false,
    showDots: true,
  },
};

export const MultipleAxes = Template.bind({});
MultipleAxes.args = {
  ...Default.args,
  visualizationData: {
    ...mockVisualizationData,
    numericalColumns: [
      { id: 1, column: 'value1', name: 'Revenue', schema: VisFieldType.Numerical },
      { id: 2, column: 'value2', name: 'Profit', schema: VisFieldType.Numerical },
    ],
  },
  styleOptions: {
    ...mockStyleOptions,
    valueAxes: [
      ...mockStyleOptions.valueAxes,
      {
        id: 'ValueAxis-2',
        name: 'RightAxis-1',
        type: 'value' as const,
        position: Positions.RIGHT,
        show: true,
        labels: {
          show: true,
          rotate: 0,
          filter: false,
          truncate: 100,
        },
        title: { text: 'Profit' },
      },
    ],
  },
};

export const MinimalConfiguration = Template.bind({});
MinimalConfiguration.args = {
  ...Default.args,
  styleOptions: {
    ...mockStyleOptions,
    addLegend: false,
    addTooltip: false,
    showDots: false,
    categoryAxes: [
      {
        ...mockStyleOptions.categoryAxes[0],
        labels: {
          ...mockStyleOptions.categoryAxes[0].labels,
          show: false,
        },
      },
    ],
  },
};

export const CustomColors = Template.bind({});
CustomColors.args = {
  ...Default.args,
  styleOptions: {
    ...mockStyleOptions,
    thresholdLine: {
      show: true,
      value: 140,
      color: '#00BFB3',
      style: ThresholdLineStyle.Dashed,
      width: 3,
    },
    addTimeMarker: true,
  },
};
