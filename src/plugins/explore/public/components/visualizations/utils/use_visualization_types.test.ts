/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getVisualizationType, useVisualizationRegistry } from './use_visualization_types';
import { visualizationRegistry } from '../visualization_registry';
import { VisFieldType } from '../types';
import { OPENSEARCH_FIELD_TYPES, OSD_FIELD_TYPES } from '../../../../../data/common';

// Mock the OpenSearch Dashboards context
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn().mockReturnValue({
    services: {
      visualizationRegistry: {
        getRegistry: jest.fn().mockReturnValue({
          getVisualizationType: jest.fn(),
          getRules: jest.fn(),
        }),
      },
    },
  }),
}));

// Mock the visualization registry
jest.mock('../visualization_registry', () => ({
  visualizationRegistry: {
    getVisualizationType: jest.fn(),
    getRules: jest.fn(),
  },
}));

describe('use_visualization_types', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getVisualizationType', () => {
    it('should return undefined if fieldSchema or rows are not provided', () => {
      expect(getVisualizationType(undefined, [])).toBeUndefined();
      expect(getVisualizationType([], undefined)).toBeUndefined();
      expect(getVisualizationType(undefined, undefined)).toBeUndefined();
    });

    it('should transform rows and field schema into visualization data', () => {
      // Mock the registry's getVisualizationType method
      const mockRegistryResult = {
        visualizationType: {
          name: 'line',
          type: 'line',
          ui: {
            style: {
              defaults: {},
              render: jest.fn(),
            },
          },
        },
        numericalColumns: [
          { id: 1, name: 'value', schema: VisFieldType.Numerical, column: 'field-1' },
        ],
        categoricalColumns: [],
        dateColumns: [{ id: 0, name: 'timestamp', schema: VisFieldType.Date, column: 'field-0' }],
        ruleId: 'test-rule',
        availableChartTypes: [{ type: 'line', priority: 100, name: 'Line Chart' }],
      };

      (visualizationRegistry.getVisualizationType as jest.Mock).mockReturnValue(mockRegistryResult);

      // Create test data
      const rows = [
        {
          _index: 'test-index',
          _type: 'test-type',
          _id: 'test-id',
          _score: 1,
          _source: {
            timestamp: '2023-01-01T00:00:00Z',
            value: 100,
          },
        },
      ];

      const fieldSchema = [
        { name: 'timestamp', type: OSD_FIELD_TYPES.DATE },
        { name: 'value', type: OSD_FIELD_TYPES.NUMBER },
      ];

      // Call the function
      const result = getVisualizationType(rows, fieldSchema);

      // Verify the result
      expect(result).toEqual({
        ...mockRegistryResult,
        transformedData: [
          {
            'field-0': '2023-01-01T00:00:00Z',
            'field-1': 100,
          },
        ],
      });

      // Verify that the registry was called with the correct columns
      expect(visualizationRegistry.getVisualizationType).toHaveBeenCalledWith([
        { id: 0, name: 'timestamp', schema: VisFieldType.Date, column: 'field-0' },
        { id: 1, name: 'value', schema: VisFieldType.Numerical, column: 'field-1' },
      ]);
    });

    it('should map field types correctly', () => {
      // Mock the registry's getVisualizationType method
      (visualizationRegistry.getVisualizationType as jest.Mock).mockReturnValue({});

      // Create test data with various field types
      const rows = [
        {
          _index: 'test-index',
          _type: 'test-type',
          _id: 'test-id',
          _score: 1,
          _source: {
            date: '2023-01-01T00:00:00Z',
            number: 100,
            boolean: true,
            string: 'test',
            keyword: 'keyword',
            float: 1.5,
            integer: 42,
            unknown: { nested: 'object' },
          },
        },
      ];

      const fieldSchema = [
        { name: 'date', type: OSD_FIELD_TYPES.DATE },
        { name: 'number', type: OSD_FIELD_TYPES.NUMBER },
        { name: 'boolean', type: OSD_FIELD_TYPES.BOOLEAN },
        { name: 'string', type: OSD_FIELD_TYPES.STRING },
        { name: 'keyword', type: OPENSEARCH_FIELD_TYPES.KEYWORD },
        { name: 'float', type: OPENSEARCH_FIELD_TYPES.FLOAT },
        { name: 'integer', type: OPENSEARCH_FIELD_TYPES.INTEGER },
        { name: 'unknown', type: 'not_a_real_type' },
      ];

      // Call the function
      getVisualizationType(rows, fieldSchema);

      // Verify that the registry was called with the correct column types
      expect(visualizationRegistry.getVisualizationType).toHaveBeenCalledWith([
        { id: 0, name: 'date', schema: VisFieldType.Date, column: 'field-0' },
        { id: 1, name: 'number', schema: VisFieldType.Numerical, column: 'field-1' },
        { id: 2, name: 'boolean', schema: VisFieldType.Categorical, column: 'field-2' },
        { id: 3, name: 'string', schema: VisFieldType.Categorical, column: 'field-3' },
        { id: 4, name: 'keyword', schema: VisFieldType.Categorical, column: 'field-4' },
        { id: 5, name: 'float', schema: VisFieldType.Numerical, column: 'field-5' },
        { id: 6, name: 'integer', schema: VisFieldType.Numerical, column: 'field-6' },
        { id: 7, name: 'unknown', schema: VisFieldType.Unknown, column: 'field-7' },
      ]);
    });

    it('should handle missing field names', () => {
      // Mock the registry's getVisualizationType method
      (visualizationRegistry.getVisualizationType as jest.Mock).mockReturnValue({});

      // Create test data with a missing field name
      const rows = [
        {
          _index: 'test-index',
          _type: 'test-type',
          _id: 'test-id',
          _score: 1,
          _source: {
            value: 100,
          },
        },
      ];

      const fieldSchema = [
        { type: OSD_FIELD_TYPES.NUMBER }, // Missing name
      ];

      // Call the function
      getVisualizationType(rows, fieldSchema);

      // Verify that the registry was called with an empty name
      expect(visualizationRegistry.getVisualizationType).toHaveBeenCalledWith([
        { id: 0, name: '', schema: VisFieldType.Numerical, column: 'field-0' },
      ]);
    });
  });

  describe('useVisualizationRegistry', () => {
    it('should return the service registry if available', () => {
      const mockServiceRegistry = {
        getVisualizationType: jest.fn(),
        getRules: jest.fn(),
      };

      // Mock the useOpenSearchDashboards hook to return a service with a registry
      const useOpenSearchDashboards = jest.requireMock(
        '../../../../../opensearch_dashboards_react/public'
      ).useOpenSearchDashboards;
      useOpenSearchDashboards.mockReturnValue({
        services: {
          visualizationRegistry: {
            getRegistry: jest.fn().mockReturnValue(mockServiceRegistry),
          },
        },
      });

      // Call the hook
      const registry = useVisualizationRegistry();

      // Verify that the service registry was returned
      expect(registry).toBe(mockServiceRegistry);
    });

    it('should fall back to the singleton registry if service is not available', () => {
      // Mock the useOpenSearchDashboards hook to return a service without a registry
      const useOpenSearchDashboards = jest.requireMock(
        '../../../../../opensearch_dashboards_react/public'
      ).useOpenSearchDashboards;
      useOpenSearchDashboards.mockReturnValue({
        services: {},
      });

      // Call the hook
      const registry = useVisualizationRegistry();

      // Verify that the singleton registry was returned
      expect(registry).toBe(visualizationRegistry);
    });
  });
});
