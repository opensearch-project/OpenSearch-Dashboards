/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createTimefilterSyncMiddleware } from './timefilter_sync_middleware';
import { createMockExploreServices, createMockStore, MockStore } from '../__mocks__';

describe('createTimefilterSyncMiddleware', () => {
  let mockServices: ReturnType<typeof createMockExploreServices>;
  let mockStore: MockStore;
  let mockNext: jest.MockedFunction<(action: any) => any>;
  let middleware: (action: any) => any;

  beforeEach(() => {
    mockServices = createMockExploreServices();
    // Add setTime method to the timefilter mock
    mockServices.data.query.timefilter.timefilter.setTime = jest.fn();

    mockStore = createMockStore({
      // @ts-expect-error TS2741 TODO(ts-error): fixme
      queryEditor: {
        queryStatusMap: {},
        overallQueryStatus: {
          status: 'UNINITIALIZED' as any,
          elapsedMs: undefined,
          startTime: undefined,
        },
        editorMode: 'CODE' as any,
        promptModeIsAvailable: false,
        promptToQueryIsLoading: false,
        summaryAgentIsAvailable: false,
        lastExecutedPrompt: '',
        lastExecutedTranslatedQuery: '',
        queryExecutionButtonStatus: 'REFRESH',
        dateRange: { from: 'now-1h', to: 'now' },
        isQueryEditorDirty: false,
      },
    });

    mockNext = jest.fn().mockImplementation((action) => action);
    middleware = createTimefilterSyncMiddleware(mockServices)(mockStore)(mockNext);
  });

  describe('query execution actions', () => {
    it('should sync timefilter when executeQueries action is dispatched', () => {
      const action = { type: 'query/executeQueries/pending', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: 'now-1h',
        to: 'now',
      });
    });

    it('should sync timefilter when executeHistogramQuery action is dispatched', () => {
      const action = { type: 'query/executeHistogramQuery/fulfilled', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: 'now-1h',
        to: 'now',
      });
    });

    it('should sync timefilter when executeTabQuery action is dispatched', () => {
      const action = { type: 'query/executeTabQuery/rejected', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: 'now-1h',
        to: 'now',
      });
    });

    it('should sync timefilter for any phase of query execution actions', () => {
      const pendingAction = { type: 'query/executeQueries/pending', payload: {} };
      const fulfilledAction = { type: 'query/executeQueries/fulfilled', payload: {} };
      const rejectedAction = { type: 'query/executeQueries/rejected', payload: {} };

      middleware(pendingAction);
      middleware(fulfilledAction);
      middleware(rejectedAction);

      expect(mockNext).toHaveBeenCalledTimes(3);
      // All phases should trigger sync
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledTimes(3);
    });

    it('should work with custom action types that include query execution types', () => {
      const action = { type: 'custom/query/executeQueries/custom', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: 'now-1h',
        to: 'now',
      });
    });
  });

  describe('dateRange synchronization', () => {
    it('should not sync when dateRange is undefined', () => {
      mockStore.getState = jest.fn().mockReturnValue({
        queryEditor: {
          dateRange: undefined,
        },
      });

      const action = { type: 'query/executeQueries/pending', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('should not sync when dateRange is null', () => {
      mockStore.getState = jest.fn().mockReturnValue({
        queryEditor: {
          dateRange: null,
        },
      });

      const action = { type: 'query/executeQueries/pending', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('should not sync when dateRange equals current timefilter range', () => {
      // Mock getTime to return the same range as Redux state
      mockServices.data.query.timefilter.timefilter.getTime = jest
        .fn()
        .mockReturnValue({ from: 'now-1h', to: 'now' });

      const action = { type: 'query/executeQueries/pending', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('should sync when dateRange differs from current timefilter range', () => {
      // Mock getTime to return a different range
      mockServices.data.query.timefilter.timefilter.getTime = jest
        .fn()
        .mockReturnValue({ from: 'now-15m', to: 'now' });

      const action = { type: 'query/executeQueries/pending', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: 'now-1h',
        to: 'now',
      });
    });

    it('should handle complex dateRange objects', () => {
      const complexDateRange = {
        from: '2023-01-01T00:00:00.000Z',
        to: '2023-01-02T00:00:00.000Z',
        mode: 'absolute',
      };

      mockStore.getState = jest.fn().mockReturnValue({
        queryEditor: {
          dateRange: complexDateRange,
        },
      });

      // Mock getTime to return a different range
      mockServices.data.query.timefilter.timefilter.getTime = jest
        .fn()
        .mockReturnValue({ from: 'now-15m', to: 'now' });

      const action = { type: 'query/executeQueries/pending', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith(
        complexDateRange
      );
    });
  });

  describe('error handling', () => {
    it('should handle missing timefilter service gracefully', () => {
      mockServices.data.query.timefilter = undefined as any;

      const action = { type: 'query/executeQueries/pending', payload: {} };

      expect(() => middleware(action)).not.toThrow();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should handle missing timefilter.timefilter gracefully', () => {
      mockServices.data.query.timefilter.timefilter = undefined as any;

      const action = { type: 'query/executeQueries/pending', payload: {} };

      expect(() => middleware(action)).not.toThrow();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should handle missing data service gracefully', () => {
      mockServices.data = undefined as any;

      const action = { type: 'query/executeQueries/pending', payload: {} };

      expect(() => middleware(action)).not.toThrow();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should handle missing query service gracefully', () => {
      mockServices.data.query = undefined as any;

      const action = { type: 'query/executeQueries/pending', payload: {} };

      expect(() => middleware(action)).not.toThrow();
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should allow getTime errors to bubble up', () => {
      mockServices.data.query.timefilter.timefilter.getTime = jest.fn().mockImplementation(() => {
        throw new Error('getTime failed');
      });

      const action = { type: 'query/executeQueries/pending', payload: {} };

      expect(() => middleware(action)).toThrow('getTime failed');
      expect(mockNext).toHaveBeenCalledWith(action);
    });

    it('should allow setTime errors to bubble up', () => {
      mockServices.data.query.timefilter.timefilter.getTime = jest
        .fn()
        .mockReturnValue({ from: 'now-15m', to: 'now' });

      mockServices.data.query.timefilter.timefilter.setTime = jest.fn().mockImplementation(() => {
        throw new Error('setTime failed');
      });

      const action = { type: 'query/executeQueries/pending', payload: {} };

      expect(() => middleware(action)).toThrow('setTime failed');
      expect(mockNext).toHaveBeenCalledWith(action);
    });
  });

  describe('non-query actions', () => {
    it('should not process dateRange actions', () => {
      const action = { type: 'queryEditor/setDateRange', payload: { from: 'now-2h', to: 'now' } };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('should not process other slice actions', () => {
      const action = { type: 'ui/setShowFilterPanel', payload: true };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('should not process unrelated actions', () => {
      const action = { type: 'some/otherAction', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });

    it('should not process actions that partially match query types', () => {
      const action = { type: 'executeQueries', payload: {} }; // Missing 'query/' prefix

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });
  });

  describe('action type matching', () => {
    it('should use includes() to match action types flexibly', () => {
      // Test that it works with custom action types that include the base type
      const action = { type: 'custom/query/executeQueries/pending', payload: {} };

      middleware(action);

      expect(mockNext).toHaveBeenCalledWith(action);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledWith({
        from: 'now-1h',
        to: 'now',
      });
    });

    it('should match all supported query execution action types', () => {
      const actions = [
        { type: 'query/executeQueries/pending', payload: {} },
        { type: 'query/executeHistogramQuery/fulfilled', payload: {} },
        { type: 'query/executeTabQuery/rejected', payload: {} },
        { type: 'custom/query/executeQueries/custom', payload: {} },
        { type: 'prefix/query/executeHistogramQuery/suffix', payload: {} },
        { type: 'nested/query/executeTabQuery/nested/action', payload: {} },
      ];

      actions.forEach((action) => {
        middleware(action);
      });

      expect(mockNext).toHaveBeenCalledTimes(actions.length);
      expect(mockServices.data.query.timefilter.timefilter.setTime).toHaveBeenCalledTimes(
        actions.length
      );
    });

    it('should not match similar but different action types', () => {
      const actions = [
        { type: 'executeQueries', payload: {} }, // Missing query/ prefix
        { type: 'query/execute', payload: {} }, // Incomplete type
        { type: 'query/executeQuery', payload: {} }, // Different type
        { type: 'queryexecuteQueries', payload: {} }, // Missing separator
      ];

      actions.forEach((action) => {
        middleware(action);
      });

      expect(mockNext).toHaveBeenCalledTimes(actions.length);
      expect(mockServices.data.query.timefilter.timefilter.setTime).not.toHaveBeenCalled();
    });
  });

  describe('middleware execution order', () => {
    it('should call next() before processing timefilter sync', () => {
      const action = { type: 'query/executeQueries/pending', payload: {} };
      const callOrder: string[] = [];

      mockNext.mockImplementation((actionParam) => {
        callOrder.push('next');
        return actionParam;
      });

      mockServices.data.query.timefilter.timefilter.setTime = jest.fn().mockImplementation(() => {
        callOrder.push('setTime');
      });

      middleware(action);

      expect(callOrder).toEqual(['next', 'setTime']);
    });

    it('should return the result from next()', () => {
      const action = { type: 'query/executeQueries/pending', payload: {} };
      const expectedResult = { modified: true };

      mockNext.mockReturnValue(expectedResult);

      const result = middleware(action);

      expect(result).toBe(expectedResult);
    });
  });
});
