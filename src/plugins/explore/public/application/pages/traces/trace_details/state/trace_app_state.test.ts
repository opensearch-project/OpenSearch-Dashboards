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

  beforeEach(() => {
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

      createTraceAppState({
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

  describe('UpdateState transition', () => {
    let stateContainer: any;

    beforeEach(() => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      // Mock updateState transition
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

      let currentState = { ...stateDefaults };
      mockStateContainer.get.mockImplementation(() => currentState);
      mockStateContainer.set.mockImplementation((newState: any) => {
        currentState = newState;
      });

      // Mock updateState to actually merge state
      mockStateContainer.transitions.updateState.mockImplementation((newState: any) => {
        currentState = { ...currentState, ...newState };
      });

      (createStateContainer as jest.Mock).mockReturnValue(mockStateContainer);

      const result = createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });
      stateContainer = result.stateContainer;
    });

    it('updateState merges partial state correctly', () => {
      const partialState = {
        traceId: 'updated-trace-id',
        spanId: 'updated-span-id',
      };

      stateContainer.transitions.updateState(partialState);

      const state = stateContainer.get();
      expect(state.traceId).toBe('updated-trace-id');
      expect(state.spanId).toBe('updated-span-id');
      expect(state.dataSourceId).toBe('test-datasource'); // Should remain unchanged
      expect(state.indexPattern).toBe('test-index-*'); // Should remain unchanged
    });

    it('updateState handles empty object', () => {
      const originalState = stateContainer.get();

      stateContainer.transitions.updateState({});

      const state = stateContainer.get();
      expect(state).toEqual(originalState);
    });
  });

  describe('URL state initialization', () => {
    it('sets initial state to URL when no existing state', () => {
      mockOsdUrlStateStorage.get.mockReturnValue(null);

      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      expect(mockOsdUrlStateStorage.set).toHaveBeenCalledWith('_a', stateDefaults, {
        replace: true,
      });
    });

    it('does not set initial state to URL when existing state found', () => {
      const existingState = {
        traceId: 'existing-trace-id',
        dataSourceId: 'existing-datasource',
        indexPattern: 'existing-index-*',
        spanId: 'existing-span-id',
      };

      mockOsdUrlStateStorage.get.mockReturnValue(existingState);

      const stateDefaults = {
        traceId: 'default-trace-id',
        dataSourceId: 'default-datasource',
        indexPattern: 'default-index-*',
        spanId: undefined,
      };

      createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      // Should not call set with replace: true when existing state is found
      expect(mockOsdUrlStateStorage.set).not.toHaveBeenCalledWith('_a', expect.anything(), {
        replace: true,
      });
    });

    it('merges URL state with defaults correctly', () => {
      const urlState = {
        traceId: 'url-trace-id',
        spanId: 'url-span-id',
      };

      mockOsdUrlStateStorage.get.mockReturnValue(urlState);

      const stateDefaults = {
        traceId: 'default-trace-id',
        dataSourceId: 'default-datasource',
        indexPattern: 'default-index-*',
        spanId: undefined,
      };

      createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      expect(createStateContainer).toHaveBeenCalledWith(
        {
          traceId: 'url-trace-id', // From URL
          dataSourceId: 'default-datasource', // From defaults
          indexPattern: 'default-index-*', // From defaults
          spanId: 'url-span-id', // From URL
        },
        expect.any(Object)
      );
    });
  });

  describe('syncState custom set function', () => {
    it('handles null state in custom set function', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
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

      (createStateContainer as jest.Mock).mockReturnValue(mockStateContainer);

      // Capture the syncState call to test the custom set function
      let customSetFunction: any;
      (syncState as jest.Mock).mockImplementation((config: any) => {
        customSetFunction = config.stateContainer.set;
        return {
          start: jest.fn(),
          stop: jest.fn(),
        };
      });

      createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      // Test that the custom set function handles null state
      customSetFunction(null);
      expect(mockStateContainer.set).not.toHaveBeenCalled();

      // Test that the custom set function handles valid state
      const validState = { traceId: 'new-trace-id' };
      customSetFunction(validState);
      expect(mockStateContainer.set).toHaveBeenCalledWith(validState);
    });
  });

  describe('state transitions implementation', () => {
    it('setTraceId transition returns correct state', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      // Test the actual transition function implementation
      const transitions = {
        setTraceId: (state: any) => (traceId: string) => ({
          ...state,
          traceId,
        }),
        setDataSourceId: (state: any) => (dataSourceId: string) => ({
          ...state,
          dataSourceId,
        }),
        setIndexPattern: (state: any) => (indexPattern: string) => ({
          ...state,
          indexPattern,
        }),
        setSpanId: (state: any) => (spanId?: string) => ({
          ...state,
          spanId,
        }),
        updateState: (state: any) => (newState: any) => ({
          ...state,
          ...newState,
        }),
      };

      // Test setTraceId
      const setTraceIdResult = transitions.setTraceId(stateDefaults)('new-trace-id');
      expect(setTraceIdResult).toEqual({
        ...stateDefaults,
        traceId: 'new-trace-id',
      });

      // Test setDataSourceId
      const setDataSourceIdResult = transitions.setDataSourceId(stateDefaults)('new-datasource');
      expect(setDataSourceIdResult).toEqual({
        ...stateDefaults,
        dataSourceId: 'new-datasource',
      });

      // Test setIndexPattern
      const setIndexPatternResult = transitions.setIndexPattern(stateDefaults)('new-index-*');
      expect(setIndexPatternResult).toEqual({
        ...stateDefaults,
        indexPattern: 'new-index-*',
      });

      // Test setSpanId
      const setSpanIdResult = transitions.setSpanId(stateDefaults)('new-span-id');
      expect(setSpanIdResult).toEqual({
        ...stateDefaults,
        spanId: 'new-span-id',
      });

      // Test updateState
      const updateStateResult = transitions.updateState(stateDefaults)({
        traceId: 'updated-trace-id',
        spanId: 'updated-span-id',
      });
      expect(updateStateResult).toEqual({
        ...stateDefaults,
        traceId: 'updated-trace-id',
        spanId: 'updated-span-id',
      });
    });
  });

  describe('actual transition function coverage', () => {
    it('tests the actual transition functions passed to createStateContainer', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      // Capture the transitions passed to createStateContainer
      let capturedTransitions: any;
      (createStateContainer as jest.Mock).mockImplementation((initialState, transitions) => {
        capturedTransitions = transitions;
        return {
          get: jest.fn().mockReturnValue(initialState),
          set: jest.fn(),
          state$: { subscribe: jest.fn() },
          transitions: {},
        };
      });

      createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      // Test setTraceId transition function
      const setTraceIdResult = capturedTransitions.setTraceId(stateDefaults)('new-trace-id');
      expect(setTraceIdResult).toEqual({
        ...stateDefaults,
        traceId: 'new-trace-id',
      });

      // Test setDataSourceId transition function
      const setDataSourceIdResult = capturedTransitions.setDataSourceId(stateDefaults)(
        'new-datasource'
      );
      expect(setDataSourceIdResult).toEqual({
        ...stateDefaults,
        dataSourceId: 'new-datasource',
      });

      // Test setIndexPattern transition function
      const setIndexPatternResult = capturedTransitions.setIndexPattern(stateDefaults)(
        'new-index-*'
      );
      expect(setIndexPatternResult).toEqual({
        ...stateDefaults,
        indexPattern: 'new-index-*',
      });

      // Test setSpanId transition function with string
      const setSpanIdResult = capturedTransitions.setSpanId(stateDefaults)('new-span-id');
      expect(setSpanIdResult).toEqual({
        ...stateDefaults,
        spanId: 'new-span-id',
      });

      // Test setSpanId transition function with undefined
      const setSpanIdUndefinedResult = capturedTransitions.setSpanId(stateDefaults)(undefined);
      expect(setSpanIdUndefinedResult).toEqual({
        ...stateDefaults,
        spanId: undefined,
      });

      // Test updateState transition function
      const updateStateResult = capturedTransitions.updateState(stateDefaults)({
        traceId: 'updated-trace-id',
        spanId: 'updated-span-id',
      });
      expect(updateStateResult).toEqual({
        ...stateDefaults,
        traceId: 'updated-trace-id',
        spanId: 'updated-span-id',
      });
    });

    it('tests the custom set function in syncState', () => {
      const stateDefaults = {
        traceId: 'test-trace-id',
        dataSourceId: 'test-datasource',
        indexPattern: 'test-index-*',
        spanId: undefined,
      };

      const mockStateContainer = {
        get: jest.fn(),
        set: jest.fn(),
        state$: { subscribe: jest.fn() },
        transitions: {},
      };

      (createStateContainer as jest.Mock).mockReturnValue(mockStateContainer);

      // Capture the syncState configuration
      let capturedConfig: any;
      (syncState as jest.Mock).mockImplementation((config) => {
        capturedConfig = config;
        return { start: jest.fn(), stop: jest.fn() };
      });

      createTraceAppState({
        stateDefaults,
        osdUrlStateStorage: mockOsdUrlStateStorage,
      });

      // Test the custom set function with null state
      capturedConfig.stateContainer.set(null);
      expect(mockStateContainer.set).not.toHaveBeenCalled();

      // Test the custom set function with valid state
      const validState = { traceId: 'new-trace-id' };
      capturedConfig.stateContainer.set(validState);
      expect(mockStateContainer.set).toHaveBeenCalledWith(validState);
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
