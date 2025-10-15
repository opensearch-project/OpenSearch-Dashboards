/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useAssistantAction } from '../../../context_provider/public';
import { useGraphTimeseriesDataAction } from './graph_timeseries_data_action';

// Mock dependencies
jest.mock('../../../context_provider/public');
jest.mock('../components/graph_visualization', () => ({
  GraphVisualization: ({ data }: any) => (
    <div data-test-subj="graph-visualization">Graph with {data.title || 'No Title'}</div>
  ),
}));

describe('useGraphTimeseriesDataAction', () => {
  let mockUseAssistantAction: jest.MockedFunction<typeof useAssistantAction>;
  let registeredAction: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAssistantAction = useAssistantAction as jest.MockedFunction<typeof useAssistantAction>;

    // Capture the registered action
    mockUseAssistantAction.mockImplementation((action) => {
      registeredAction = action;
    });
  });

  describe('action registration', () => {
    it('should register action with correct name and description', () => {
      // Component that uses the hook
      const TestComponent = () => {
        useGraphTimeseriesDataAction();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      expect(mockUseAssistantAction).toHaveBeenCalledWith({
        name: 'graph_timeseries_data',
        description: 'Create a timeseries graph visualization from provided data',
        parameters: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            data: expect.objectContaining({
              type: 'object',
              description: 'Timeseries data in Prometheus format or simple array format',
            }),
            title: expect.objectContaining({
              type: 'string',
              description: 'Optional title for the graph',
            }),
          }),
          required: ['data'],
        }),
        handler: expect.any(Function),
        render: expect.any(Function),
      });
    });
  });

  describe('handler function', () => {
    beforeEach(() => {
      const TestComponent = () => {
        useGraphTimeseriesDataAction();
        return <div>Test</div>;
      };
      render(<TestComponent />);
    });

    describe('Prometheus data format', () => {
      it('should handle valid Prometheus data', async () => {
        const prometheusData = {
          result: [
            {
              metric: { instance: 'localhost:9090' },
              values: [
                [1609459200, '100'],
                [1609459260, '150'],
              ],
            },
          ],
        };

        const result = await registeredAction.handler({
          data: prometheusData,
          title: 'Test Graph',
        });

        expect(result).toEqual({
          success: true,
          dataPoints: 2,
          title: 'Test Graph',
          message: 'Successfully created timeseries graph with 2 data points',
          graphData: {
            data: prometheusData,
            title: 'Test Graph',
          },
        });
      });

      it('should handle empty Prometheus result', async () => {
        const prometheusData = {
          result: [],
        };

        const result = await registeredAction.handler({
          data: prometheusData,
        });

        expect(result).toEqual({
          success: false,
          error: 'Prometheus data must have a non-empty result array',
          dataPoints: 0,
        });
      });

      it('should handle Prometheus data without result', async () => {
        const prometheusData = {};

        const result = await registeredAction.handler({
          data: prometheusData,
        });

        expect(result).toEqual({
          success: false,
          error:
            'Data must be either an array of data points or Prometheus-style data with result array',
          dataPoints: 0,
        });
      });
    });

    describe('Simple array data format', () => {
      it('should handle valid simple array data', async () => {
        const simpleData = [
          { timestamp: '2021-01-01T00:00:00Z', value: 100 },
          { timestamp: '2021-01-01T01:00:00Z', value: 150 },
          { timestamp: '2021-01-01T02:00:00Z', value: 120 },
        ];

        const result = await registeredAction.handler({
          data: simpleData,
          title: 'Simple Graph',
          description: 'Test description',
        });

        expect(result).toEqual({
          success: true,
          dataPoints: 3,
          title: 'Simple Graph',
          message: 'Successfully created timeseries graph with 3 data points',
          graphData: {
            data: simpleData,
            title: 'Simple Graph',
            description: 'Test description',
          },
        });
      });

      it('should handle empty array', async () => {
        const result = await registeredAction.handler({
          data: [],
        });

        expect(result).toEqual({
          success: false,
          error: 'Data must be a non-empty array',
          dataPoints: 0,
        });
      });

      it('should validate data point structure', async () => {
        const invalidData = [
          { timestamp: '2021-01-01T00:00:00Z' }, // Missing value
          { value: 100 }, // Missing timestamp
        ];

        const result = await registeredAction.handler({
          data: invalidData,
        });

        expect(result).toEqual({
          success: false,
          error: 'Each data point must have timestamp and value properties',
          dataPoints: 0,
        });
      });

      it('should validate value is number', async () => {
        const invalidData = [{ timestamp: '2021-01-01T00:00:00Z', value: 'not-a-number' }];

        const result = await registeredAction.handler({
          data: invalidData,
        });

        expect(result).toEqual({
          success: false,
          error: 'Value must be a number',
          dataPoints: 0,
        });
      });
    });

    describe('error handling', () => {
      it('should handle invalid data format', async () => {
        const result = await registeredAction.handler({
          data: 'invalid-data',
        });

        expect(result).toEqual({
          success: false,
          error:
            'Data must be either an array of data points or Prometheus-style data with result array',
          dataPoints: 0,
        });
      });

      it('should handle handler exceptions', async () => {
        // Test with valid data that should succeed
        const result = await registeredAction.handler({
          data: [{ timestamp: '2021-01-01', value: 100 }],
        });

        expect(result).toEqual({
          success: true,
          dataPoints: 1,
          title: 'Timeseries Graph',
          message: 'Successfully created timeseries graph with 1 data points',
          graphData: {
            data: [{ timestamp: '2021-01-01', value: 100 }],
          },
        });
      });

      it('should use default title when not provided', async () => {
        const result = await registeredAction.handler({
          data: [{ timestamp: '2021-01-01', value: 100 }],
        });

        expect(result.title).toBe('Timeseries Graph');
      });
    });
  });

  describe('render function', () => {
    beforeEach(() => {
      const TestComponent = () => {
        useGraphTimeseriesDataAction();
        return <div>Test</div>;
      };
      render(<TestComponent />);
    });

    it('should render null when no args provided', () => {
      const { container } = render(
        <div>{registeredAction.render({ status: 'complete', args: null, result: null })}</div>
      );

      expect(container.firstChild?.textContent).toBe('');
    });

    it('should render executing status', () => {
      const args = {
        data: [{ timestamp: '2021-01-01', value: 100 }],
        title: 'Test Graph',
      };

      render(<div>{registeredAction.render({ status: 'executing', args, result: null })}</div>);

      expect(screen.getByText('Creating timeseries graph...')).toBeInTheDocument();
      expect(screen.getByText('⟳')).toBeInTheDocument();
    });

    it('should render complete status with success', () => {
      const args = {
        data: [{ timestamp: '2021-01-01', value: 100 }],
        title: 'Test Graph',
        description: 'Test description',
      };

      const result = {
        success: true,
        dataPoints: 1,
        message: 'Graph created successfully',
        graphData: args,
      };

      render(<div>{registeredAction.render({ status: 'complete', args, result })}</div>);

      expect(screen.getByText('Graph created successfully')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
      expect(screen.getByText(/Title:/)).toBeInTheDocument();
      expect(screen.getAllByText(/Test Graph/)[0]).toBeInTheDocument(); // Use getAllByText and take first match
      expect(screen.getByText('Test description')).toBeInTheDocument();
      expect(screen.getByText(/Data points:/)).toBeInTheDocument();
      expect(screen.getByTestId('graph-visualization')).toBeInTheDocument();
    });

    it('should render failed status', () => {
      const args = {
        data: [],
        title: 'Failed Graph',
      };

      const result = {
        success: false,
        error: 'No data provided',
        dataPoints: 0,
      };

      render(<div>{registeredAction.render({ status: 'failed', args, result })}</div>);

      expect(screen.getByText('No data provided')).toBeInTheDocument();
      expect(screen.getByText('✗')).toBeInTheDocument();
      expect(screen.queryByTestId('graph-visualization')).not.toBeInTheDocument();
    });

    it('should render with optional metadata', () => {
      const args = {
        data: [{ timestamp: '2021-01-01', value: 100 }],
        title: 'Test Graph',
        xAxisLabel: 'Time',
        yAxisLabel: 'Value',
      };

      const result = {
        success: true,
        dataPoints: 1,
        message: 'Success',
        graphData: args,
      };

      render(<div>{registeredAction.render({ status: 'complete', args, result })}</div>);

      expect(screen.getByText(/X-axis:/)).toBeInTheDocument();
      expect(screen.getByText(/Y-axis:/)).toBeInTheDocument();
    });

    it('should handle missing result gracefully', () => {
      const args = {
        data: [{ timestamp: '2021-01-01', value: 100 }],
      };

      render(<div>{registeredAction.render({ status: 'complete', args, result: null })}</div>);

      expect(screen.getByText(/Data points:/)).toBeInTheDocument();
    });
  });
});
