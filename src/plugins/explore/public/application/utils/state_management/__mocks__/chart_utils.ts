/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Consolidated chart utility mocks
 */
export const mockChartUtilsMocks = {
  createHistogramConfigs: jest.fn(),
  getDimensions: jest.fn(),
  buildPointSeriesData: jest.fn(),
};

/**
 * Data plugin mocks
 */
export const mockDataPluginMocks = {
  search: {
    tabifyAggResponse: jest.fn(),
  },
};

// Mock the modules using the mock objects
jest.mock('../../../legacy/discover/application/components/chart/utils', () => mockChartUtilsMocks);
jest.mock('../../../../../../data/public', () => mockDataPluginMocks);

// Export individual mock functions for convenience
export const mockCreateHistogramConfigs = mockChartUtilsMocks.createHistogramConfigs;
export const mockGetDimensions = mockChartUtilsMocks.getDimensions;
export const mockBuildPointSeriesData = mockChartUtilsMocks.buildPointSeriesData;
export const mockTabifyAggResponse = mockDataPluginMocks.search.tabifyAggResponse;

/**
 * Creates mock histogram configurations for testing
 */
export const createMockHistogramConfigs = () => ({
  aggs: [
    {},
    {
      buckets: {
        getInterval: jest.fn(() => ({ interval: '1h', scale: 1 })),
      },
    },
  ],
});
