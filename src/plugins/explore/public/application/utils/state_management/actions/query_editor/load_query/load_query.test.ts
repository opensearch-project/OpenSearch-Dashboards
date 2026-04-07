/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadQueryActionCreator } from './load_query';
import { runQueryActionCreator } from '../run_query';
import { clearLastExecutedData } from '../../../slices';
import { QueryExecutionStatus, QueryResultStatus } from '../../../types';
import { ExploreServices } from '../../../../../../types';
import { AppDispatch, RootState } from '../../../store';

jest.mock('../run_query', () => ({
  runQueryActionCreator: jest.fn(),
}));

jest.mock('../../../slices', () => ({
  clearLastExecutedData: jest.fn(),
}));

const mockRunQueryActionCreator = runQueryActionCreator as jest.MockedFunction<
  typeof runQueryActionCreator
>;
const mockClearLastExecutedData = clearLastExecutedData as jest.MockedFunction<
  typeof clearLastExecutedData
>;

describe('loadQueryActionCreator', () => {
  let mockDispatch: jest.MockedFunction<AppDispatch>;
  let mockGetState: jest.MockedFunction<() => RootState>;
  let mockServices: ExploreServices;
  let mockSetEditorTextWithQuery: jest.Mock;
  const testQuery = '| where field="b"';

  const makeOverallQueryStatus = (
    status: QueryExecutionStatus,
    error?: QueryResultStatus['error']
  ): QueryResultStatus => ({
    status,
    elapsedMs: undefined,
    startTime: undefined,
    error,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<AppDispatch>;
    mockGetState = jest.fn().mockReturnValue({
      queryEditor: {
        overallQueryStatus: makeOverallQueryStatus(QueryExecutionStatus.READY),
      },
    } as RootState) as jest.MockedFunction<() => RootState>;

    mockServices = {
      data: {},
      uiSettings: {},
      savedObjects: {},
      indexPatterns: {},
    } as ExploreServices;

    mockSetEditorTextWithQuery = jest.fn();

    mockRunQueryActionCreator.mockReturnValue(jest.fn() as any);
    mockClearLastExecutedData.mockReturnValue({
      type: 'queryEditor/clearLastExecutedData',
      payload: undefined,
    } as any);
  });

  it('should call setEditorTextWithQuery with the provided query', async () => {
    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    await actionCreator(mockDispatch, mockGetState);
    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(testQuery);
  });

  it('should dispatch clearLastExecutedData first', async () => {
    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    await actionCreator(mockDispatch, mockGetState);
    expect(mockDispatch).toHaveBeenCalledWith(mockClearLastExecutedData());
  });

  it('should dispatch runQueryActionCreator with services and query', async () => {
    const mockRunAction = jest.fn();
    mockRunQueryActionCreator.mockReturnValue(mockRunAction);

    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    await actionCreator(mockDispatch, mockGetState);

    expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testQuery);
    expect(mockDispatch).toHaveBeenCalledWith(mockRunAction);
  });

  it('should execute actions in the correct order', async () => {
    const calls: string[] = [];
    const mockRunAction = jest.fn();
    mockRunQueryActionCreator.mockReturnValue(mockRunAction);

    mockSetEditorTextWithQuery.mockImplementation(() => {
      calls.push('setEditorTextWithQuery');
    });

    mockDispatch.mockImplementation(async (action: any) => {
      if (action && action.type === 'queryEditor/clearLastExecutedData') {
        calls.push('clearLastExecutedData');
      } else if (typeof action === 'function') {
        calls.push('runQuery');
      }
    });

    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    await actionCreator(mockDispatch, mockGetState);

    expect(calls).toEqual(['clearLastExecutedData', 'setEditorTextWithQuery', 'runQuery']);
  });

  it('should return overallQueryStatus after execution completes', async () => {
    const expectedStatus = makeOverallQueryStatus(QueryExecutionStatus.READY);
    mockGetState.mockReturnValue({
      queryEditor: { overallQueryStatus: expectedStatus },
    } as RootState);

    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    const result = await actionCreator(mockDispatch, mockGetState);

    expect(result).toEqual(expectedStatus);
  });

  it('should return ERROR status from Redux state when query fails', async () => {
    // createAsyncThunk catches errors internally - dispatch never throws for query errors.
    // The error is stored in Redux state and returned via overallQueryStatus.
    const errorStatus = makeOverallQueryStatus(QueryExecutionStatus.ERROR, {
      statusCode: 400,
      error: 'Bad Request',
      message: { type: 'SyntaxError', details: 'Invalid syntax', reason: 'Parse error' },
      originalErrorMessage: 'Invalid syntax',
    });
    mockGetState.mockReturnValue({
      queryEditor: { overallQueryStatus: errorStatus },
    } as RootState);

    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    const result = await actionCreator(mockDispatch, mockGetState);

    expect(result.status).toBe(QueryExecutionStatus.ERROR);
    expect(result.error?.message?.type).toBe('SyntaxError');
  });

  it('should return NO_RESULTS status when query succeeds with no data', async () => {
    const noResultsStatus = makeOverallQueryStatus(QueryExecutionStatus.NO_RESULTS);
    mockGetState.mockReturnValue({
      queryEditor: { overallQueryStatus: noResultsStatus },
    } as RootState);

    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    const result = await actionCreator(mockDispatch, mockGetState);

    expect(result.status).toBe(QueryExecutionStatus.NO_RESULTS);
  });

  it('should await runQueryActionCreator before reading state', async () => {
    const callOrder: string[] = [];

    (mockDispatch as jest.Mock).mockImplementation(async (action: any) => {
      if (typeof action === 'function') {
        callOrder.push('runQuery dispatched');
        await Promise.resolve();
        callOrder.push('runQuery resolved');
      }
    });

    mockGetState.mockImplementation(() => {
      callOrder.push('getState called');
      return {
        queryEditor: {
          overallQueryStatus: makeOverallQueryStatus(QueryExecutionStatus.READY),
        },
      } as RootState;
    });

    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    await actionCreator(mockDispatch, mockGetState);

    const runQueryIdx = callOrder.indexOf('runQuery resolved');
    const getStateIdx = callOrder.indexOf('getState called');
    expect(runQueryIdx).toBeLessThan(getStateIdx);
  });
});
