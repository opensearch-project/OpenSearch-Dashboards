/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import {
  usePPLExecuteQueryAction,
  PPL_QUERY_EXECUTION_TIMEOUT_MS,
  PPL_QUERY_POLL_INTERVAL_MS,
} from './ppl_execute_query_action';
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { loadQueryActionCreator } from '../../../application/utils/state_management/actions/query_editor/load_query';
import { prepareQueryForLanguage } from '../../../application/utils/languages';
import { useDispatch } from 'react-redux';

// Mock dependencies
const mockUseAssistantAction = jest.fn();

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../../../application/utils/state_management/actions/query_editor/load_query', () => ({
  loadQueryActionCreator: jest.fn(),
}));

jest.mock('../../../application/utils/languages', () => ({
  prepareQueryForLanguage: jest.fn(),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));

jest.mock('../../../application/utils/state_management/types', () => ({
  QueryExecutionStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error',
    NO_RESULTS: 'no_results',
  },
}));

jest.mock('../../../application/hooks', () => ({
  useSetEditorTextWithQuery: jest.fn(),
}));

// Mock timers
jest.useFakeTimers();

describe('usePPLExecuteQueryAction', () => {
  let mockSetEditorTextWithQuery: jest.Mock;
  let mockServices: any;
  let mockStore: any;
  let mockUseOpenSearchDashboards: jest.Mock;
  let mockLoadQueryActionCreator: jest.Mock;
  let mockUseDispatch: jest.Mock;
  let mockPrepareQueryForLanguage: jest.Mock;
  let mockDispatch: jest.Mock;

  beforeEach(() => {
    // Get the mocked functions
    mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;
    mockLoadQueryActionCreator = loadQueryActionCreator as jest.Mock;
    mockPrepareQueryForLanguage = prepareQueryForLanguage as jest.Mock;
    mockUseDispatch = useDispatch as jest.Mock;
    mockDispatch = jest.fn();

    // Mock store state
    mockStore = {
      getState: jest.fn(() => ({
        query: { dataSource: 'test-source' },
        queryEditor: {
          queryStatusMap: {},
        },
      })),
    };

    // Mock services with contextProvider dependency injection and store
    mockServices = {
      data: { query: { queryString: { getQuery: jest.fn() } } },
      notifications: { toasts: { addSuccess: jest.fn(), addError: jest.fn() } },
      store: mockStore,
      contextProvider: {
        hooks: {
          useAssistantAction: mockUseAssistantAction,
        },
      },
    };

    // Setup mocks
    mockUseOpenSearchDashboards.mockReturnValue({ services: mockServices });
    mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    mockPrepareQueryForLanguage.mockReturnValue({ query: 'test-cache-key' });
    mockSetEditorTextWithQuery = jest.fn();
    mockUseDispatch.mockReturnValue(mockDispatch);
    mockUseAssistantAction.mockClear();

    // Clear timers before each test
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  it('should register assistant action with correct configuration', () => {
    renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));

    expect(mockUseAssistantAction).toHaveBeenCalledWith({
      name: 'execute_ppl_query',
      description: 'Update the query bar with a PPL query and optionally execute it',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'The PPL query to set in the query bar',
          },
          autoExecute: {
            type: 'boolean',
            description: 'Whether to automatically execute the query (default: true)',
          },
          description: {
            type: 'string',
            description: 'Optional description of what the query does',
          },
        },
        required: ['query'],
      },
      handler: expect.any(Function),
    });
  });

  it('should export correct constants', () => {
    expect(PPL_QUERY_EXECUTION_TIMEOUT_MS).toBe(10000);
    expect(PPL_QUERY_POLL_INTERVAL_MS).toBe(1000);
  });

  describe('handler function', () => {
    let handler: (args: any) => Promise<any>;

    beforeEach(() => {
      renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
      // Get the handler from the mock call
      if (mockUseAssistantAction.mock.calls.length > 0) {
        handler = mockUseAssistantAction.mock.calls[0][0].handler;
      }
    });

    it('should execute query by default (autoExecute: true) and wait for successful completion', async () => {
      const args = { query: 'source=logs | head 10' };

      // Mock successful query execution
      mockStore.getState.mockReturnValue({
        query: { dataSource: 'test-source' },
        queryEditor: {
          queryStatusMap: {
            'test-cache-key': {
              status: QueryExecutionStatus.READY,
            },
          },
        },
      });

      const resultPromise = handler(args);

      // Simulate immediate completion
      jest.runAllTimers();
      const result = await resultPromise;

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_QUERY' });
      expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
        mockServices,
        mockSetEditorTextWithQuery,
        'source=logs | head 10'
      );
      expect(result).toEqual({
        success: true,
        executed: true,
        query: 'source=logs | head 10',
        message: 'Query updated and executed successfully',
      });
    });

    it('should execute query when autoExecute is explicitly true and handle query errors', async () => {
      const args = { query: 'source=logs | head 10', autoExecute: true };

      // Mock failed query execution
      mockStore.getState.mockReturnValue({
        query: { dataSource: 'test-source' },
        queryEditor: {
          queryStatusMap: {
            'test-cache-key': {
              status: QueryExecutionStatus.ERROR,
              error: {
                message: {
                  details: 'Invalid syntax',
                  reason: 'Parse error',
                  type: 'SyntaxError',
                },
              },
            },
          },
        },
      });

      const resultPromise = handler(args);
      jest.runAllTimers();
      const result = await resultPromise;

      expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_QUERY' });
      expect(result).toEqual({
        success: false,
        executed: false,
        query: 'source=logs | head 10',
        message: 'Query execution failed: Parse error',
        error: 'SyntaxError: Invalid syntax',
      });
    });

    it('should only update editor when autoExecute is false', async () => {
      const args = { query: 'source=logs | head 10', autoExecute: false };

      const result = await handler(args);

      expect(mockDispatch).not.toHaveBeenCalled();
      expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith('source=logs | head 10');
      expect(result).toEqual({
        success: true,
        executed: false,
        query: 'source=logs | head 10',
        message: 'Query updated',
      });
    });

    it('should handle query execution timeout', async () => {
      const args = { query: 'source=logs | head 10' };

      // Mock query that stays in loading state
      mockStore.getState.mockReturnValue({
        query: { dataSource: 'test-source' },
        queryEditor: {
          queryStatusMap: {
            'test-cache-key': {
              status: QueryExecutionStatus.LOADING,
            },
          },
        },
      });

      const resultPromise = handler(args);

      // Fast-forward past the timeout
      jest.advanceTimersByTime(PPL_QUERY_EXECUTION_TIMEOUT_MS + 1000);
      const result = await resultPromise;

      expect(result).toEqual({
        success: false,
        executed: false,
        query: 'source=logs | head 10',
        message: 'Query execution timed out',
        error: 'Query execution took too long to complete',
      });
    });

    it('should handle errors gracefully', async () => {
      const args = { query: 'source=logs | head 10' };
      const error = new Error('Test error');

      // Mock loadQueryActionCreator to throw an error
      mockLoadQueryActionCreator.mockImplementation(() => {
        throw error;
      });

      const result = await handler(args);

      expect(result).toEqual({
        success: false,
        error: 'Test error',
        query: 'source=logs | head 10',
      });

      // Reset the mock
      mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    });

    it('should handle query with NO_RESULTS status as success', async () => {
      const args = { query: 'source=logs | head 10' };

      // Mock query that completes with no results
      mockStore.getState.mockReturnValue({
        query: { dataSource: 'test-source' },
        queryEditor: {
          queryStatusMap: {
            'test-cache-key': {
              status: QueryExecutionStatus.NO_RESULTS,
            },
          },
        },
      });

      const resultPromise = handler(args);
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result).toEqual({
        success: true,
        executed: true,
        query: 'source=logs | head 10',
        message: 'Query updated and executed successfully',
      });
    });

    it('should wait for query status to appear in the store', async () => {
      const args = { query: 'source=logs | head 10' };

      // Initially no status, then becomes ready
      let callCount = 0;
      mockStore.getState.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            query: { dataSource: 'test-source' },
            queryEditor: { queryStatusMap: {} },
          };
        }
        return {
          query: { dataSource: 'test-source' },
          queryEditor: {
            queryStatusMap: {
              'test-cache-key': {
                status: QueryExecutionStatus.READY,
              },
            },
          },
        };
      });

      const resultPromise = handler(args);
      jest.runAllTimers();
      const result = await resultPromise;

      expect(result.success).toBe(true);
    });

    it('should handle non-Error exceptions', async () => {
      const args = { query: 'source=logs | head 10' };

      // Mock loadQueryActionCreator to throw a non-Error (string)
      mockLoadQueryActionCreator.mockImplementation(() => {
        // eslint-disable-next-line no-throw-literal
        throw 'String error';
      });

      const result = await handler(args);

      expect(result).toEqual({
        success: false,
        error: 'Unknown error',
        query: 'source=logs | head 10',
      });

      // Reset the mock
      mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    });

    describe('waitForQueryExecution behavior', () => {
      it('should handle UNINITIALIZED status as timeout', async () => {
        const args = { query: 'source=logs | head 10' };

        // Mock query with UNINITIALIZED status
        mockStore.getState.mockReturnValue({
          query: { dataSource: 'test-source' },
          queryEditor: {
            queryStatusMap: {
              'test-cache-key': {
                status: QueryExecutionStatus.UNINITIALIZED,
              },
            },
          },
        });

        const resultPromise = handler(args);
        jest.runAllTimers();
        const result = await resultPromise;

        expect(result).toEqual({
          success: false,
          executed: false,
          query: 'source=logs | head 10',
          message: 'Query execution timed out',
          error: 'Query execution took too long to complete',
        });
      });

      it('should handle missing error details in error status', async () => {
        const args = { query: 'source=logs | head 10' };

        // Mock query with error but minimal error info
        mockStore.getState.mockReturnValue({
          query: { dataSource: 'test-source' },
          queryEditor: {
            queryStatusMap: {
              'test-cache-key': {
                status: QueryExecutionStatus.ERROR,
                error: {},
              },
            },
          },
        });

        const resultPromise = handler(args);
        jest.runAllTimers();
        const result = await resultPromise;

        expect(result).toEqual({
          success: false,
          executed: false,
          query: 'source=logs | head 10',
          message: 'Query execution failed: Unknown error',
          error: 'undefined: Query execution failed',
        });
      });

      it('should use defaultPrepareQueryString to generate cache key', async () => {
        const args = { query: 'source=logs | where status="error"' };

        // Mock successful execution
        mockStore.getState.mockReturnValue({
          query: { dataSource: 'test-source', timeRange: { from: 'now-1h', to: 'now' } },
          queryEditor: {
            queryStatusMap: {
              'test-cache-key': {
                status: QueryExecutionStatus.READY,
              },
            },
          },
        });

        const resultPromise = handler(args);
        jest.runAllTimers();
        await resultPromise;

        // Verify that defaultPrepareQueryString was called with the correct query object
        expect(mockPrepareQueryForLanguage).toHaveBeenCalledWith({
          dataSource: 'test-source',
          timeRange: { from: 'now-1h', to: 'now' },
          query: 'source=logs | where status="error"',
        });
      });

      it('should respect polling interval when waiting for query status', async () => {
        const args = { query: 'source=logs | head 10' };

        let pollCount = 0;
        mockStore.getState.mockImplementation(() => {
          pollCount++;
          if (pollCount <= 2) {
            // First 2 calls return no status (still waiting)
            return {
              query: { dataSource: 'test-source' },
              queryEditor: { queryStatusMap: {} },
            };
          }
          // Third call returns ready status
          return {
            query: { dataSource: 'test-source' },
            queryEditor: {
              queryStatusMap: {
                'test-cache-key': {
                  status: QueryExecutionStatus.READY,
                },
              },
            },
          };
        });

        const resultPromise = handler(args);

        // Advance time by polling intervals to trigger the polling
        jest.advanceTimersByTime(PPL_QUERY_POLL_INTERVAL_MS * 2);
        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(pollCount).toBeGreaterThan(1); // Verify multiple polls occurred
      });

      it('should handle query status transitions correctly', async () => {
        const args = { query: 'source=logs | head 10' };

        let callCount = 0;
        mockStore.getState.mockImplementation(() => {
          callCount++;
          switch (callCount) {
            case 1:
              // Initially no status
              return {
                query: { dataSource: 'test-source' },
                queryEditor: { queryStatusMap: {} },
              };
            case 2:
              // Then loading
              return {
                query: { dataSource: 'test-source' },
                queryEditor: {
                  queryStatusMap: {
                    'test-cache-key': {
                      status: QueryExecutionStatus.LOADING,
                    },
                  },
                },
              };
            default:
              // Finally ready
              return {
                query: { dataSource: 'test-source' },
                queryEditor: {
                  queryStatusMap: {
                    'test-cache-key': {
                      status: QueryExecutionStatus.READY,
                    },
                  },
                },
              };
          }
        });

        const resultPromise = handler(args);
        jest.runAllTimers();
        const result = await resultPromise;

        expect(result).toEqual({
          success: true,
          executed: true,
          query: 'source=logs | head 10',
          message: 'Query updated and executed successfully',
        });
      });
    });
  });

  describe('integration', () => {
    it('should work with all dependencies', () => {
      expect(() => {
        renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
      }).not.toThrow();

      expect(mockUseAssistantAction).toHaveBeenCalled();
      expect(mockUseOpenSearchDashboards).toHaveBeenCalled();
    });
  });
});
