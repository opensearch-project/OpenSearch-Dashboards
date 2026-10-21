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

  it('only fills the editor when the dataset type requires an explicit Run', async () => {
    const explicitServices = {
      data: {
        query: {
          queryString: {
            getQuery: () => ({ query: '', dataset: undefined }),
            getDatasetService: () => ({
              getType: (type: string) =>
                type === 'EXPLICIT_RUN_TYPE' ? { meta: { requiresExplicitRun: true } } : undefined,
            }),
          },
        },
      },
    } as any;
    const getState = () =>
      ({ query: { dataset: { id: 'd', title: 'd', type: 'EXPLICIT_RUN_TYPE' } } }) as any;

    await loadQueryActionCreator(
      explicitServices,
      mockSetEditorTextWithQuery,
      testQuery
    )(mockDispatch, getState);

    expect(mockSetEditorTextWithQuery).toHaveBeenCalledWith(testQuery);
    expect(mockRunQueryActionCreator).not.toHaveBeenCalled();
  });

  it('waits when either the current or the loaded dataset requires an explicit Run', async () => {
    const explicitServices = {
      data: {
        query: {
          queryString: {
            getQuery: () => ({ query: '', dataset: undefined }),
            getDatasetService: () => ({
              getType: (type: string) =>
                type === 'EXPLICIT_RUN_TYPE' ? { meta: { requiresExplicitRun: true } } : undefined,
            }),
          },
        },
      },
    } as any;
    const ordinaryState = () =>
      ({ query: { dataset: { id: 'i', title: 'i', type: 'INDEX_PATTERN' } } }) as any;
    const explicitState = () =>
      ({ query: { dataset: { id: 'd', title: 'd', type: 'EXPLICIT_RUN_TYPE' } } }) as any;

    // The loaded query's own dataset requires a Run.
    await loadQueryActionCreator(explicitServices, mockSetEditorTextWithQuery, testQuery, {
      type: 'EXPLICIT_RUN_TYPE',
    })(mockDispatch, ordinaryState);
    expect(mockRunQueryActionCreator).not.toHaveBeenCalled();

    // The current dataset (the one the query runs against) requires a Run.
    await loadQueryActionCreator(explicitServices, mockSetEditorTextWithQuery, testQuery, {
      type: 'INDEX_PATTERN',
    })(mockDispatch, explicitState);
    expect(mockRunQueryActionCreator).not.toHaveBeenCalled();

    // Neither does.
    await loadQueryActionCreator(explicitServices, mockSetEditorTextWithQuery, testQuery, {
      type: 'INDEX_PATTERN',
    })(mockDispatch, ordinaryState);
    expect(mockRunQueryActionCreator).toHaveBeenCalledWith(explicitServices, testQuery);
  });

  it('still runs a loaded query of any other dataset type', async () => {
    const getState = () =>
      ({ query: { dataset: { id: 'i', title: 'i', type: 'INDEX_PATTERN' } } }) as any;
    await loadQueryActionCreator(
      mockServices,
      mockSetEditorTextWithQuery,
      testQuery
    )(mockDispatch, getState);
    expect(mockRunQueryActionCreator).toHaveBeenCalledWith(mockServices, testQuery);
  });
});
