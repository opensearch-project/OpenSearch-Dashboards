/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadQueryActionCreator } from './load_query';
import { runQueryActionCreator } from '../run_query';
import { clearLastExecutedData } from '../../../slices';
import { ExploreServices } from '../../../../../../types';
import { AppDispatch } from '../../../store';

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
  let mockServices: ExploreServices;
  let mockSetEditorTextWithQuery: jest.Mock;
  const testQuery = '| where field="b"';

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn().mockResolvedValue(undefined) as jest.MockedFunction<AppDispatch>;

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
    await actionCreator(mockDispatch);
    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(testQuery);
  });

  it('should dispatch clearLastExecutedData first', async () => {
    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );
    await actionCreator(mockDispatch);
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
    await actionCreator(mockDispatch);

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
    await actionCreator(mockDispatch);

    expect(calls).toEqual(['clearLastExecutedData', 'setEditorTextWithQuery', 'runQuery']);
  });
});
