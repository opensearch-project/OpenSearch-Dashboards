/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageHeader,
  EuiPageHeaderSection,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiPanel,
  EuiSelect,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHorizontalRule,
} from '@elastic/eui';
import { CoreStart } from '../../../src/core/public';
import { ExpressionsSetup, ExpressionsStart } from '../../../src/plugins/expressions/public';
import { ExplorePluginSetup, ExplorePluginStart } from '../../../src/plugins/explore/public';

// Define ChartType locally to avoid restricted imports
type ChartType =
  | 'line'
  | 'pie'
  | 'metric'
  | 'heatmap'
  | 'scatter'
  | 'bar'
  | 'area'
  | 'table'
  | 'gauge';

interface RenderDependencies {
  core: CoreStart;
  deps: {
    explore: ExplorePluginStart;
  };
  expressions: ExpressionsStart;
  appBasePath: string;
  element: HTMLElement;
  Visualization: ExplorePluginSetup['ui']['Visualization'];
}

// Sample data for visualizations
const sampleData = {
  barData: [
    { category: 'A', value: 10 },
    { category: 'B', value: 20 },
    { category: 'C', value: 15 },
    { category: 'D', value: 25 },
    { category: 'E', value: 18 },
  ],
  lineData: [
    { date: '2023-01-01', value: 10 },
    { date: '2023-02-01', value: 15 },
    { date: '2023-03-01', value: 7 },
    { date: '2023-04-01', value: 20 },
    { date: '2023-05-01', value: 12 },
    { date: '2023-06-01', value: 30 },
  ],
  pieData: [
    { category: 'Category A', value: 30 },
    { category: 'Category B', value: 25 },
    { category: 'Category C', value: 15 },
    { category: 'Category D', value: 10 },
    { category: 'Category E', value: 20 },
  ],
  metricData: [{ value: 1250 }],
  heatmapData: [
    { x: 'A', y: '1', value: 10 },
    { x: 'A', y: '2', value: 20 },
    { x: 'A', y: '3', value: 30 },
    { x: 'B', y: '1', value: 40 },
    { x: 'B', y: '2', value: 50 },
    { x: 'B', y: '3', value: 60 },
    { x: 'C', y: '1', value: 70 },
    { x: 'C', y: '2', value: 80 },
    { x: 'C', y: '3', value: 90 },
  ],
  areaData: [
    { date: '2023-01-01', value: 10 },
    { date: '2023-02-01', value: 15 },
    { date: '2023-03-01', value: 7 },
    { date: '2023-04-01', value: 20 },
    { date: '2023-05-01', value: 12 },
    { date: '2023-06-01', value: 30 },
  ],
  scatterData: [
    { x: 1, y: 10 },
    { x: 2, y: 20 },
    { x: 3, y: 15 },
    { x: 4, y: 25 },
    { x: 5, y: 18 },
    { x: 6, y: 30 },
    { x: 7, y: 12 },
    { x: 8, y: 22 },
  ],
  gaugeData: [{ value: 75 }],
  tableData: [
    { name: 'John', age: 30, city: 'New York' },
    { name: 'Jane', age: 25, city: 'San Francisco' },
    { name: 'Bob', age: 40, city: 'Chicago' },
    { name: 'Alice', age: 35, city: 'Seattle' },
    { name: 'Tom', age: 28, city: 'Boston' },
  ],
};

// Example component to demonstrate the Visualization component
const VisualizationExample = ({
  Visualization,
}: {
  Visualization: RenderDependencies['Visualization'];
}) => {
  const [chartType, setChartType] = useState<ChartType>('bar');

  // Get the appropriate data for the selected chart type
  const getDataForChartType = (type: ChartType) => {
    switch (type) {
      case 'bar':
        return sampleData.barData;
      case 'line':
        return sampleData.lineData;
      case 'pie':
        return sampleData.pieData;
      case 'metric':
        return sampleData.metricData;
      case 'heatmap':
        return sampleData.heatmapData;
      case 'area':
        return sampleData.areaData;
      case 'scatter':
        return sampleData.scatterData;
      case 'gauge':
        return sampleData.gaugeData;
      case 'table':
        return sampleData.tableData;
      default:
        return sampleData.barData;
    }
  };

  // Generate example code based on the current chart type
  const getExampleCode = () => {
    const data = JSON.stringify(getDataForChartType(chartType), null, 2)
      .split('\n')
      .map((line, i) => (i === 0 ? line : `  ${line}`))
      .join('\n');

    return `// Import the Visualization component from the explore plugin setup
// In your plugin's setup method:
const { ui } = setupDeps.explore;
const { Visualization } = ui;

// Sample data for ${chartType} chart
const data = ${data};

// Render the visualization
<Visualization 
  data={data} 
  type={'${chartType}'} 
/>`;
  };

  const chartOptions = [
    { value: 'bar', text: 'Bar Chart' },
    { value: 'line', text: 'Line Chart' },
    { value: 'pie', text: 'Pie Chart' },
    { value: 'metric', text: 'Metric' },
    { value: 'heatmap', text: 'Heatmap' },
    { value: 'area', text: 'Area Chart' },
    { value: 'scatter', text: 'Scatter Plot' },
    { value: 'gauge', text: 'Gauge' },
    { value: 'table', text: 'Table' },
  ];

  return (
    <EuiPage>
      <EuiPageBody>
        <EuiPageHeader>
          <EuiPageHeaderSection>
            <EuiTitle size="l">
              <h1>Visualization Examples</h1>
            </EuiTitle>
          </EuiPageHeaderSection>
        </EuiPageHeader>
        <EuiPageContent>
          <EuiPageContentBody>
            <EuiText>
              <p>
                This example demonstrates how to use the Visualization component from the explore
                plugin. You can select different chart types from the dropdown below to see how the
                component renders different visualizations.
              </p>
            </EuiText>
            <EuiSpacer size="l" />

            <EuiFlexGroup>
              <EuiFlexItem grow={false}>
                <EuiSelect
                  options={chartOptions}
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as ChartType)}
                  aria-label="Select chart type"
                />
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="l" />

            <EuiPanel paddingSize="l">
              <EuiTitle size="s">
                <h2>{chartOptions.find((option) => option.value === chartType)?.text}</h2>
              </EuiTitle>
              <EuiHorizontalRule />
              <div style={{ height: '400px' }}>
                <Visualization
                  style={{ height: '100%' }}
                  data={getDataForChartType(chartType)}
                  type={chartType}
                />
              </div>
            </EuiPanel>

            <EuiSpacer size="l" />

            <EuiText>
              <h2>Usage</h2>
              <p>The Visualization component takes two props:</p>
              <ul>
                <li>
                  <strong>data</strong>: An array of records containing the data to visualize
                </li>
                <li>
                  <strong>type</strong>: (Optional) The chart type to render
                </li>
              </ul>
              <p>Example usage:</p>
              <pre>{getExampleCode()}</pre>
            </EuiText>
          </EuiPageContentBody>
        </EuiPageContent>
      </EuiPageBody>
    </EuiPage>
  );
};

export const renderApp = ({
  core,
  deps,
  expressions,
  appBasePath,
  element,
  Visualization,
}: RenderDependencies) => {
  ReactDOM.render(<VisualizationExample Visualization={Visualization} />, element);

  return () => ReactDOM.unmountComponentAtNode(element);
};
