/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useVisualizationRegistry } from './use_visualization_types';
import { visualizationRegistry } from '../visualization_registry';

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
