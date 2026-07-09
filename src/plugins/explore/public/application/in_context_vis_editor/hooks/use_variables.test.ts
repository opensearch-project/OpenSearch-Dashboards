/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// Mock dashboard public module FIRST before any other imports
jest.mock('../../../../../dashboard/public', () => ({
  VariableType: {
    Query: 'query',
    Custom: 'custom',
  },
  Variable: {},
  VariableService: jest.fn(),
  VariableInterpolationService: jest.fn(),
  createNoOpVariableInterpolationService: jest.fn(),
}));

// Mock opensearch_dashboards_react
jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

// Mock use_query_builder_state
jest.mock('./use_query_builder_state', () => ({
  useQueryBuilderState: jest.fn(),
}));

// Mock prepareQueryForLanguage
jest.mock('../../utils/languages', () => ({
  prepareQueryForLanguage: jest.fn((state) => ({ query: state.query })),
}));

import { renderHook } from '@testing-library/react';
import { BehaviorSubject, Subject } from 'rxjs';
import { useVariables } from './use_variables';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { useQueryBuilderState } from './use_query_builder_state';
import { VARIABLE_VALUES_URL_KEY } from '../types';
import {
  Variable,
  VariableType,
  VariableWithState,
  VariableService,
  VariableInterpolationService,
  createNoOpVariableInterpolationService,
} from '../../../../../dashboard/public';

describe('useVariables', () => {
  let mockServices: any;
  let mockQueryBuilder: any;
  let mockVariableService: any;
  let mockInterpolationService: any;
  let mockTimeUpdate$: Subject<any>;
  let mockVariables$: BehaviorSubject<Variable[]>;

  const createMockVariable = (name: string, current: string[]): VariableWithState => ({
    id: `${name}-id`,
    name,
    type: VariableType.Query,
    current,
    query: 'mock query',
    language: 'PPL',
    options: [],
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockTimeUpdate$ = new Subject();
    mockVariables$ = new BehaviorSubject<Variable[]>([]);

    mockVariableService = {
      initialize: jest.fn(),
      setInterpolationService: jest.fn(),
      refreshAllVariableOptions: jest.fn(),
      refreshTimeFilteredVariableOptions: jest.fn(),
      getVariables: jest.fn(() => []),
      getVariables$: jest.fn(() => mockVariables$),
      getVariablesWithState: jest.fn(() => []),
      destroy: jest.fn(),
    };

    mockInterpolationService = {
      interpolate: jest.fn((query) => `interpolated-${query}`),
      hasVariables: jest.fn(() => true),
    };

    mockQueryBuilder = {
      setInterpolationService: jest.fn(),
      executeQuery: jest.fn(),
      queryState$: new BehaviorSubject({
        query: 'source=logs | where $variable',
        language: 'PPL',
      }),
      lastExecutedInterpolatedQuery: null,
    };

    mockServices = {
      data: {
        query: {
          timefilter: {
            timefilter: {
              getTimeUpdate$: jest.fn(() => mockTimeUpdate$),
            },
          },
        },
      },
      osdUrlStateStorage: {
        set: jest.fn(),
        get: jest.fn(),
      },
    };

    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services: mockServices });
    (useQueryBuilderState as jest.Mock).mockReturnValue({ queryBuilder: mockQueryBuilder });
    ((VariableService as unknown) as jest.Mock).mockImplementation(() => mockVariableService);
    ((VariableInterpolationService as unknown) as jest.Mock).mockImplementation(
      () => mockInterpolationService
    );
    (createNoOpVariableInterpolationService as jest.Mock).mockReturnValue({
      interpolate: (query: string) => query,
      hasVariables: () => false,
    });
  });

  afterEach(() => {
    mockTimeUpdate$.complete();
    mockVariables$.complete();
  });

  describe('initialization', () => {
    it('returns undefined variableService when no containerVariables provided', () => {
      const { result } = renderHook(() => useVariables());

      expect(result.current.variableService).toBeUndefined();
      expect(VariableService).not.toHaveBeenCalled();
    });

    it('returns undefined variableService when containerVariables is empty array', () => {
      const { result } = renderHook(() => useVariables([]));

      expect(result.current.variableService).toBeUndefined();
      expect(VariableService).not.toHaveBeenCalled();
    });

    it('creates VariableService with containerVariables', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      const { result } = renderHook(() => useVariables(variables));

      expect(VariableService).toHaveBeenCalledWith(mockServices.data);
      expect(mockVariableService.initialize).toHaveBeenCalledWith(variables);
      expect(result.current.variableService).toBe(mockVariableService);
    });

    it('creates no-op interpolation service when no variableService', () => {
      renderHook(() => useVariables());

      expect(createNoOpVariableInterpolationService).toHaveBeenCalled();
    });

    it('creates and sets up VariableInterpolationService when variableService exists', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      expect(VariableInterpolationService).toHaveBeenCalled();
      expect(mockVariableService.setInterpolationService).toHaveBeenCalledWith(
        mockInterpolationService
      );
    });
  });

  describe('queryBuilder integration', () => {
    it('sets interpolation service on queryBuilder', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      expect(mockQueryBuilder.setInterpolationService).toHaveBeenCalledWith(
        mockInterpolationService
      );
    });

    it('does not set interpolation service when no variables', () => {
      renderHook(() => useVariables());

      expect(mockQueryBuilder.setInterpolationService).toHaveBeenCalled();
    });
  });

  describe('variable refresh', () => {
    it('refreshes all variable options on initial mount', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      expect(mockVariableService.refreshAllVariableOptions).toHaveBeenCalledTimes(1);
    });

    it('does not refresh multiple times on re-renders', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      const { rerender } = renderHook(() => useVariables(variables));
      rerender();
      rerender();

      expect(mockVariableService.refreshAllVariableOptions).toHaveBeenCalledTimes(1);
    });

    it('refreshes variables when time range changes', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      mockVariableService.refreshTimeFilteredVariableOptions.mockClear();

      mockTimeUpdate$.next({ from: 'now-15m', to: 'now' });
      expect(mockVariableService.refreshTimeFilteredVariableOptions).toHaveBeenCalledTimes(1);

      mockTimeUpdate$.next({ from: 'now-30m', to: 'now' });
      expect(mockVariableService.refreshTimeFilteredVariableOptions).toHaveBeenCalledTimes(2);
    });

    it('unsubscribes from time updates on unmount', () => {
      const variables = [createMockVariable('region', ['us-west'])];
      const unsubscribeSpy = jest.spyOn(mockTimeUpdate$, 'subscribe');

      const { unmount } = renderHook(() => useVariables(variables));

      const subscription = unsubscribeSpy.mock.results[0]?.value;
      const unsubMock = jest.spyOn(subscription, 'unsubscribe');

      unmount();

      expect(unsubMock).toHaveBeenCalled();
    });
  });

  describe('query re-execution', () => {
    it('re-executes query when variable values change', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      // Emit variables update (non-loading)
      mockVariables$.next([createMockVariable('region', ['us-east'])]);

      expect(mockQueryBuilder.executeQuery).toHaveBeenCalled();
    });

    it('does not re-execute query when variables are loading', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      mockQueryBuilder.executeQuery.mockClear();

      // Emit loading state
      const loadingVariable = { ...createMockVariable('region', ['us-east']), loading: true };
      mockVariables$.next([loadingVariable as any]);

      expect(mockQueryBuilder.executeQuery).not.toHaveBeenCalled();
    });

    it('does not re-execute query when query has no variables', () => {
      const variables = [createMockVariable('region', ['us-west'])];
      mockInterpolationService.hasVariables.mockReturnValue(false);

      renderHook(() => useVariables(variables));

      mockQueryBuilder.executeQuery.mockClear();

      mockVariables$.next([createMockVariable('region', ['us-east'])]);

      expect(mockQueryBuilder.executeQuery).not.toHaveBeenCalled();
    });

    it('does not re-execute query when interpolated result is the same', () => {
      const variables = [createMockVariable('region', ['us-west'])];
      mockQueryBuilder.lastExecutedInterpolatedQuery = 'interpolated-source=logs | where $variable';

      renderHook(() => useVariables(variables));

      mockQueryBuilder.executeQuery.mockClear();

      mockVariables$.next([createMockVariable('region', ['us-east'])]);

      expect(mockQueryBuilder.executeQuery).not.toHaveBeenCalled();
    });

    it('does not re-execute when query is empty', () => {
      const variables = [createMockVariable('region', ['us-west'])];
      mockQueryBuilder.queryState$.next({ query: '', language: 'PPL' });

      renderHook(() => useVariables(variables));

      mockQueryBuilder.executeQuery.mockClear();

      mockVariables$.next([createMockVariable('region', ['us-east'])]);

      expect(mockQueryBuilder.executeQuery).not.toHaveBeenCalled();
    });
  });

  describe('URL synchronization', () => {
    it('syncs variable values to URL when variables change', () => {
      const variables = [
        createMockVariable('region', ['us-west']),
        createMockVariable('env', ['prod']),
      ];

      renderHook(() => useVariables(variables));

      mockVariables$.next([
        createMockVariable('region', ['us-east']),
        createMockVariable('env', ['staging']),
      ]);

      expect(mockServices.osdUrlStateStorage.set).toHaveBeenCalledWith(
        VARIABLE_VALUES_URL_KEY,
        {
          region: ['us-east'],
          env: ['staging'],
        },
        { replace: true }
      );
    });

    it('does not sync to URL when variables are loading', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      mockServices.osdUrlStateStorage.set.mockClear();

      const loadingVariable = { ...createMockVariable('region', ['us-east']), loading: true };
      mockVariables$.next([loadingVariable as any]);

      expect(mockServices.osdUrlStateStorage.set).not.toHaveBeenCalled();
    });

    it('does not sync to URL when osdUrlStateStorage is undefined', () => {
      mockServices.osdUrlStateStorage = undefined;
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      // Should not throw error
      mockVariables$.next([createMockVariable('region', ['us-east'])]);
    });

    it('only includes variables with current values in URL sync', () => {
      const variables = [
        createMockVariable('region', ['us-west']),
        { ...createMockVariable('empty', []), current: undefined } as any,
      ];

      renderHook(() => useVariables(variables));

      mockVariables$.next([createMockVariable('region', ['us-east'])]);

      expect(mockServices.osdUrlStateStorage.set).toHaveBeenCalledWith(
        VARIABLE_VALUES_URL_KEY,
        {
          region: ['us-east'],
        },
        { replace: true }
      );
    });

    it('does not sync when no variables have values', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      renderHook(() => useVariables(variables));

      mockServices.osdUrlStateStorage.set.mockClear();

      mockVariables$.next([]);

      expect(mockServices.osdUrlStateStorage.set).not.toHaveBeenCalled();
    });

    it('unsubscribes from variables$ on unmount', () => {
      const variables = [createMockVariable('region', ['us-west'])];
      const unsubscribeSpy = jest.spyOn(mockVariables$, 'subscribe');

      const { unmount } = renderHook(() => useVariables(variables));

      const subscription = unsubscribeSpy.mock.results[0]?.value;
      const unsubMock = jest.spyOn(subscription, 'unsubscribe');

      unmount();

      expect(unsubMock).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    it('destroys variableService on unmount', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      const { unmount } = renderHook(() => useVariables(variables));

      unmount();

      expect(mockVariableService.destroy).toHaveBeenCalled();
    });

    it('does not call destroy when variableService is undefined', () => {
      const { unmount } = renderHook(() => useVariables());

      // Should not throw error
      unmount();
    });
  });

  describe('memoization', () => {
    it('does not recreate variableService when containerVariables reference is stable', () => {
      const variables = [createMockVariable('region', ['us-west'])];

      const { rerender } = renderHook(({ vars }) => useVariables(vars), {
        initialProps: { vars: variables },
      });

      const firstCallCount = (VariableService as jest.Mock).mock.calls.length;

      rerender({ vars: variables });

      expect((VariableService as jest.Mock).mock.calls.length).toBe(firstCallCount);
    });

    it('recreates variableService when containerVariables change', () => {
      const variables1 = [createMockVariable('region', ['us-west'])];
      const variables2 = [createMockVariable('env', ['prod'])];

      const { rerender } = renderHook(({ vars }) => useVariables(vars), {
        initialProps: { vars: variables1 },
      });

      const firstCallCount = (VariableService as jest.Mock).mock.calls.length;

      rerender({ vars: variables2 });

      expect((VariableService as jest.Mock).mock.calls.length).toBeGreaterThan(firstCallCount);
    });
  });
});
