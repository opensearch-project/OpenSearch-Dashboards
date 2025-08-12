/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { loadQueryActionCreator } from './load_query';
import { runQueryActionCreator } from '../run_query';
import { clearLastExecutedData } from '../../../slices';
import { ExploreServices } from '../../../../../../types';
import { useSetEditorTextWithQuery } from '../../../../../hooks';
import { AppDispatch } from '../../../store';

// Mock the dependencies
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
  let mockSetEditorTextWithQuery: jest.MockedFunction<ReturnType<typeof useSetEditorTextWithQuery>>;
  const testQuery = '| where field="b"';

  beforeEach(() => {
    jest.clearAllMocks();

    mockDispatch = jest.fn();

    mockServices = {
      data: {},
      uiSettings: {},
      savedObjects: {},
      indexPatterns: {},
    } as ExploreServices;

    mockSetEditorTextWithQuery = jest.fn();

    // Mock return values
    mockRunQueryActionCreator.mockReturnValue(jest.fn());
    mockClearLastExecutedData.mockReturnValue({
      type: 'queryEditor/clearLastExecutedData',
      payload: undefined,
    });
  });

  it('should call setEditorTextWithQuery with the provided query', () => {
    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );

    actionCreator(mockDispatch);

    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(testQuery);
  });

  it('should dispatch runQueryActionCreator with services and query', () => {
    const mockRunAction = jest.fn();
    mockRunQueryActionCreator.mockReturnValue(mockRunAction);

    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );

    actionCreator(mockDispatch);

    expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testQuery);
    expect(mockDispatch).toHaveBeenCalledWith(mockRunAction);
  });

  it('should dispatch clearLastExecutedData first', () => {
    const actionCreator = loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    );

    actionCreator(mockDispatch);

    expect(mockDispatch).toHaveBeenCalledWith(mockClearLastExecutedData());
  });

  it('should execute actions in the correct order', () => {
    const calls: string[] = [];
    const mockRunAction = jest.fn();
    mockRunQueryActionCreator.mockReturnValue(mockRunAction);

    mockSetEditorTextWithQuery.mockImplementation(() => {
      calls.push('setEditorTextWithQuery');
    });

    mockDispatch.mockImplementation((action: any) => {
      if (action.type === 'queryEditor/clearLastExecutedData') {
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

    actionCreator(mockDispatch);

    expect(calls).toEqual(['clearLastExecutedData', 'setEditorTextWithQuery', 'runQuery']);
    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(testQuery);
    expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testQuery);
  });
});
