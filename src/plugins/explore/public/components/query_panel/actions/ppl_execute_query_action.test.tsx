/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';

// Mock functions - defined BEFORE jest.mock calls
const mockDispatch = jest.fn();
const mockUseAssistantAction = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();
const mockGetState = jest.fn();
const mockLoadQueryActionCreator = jest.fn();
const mockPrepareQueryForLanguage = jest.fn();

// Mock modules with functions that reference the mock variables
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

jest.mock('../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({
    services: {
      data: { query: { queryString: { getQuery: jest.fn() } } },
      notifications: { toasts: { addSuccess: jest.fn(), addError: jest.fn() } },
      store: {
        getState: mockGetState,
      },
      contextProvider: {
        hooks: {
          useAssistantAction: mockUseAssistantAction,
        },
      },
    },
  }),
}));

jest.mock('../../../application/utils/state_management/actions/query_editor/load_query', () => ({
  loadQueryActionCreator: (...args: any[]) => mockLoadQueryActionCreator(...args),
}));

jest.mock('../../../application/utils/languages', () => ({
  prepareQueryForLanguage: (...args: any[]) => mockPrepareQueryForLanguage(...args),
}));

jest.mock('../../../application/utils/state_management/types', () => ({
  QueryExecutionStatus: {
    UNINITIALIZED: 'uninitialized',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error',
    NO_RESULTS: 'no_results',
  },
  EditorMode: {
    Query: 'query',
    Prompt: 'prompt',
  },
}));

jest.mock('../../../application/hooks', () => ({
  useSetEditorTextWithQuery: jest.fn(),
}));

// Import modules AFTER mocks are defined
import { QueryExecutionStatus } from '../../../application/utils/state_management/types';
import {
  usePPLExecuteQueryAction,
  PPL_QUERY_EXECUTION_TIMEOUT_MS,
  PPL_QUERY_POLL_INTERVAL_MS,
} from './ppl_execute_query_action';

describe('usePPLExecuteQueryAction', () => {
  // Track the call count at the start of each test
  let initialCallCount: number;

  beforeEach(() => {
    // Use fake timers with legacy mode for React 18 compatibility
    jest.useFakeTimers({ legacyFakeTimers: true });

    // Track the initial call count (don't clear, just track)
    initialCallCount = mockUseAssistantAction.mock.calls.length;

    // Reset specific mocks that need fresh state
    mockDispatch.mockClear();
    mockSetEditorTextWithQuery.mockClear();
    mockGetState.mockClear();
    mockLoadQueryActionCreator.mockClear();
    mockPrepareQueryForLanguage.mockClear();

    // Configure default implementations
    mockLoadQueryActionCreator.mockReturnValue({ type: 'LOAD_QUERY' });
    mockPrepareQueryForLanguage.mockReturnValue({ query: 'test-cache-key' });
    mockGetState.mockReturnValue({
      query: { dataSource: 'test-source' },
      queryEditor: { queryStatusMap: {} },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // Helper to render hook and get handler
  const renderAndGetHandler = () => {
    act(() => {
      renderHook(() => usePPLExecuteQueryAction(mockSetEditorTextWithQuery));
    });
    // Check that a new call was made since the test started
    const currentCallCount = mockUseAssistantAction.mock.calls.length;
    expect(currentCallCount).toBeGreaterThan(initialCallCount);
    // Get the latest call's handler
    return mockUseAssistantAction.mock.calls[currentCallCount - 1][0].handler;
  };

  it('should register assistant action with correct configuration', () => {
    renderAndGetHandler();

    const latestCall =
      mockUseAssistantAction.mock.calls[mockUseAssistantAction.mock.calls.length - 1][0];
    expect(latestCall).toMatchObject({
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

  it('should execute query by default and wait for successful completion', async () => {
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    // Mock successful query execution
    mockGetState.mockReturnValue({
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
    jest.runAllTimers();
    const result = await resultPromise;

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOAD_QUERY' });
    expect(result).toEqual({
      success: true,
      executed: true,
      query: 'source=logs | head 10',
      message: 'Query updated and executed successfully',
    });
  });

  it('should handle query errors when autoExecute is true', async () => {
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10', autoExecute: true };

    mockGetState.mockReturnValue({
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
    const handler = renderAndGetHandler();
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
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    mockGetState.mockReturnValue({
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
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };
    const error = new Error('Test error');

    mockLoadQueryActionCreator.mockImplementation(() => {
      throw error;
    });

    const result = await handler(args);

    expect(result).toEqual({
      success: false,
      error: 'Test error',
      query: 'source=logs | head 10',
    });
  });

  it('should handle query with NO_RESULTS status as success', async () => {
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    mockGetState.mockReturnValue({
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
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    let callCount = 0;
    mockGetState.mockImplementation(() => {
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
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

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
  });

  it('should handle UNINITIALIZED status as timeout', async () => {
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    mockGetState.mockReturnValue({
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
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    mockGetState.mockReturnValue({
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

  it('should use prepareQueryForLanguage to generate cache key', async () => {
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | where status="error"' };

    mockGetState.mockReturnValue({
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

    expect(mockPrepareQueryForLanguage).toHaveBeenCalledWith({
      dataSource: 'test-source',
      timeRange: { from: 'now-1h', to: 'now' },
      query: 'source=logs | where status="error"',
    });
  });

  it('should respect polling interval when waiting for query status', async () => {
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    let pollCount = 0;
    mockGetState.mockImplementation(() => {
      pollCount++;
      if (pollCount <= 2) {
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
    jest.advanceTimersByTime(PPL_QUERY_POLL_INTERVAL_MS * 2);
    const result = await resultPromise;

    expect(result.success).toBe(true);
    expect(pollCount).toBeGreaterThan(1);
  });

  it('should handle query status transitions correctly', async () => {
    const handler = renderAndGetHandler();
    const args = { query: 'source=logs | head 10' };

    let callCount = 0;
    mockGetState.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return {
            query: { dataSource: 'test-source' },
            queryEditor: { queryStatusMap: {} },
          };
        case 2:
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

  it('should work with all dependencies (integration)', () => {
    renderAndGetHandler();
    const currentCallCount = mockUseAssistantAction.mock.calls.length;
    expect(currentCallCount).toBeGreaterThan(initialCallCount);
  });
});
