/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createTraceAppState } from './trace_app_state';
import {
  createOsdUrlStateStorage,
  createStateContainer,
  syncState,
} from '../../../../../../../opensearch_dashboards_utils/public';

jest.mock('../../../../../../../opensearch_dashboards_utils/public', () => ({
  createOsdUrlStateStorage: jest.fn(),
  createStateContainer: jest.fn(),
  syncState: jest.fn(),
}));

describe('TraceAppState', () => {
  let mockOsdUrlStateStorage: any;
  let mockHistory: any;

  beforeEach(() => {
    mockHistory = {
      location: {
        pathname: '/app/explore',
        search: '',
        hash: '',
      },
      push: jest.fn(),
      replace: jest.fn(),
    };

    mockOsdUrlStateStorage = {
      set: jest.fn(),
      get: jest.fn(),
      flush: jest.fn(),
      cancel: jest.fn(),
    };

    const mockStateContainer = {
      get: jest.fn(),
      set: jest.fn(),
      state$: {
        subscribe: jest.fn(),
      },
      transitions: {
        setSpanId: jest.fn(),
        setTraceId: jest.fn(),
        setDataSourceId: jest.fn(),
        setIndexPattern: jest.fn(),
        updateState: jest.fn(),
      },
    };

    const mockSyncState = {
      start: jest.fn(),
      stop: jest.fn(),
    };

    (createOsdUrlStateStorage as jest.Mock).mockReturnValue(mockOsdUrlStateStorage);
    (createStateContainer as jest.Mock).mockReturnValue(mockStateContainer);
    (syncState as jest.Mock).mockReturnValue(mockSyncState);

    // Set up state container behavior
    let currentState: any = {};
    mockStateContainer.get.mockImplementation(() => currentState);
    mockStateContainer.set.mockImplementation((newState: any) => {
      currentState = newState;
    });

    // Mock createStateContainer to initialize with the provided initial state
    (createStateContainer as jest.Mock).mockImplementation((initialState: any) => {
      currentState = initialState;
      return mockStateContainer;
    });

    // Set up transitions to actually update state
    mockStateContainer.transitions.setSpanId.mockImplementation((spanId: string | undefined) => {
      currentState = { ...currentState, spanId };
    });
    mockStateContainer.transitions.setTraceId.mockImplementation((traceId: string) => {
      currentState = { ...currentState, traceId };
    });
    mockStateContainer.transitions.setDataSourceId.mockImplementation((dataSourceId: string) => {
      currentState = { ...currentState, dataSourceId };
    });
    mockStateContainer.transitions.setIndexPattern.mockImplementation((indexPattern: string) => {
      currentState = { ...currentState, indexPattern };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTraceAppState', () => {
    it('creates state container with default values', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const { stateContainer } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      const state = stateContainer.get();
      expect(state).toEqual(stateDefaults);
    });

    it('creates state container with custom initial state', () => {
      const stateDefaults = {
        traceId: 'custom-trace-id',
        dataSourceId: 'custom-datasource',
        indexPattern: 'custom-index-*',
        spanId: 'custom-span-id',
      };

      const { stateContainer } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      const state = stateContainer.get();
      expect(state.traceId).toBe('custom-trace-id');
      expect(state.dataSourceId).toBe('custom-datasource');
      expect(state.indexPattern).toBe('custom-index-*');
      expect(state.spanId).toBe('custom-span-id');
    });

    it('provides state transitions', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const { stateContainer } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      expect(stateContainer.transitions).toBeDefined();
      expect(typeof stateContainer.transitions.setSpanId).toBe('function');
      expect(typeof stateContainer.transitions.setTraceId).toBe('function');
      expect(typeof stateContainer.transitions.setDataSourceId).toBe('function');
      expect(typeof stateContainer.transitions.setIndexPattern).toBe('function');
    });

    it('returns stopStateSync function', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const { stopStateSync } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      expect(typeof stopStateSync).toBe('function');
    });
  });

  describe('state transitions', () => {
    let stateContainer: any;

    beforeEach(() => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const result = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });
      stateContainer = result.stateContainer;
    });

    it('setSpanId updates span ID', () => {
      stateContainer.transitions.setSpanId('new-span-id');

      const state = stateContainer.get();
      expect(state.spanId).toBe('new-span-id');
    });

    it('setSpanId can clear span ID', () => {
      stateContainer.transitions.setSpanId('span-id');
      stateContainer.transitions.setSpanId(undefined);

      const state = stateContainer.get();
      expect(state.spanId).toBeUndefined();
    });

    it('setTraceId updates trace ID', () => {
      stateContainer.transitions.setTraceId('new-trace-id');

      const state = stateContainer.get();
      expect(state.traceId).toBe('new-trace-id');
    });

    it('setDataSourceId updates data source ID', () => {
      stateContainer.transitions.setDataSourceId('new-datasource');

      const state = stateContainer.get();
      expect(state.dataSourceId).toBe('new-datasource');
    });

    it('setIndexPattern updates index pattern', () => {
      stateContainer.transitions.setIndexPattern('new-index-*');

      const state = stateContainer.get();
      expect(state.indexPattern).toBe('new-index-*');
    });

    it('multiple transitions work correctly', () => {
      stateContainer.transitions.setSpanId('span-1');
      stateContainer.transitions.setTraceId('trace-1');
      stateContainer.transitions.setDataSourceId('datasource-1');

      const state = stateContainer.get();
      expect(state.spanId).toBe('span-1');
      expect(state.traceId).toBe('trace-1');
      expect(state.dataSourceId).toBe('datasource-1');
    });
  });

  describe('URL synchronization', () => {
    it('syncs state changes to URL', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const { stateContainer } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      // Simulate state change
      stateContainer.transitions.setSpanId('new-span-id');

      expect(mockOsdUrlStateStorage.set).toHaveBeenCalled();
    });

    it('handles URL state restoration', () => {
      const existingState = {
        traceId: 'url-trace-id',
        dataSourceId: 'url-datasource',
        indexPattern: 'url-index-*',
        spanId: 'url-span-id',
      };

      mockOsdUrlStateStorage.get.mockReturnValue(existingState);

      const stateDefaults = {
        traceId: 'default-trace-id',
        dataSourceId: 'default-datasource',
        indexPattern: 'default-index-*',
        spanId: undefined,
      };

      const { stateContainer } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      // The state should be initialized from URL if available
      expect(mockOsdUrlStateStorage.get).toHaveBeenCalledWith('_a');
    });
  });

  describe('state cleanup', () => {
    it('stopStateSync stops URL synchronization', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const { stopStateSync } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      expect(() => stopStateSync()).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('handles undefined spanId correctly', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const { stateContainer } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      const state = stateContainer.get();
      expect(state.spanId).toBeUndefined();

      stateContainer.transitions.setSpanId(undefined);
      const updatedState = stateContainer.get();
      expect(updatedState.spanId).toBeUndefined();
    });

    it('handles empty string values', () => {
      const stateDefaults = {
        traceId: '',
        dataSourceId: '',
        indexPattern: '',
        spanId: undefined,
      };

      const { stateContainer } = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      const state = stateContainer.get();
      expect(state.traceId).toBe('');
      expect(state.dataSourceId).toBe('');
      expect(state.indexPattern).toBe('');
    });
  });
});
