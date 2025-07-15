/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { RootState } from '../store';

/**
 * Mock store interface for testing middleware and components
 */
export interface MockStore {
  getState: jest.MockedFunction<() => RootState>;
  dispatch: jest.MockedFunction<(action: any) => any>;
}

/**
 * Creates a mock Redux store for testing
 */
export const createMockStore = (initialState?: Partial<RootState>): MockStore => ({
  getState: jest.fn().mockReturnValue({
    query: {
      query: 'source=hello',
      language: 'PPL',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    },
    ui: {
      showDatasetFields: false,
      prompt: '',
    },
    results: {},
    tab: {},
    legacy: {
      interval: 'auto',
      columns: [],
      sort: [],
    },
    system: {
      status: 'UNINITIALIZED',
    },
    ...initialState,
  }),
  dispatch: jest.fn(),
});

/**
 * Creates a mock state with common test scenarios
 */
export const createMockRootState = (overrides?: Partial<RootState>): RootState =>
  ({
    query: {
      query: 'source hello',
      language: 'PPL',
      dataset: { id: 'test-dataset', type: 'INDEX_PATTERN' },
    },
    ui: {
      showFilterPanel: false,
      prompt: '',
    },
    results: {},
    tab: {},
    legacy: {
      interval: 'auto',
      columns: [],
      sort: [],
    },
    system: {
      status: 'UNINITIALIZED',
    },
    ...overrides,
  } as RootState);
