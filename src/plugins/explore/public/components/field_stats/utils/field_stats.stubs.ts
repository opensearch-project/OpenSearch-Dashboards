/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreServices } from '../../../types';
import { Dataset, FieldStatsItem, DetailSectionConfig } from './field_stats_types';

export const createMockServices = (): ExploreServices =>
  ({
    data: {
      search: {
        searchSource: {
          create: jest.fn().mockResolvedValue({
            setFields: jest.fn(),
            fetch: jest.fn(),
          }),
        },
      },
      dataViews: {
        get: jest.fn().mockResolvedValue({
          id: 'test-dataview-id',
          title: 'test-index',
        }),
      },
      query: {
        filterManager: {
          getFilters: jest.fn().mockReturnValue([]),
        },
      },
    },
  } as any);

export const createMockDataset = (overrides: Partial<Dataset> = {}): Dataset => ({
  id: 'test-dataset-id',
  type: 'INDEX_PATTERN',
  title: 'test-index',
  fields: {
    getAll: jest.fn().mockReturnValue([]),
  },
  metaFields: [],
  ...overrides,
});

export const createMockFieldStatsItem = (
  overrides: Partial<FieldStatsItem> = {}
): FieldStatsItem => ({
  name: 'testField',
  type: 'string',
  docCount: 100,
  distinctCount: 50,
  docPercentage: 75,
  ...overrides,
});

export const createMockDetailSection = (
  overrides: Partial<DetailSectionConfig> = {}
): DetailSectionConfig => ({
  id: 'mockSection',
  title: 'Mock Section',
  applicableToTypes: ['string'],
  fetchData: jest.fn().mockResolvedValue({ data: 'mock' }),
  component: jest.fn() as any,
  ...overrides,
});

export const mockQueryResult = (source: any = {}) => ({
  hits: {
    hits: [{ _source: source }],
  },
});

export const mockEmptyQueryResult = () => ({
  hits: { hits: [] },
});

export const mockUndefinedQueryResult = () => ({});

export const mockQueryResultWithHits = (hits: any[]) => ({
  hits: {
    hits: hits.map((source) => ({ _source: source })),
  },
});

export const expectValidDetailConfig = (
  config: DetailSectionConfig,
  expectedId: string,
  expectedTitle: string,
  expectedTypes: string[]
) => {
  expect(config.id).toBe(expectedId);
  expect(config.title).toBe(expectedTitle);
  expect(config.applicableToTypes).toEqual(expectedTypes);
  expect(config.component).toBeDefined();
  expect(config.fetchData).toBeDefined();
};
