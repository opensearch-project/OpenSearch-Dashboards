/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { runQueryActionCreator } from './run_query';
import {
  setQueryStringWithHistory,
  clearResults,
  setActiveTab,
  setQueryExecutionButtonStatus,
} from '../../../slices';
import { clearQueryStatusMap } from '../../../slices/query_editor/query_editor_slice';
import { executeQueries } from '../../query_actions';
import { detectAndSetOptimalTab } from '../../detect_optimal_tab';

jest.mock('../../../slices', () => ({
  setQueryStringWithHistory: jest.fn((query) => ({
    type: 'setQueryStringWithHistory',
    payload: query,
  })),
  clearResults: jest.fn(() => ({ type: 'clearResults' })),
  setActiveTab: jest.fn((tabId) => ({
    type: 'setActiveTab',
    payload: tabId,
  })),
  setQueryExecutionButtonStatus: jest.fn((status) => ({
    type: 'queryEditor/setQueryExecutionButtonStatus',
    payload: status,
  })),
}));

jest.mock('../../../slices/query_editor/query_editor_slice', () => ({
  clearQueryStatusMap: jest.fn(() => ({
    type: 'queryEditor/clearQueryStatusMap',
    payload: undefined,
  })),
  setIsQueryEditorDirty: jest.fn((isDirty) => ({
    type: 'queryEditor/setIsQueryEditorDirty',
    payload: isDirty,
  })),
}));

jest.mock('../../query_actions', () => ({
  executeQueries: jest.fn((args) => ({ type: 'executeQueries', payload: args })),
}));

jest.mock('../../detect_optimal_tab', () => ({
  detectAndSetOptimalTab: jest.fn((args) => ({
    type: 'detectAndSetOptimalTab',
    payload: args,
  })),
}));

describe('runQueryActionCreator', () => {
  const mockDispatch = jest.fn();
  const mockGetState = jest.fn();
  const mockServices = { some: 'service' } as any;
  const query = 'this is some query';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when queryExecutionButtonStatus is UPDATE', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: { queryExecutionButtonStatus: 'UPDATE' },
      });
    });

    it('dispatches setQueryStringWithHistory, clearResults, clearQueryStatusMap, executeQueries, setActiveTab, detectAndSetOptimalTab, and setQueryExecutionButtonStatus when query is provided', async () => {
      await runQueryActionCreator(mockServices, query)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).toHaveBeenCalledWith('');
      expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
      expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: 'setQueryStringWithHistory',
        payload: query,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(5, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(6, {
        type: 'setActiveTab',
        payload: '',
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(7, {
        type: 'detectAndSetOptimalTab',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(8, {
        type: 'queryEditor/setQueryExecutionButtonStatus',
        payload: 'REFRESH',
      });
    });

    it('dispatches clearResults, clearQueryStatusMap, setIsQueryEditorDirty, executeQueries, setActiveTab, detectAndSetOptimalTab, and setQueryExecutionButtonStatus when no query is provided', async () => {
      await runQueryActionCreator(mockServices)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).not.toHaveBeenCalled();
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).toHaveBeenCalledWith('');
      expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
      expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

      expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(5, {
        type: 'setActiveTab',
        payload: '',
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(6, {
        type: 'detectAndSetOptimalTab',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(7, {
        type: 'queryEditor/setQueryExecutionButtonStatus',
        payload: 'REFRESH',
      });
    });

    it('dispatches clearResults, clearQueryStatusMap, setIsQueryEditorDirty, executeQueries, setActiveTab, detectAndSetOptimalTab, and setQueryExecutionButtonStatus when query is undefined', async () => {
      await runQueryActionCreator(mockServices, undefined)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).not.toHaveBeenCalled();
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).toHaveBeenCalledWith('');
      expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
      expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

      expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(5, {
        type: 'setActiveTab',
        payload: '',
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(6, {
        type: 'detectAndSetOptimalTab',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(7, {
        type: 'queryEditor/setQueryExecutionButtonStatus',
        payload: 'REFRESH',
      });
    });

    it('dispatches setQueryStringWithHistory, clearResults, clearQueryStatusMap, setIsQueryEditorDirty, executeQueries, setActiveTab, detectAndSetOptimalTab, and setQueryExecutionButtonStatus when query is an empty string', async () => {
      const emptyQuery = '';
      await runQueryActionCreator(mockServices, emptyQuery)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).toHaveBeenCalledWith(emptyQuery);
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).toHaveBeenCalledWith('');
      expect(detectAndSetOptimalTab).toHaveBeenCalledWith({ services: mockServices });
      expect(setQueryExecutionButtonStatus).toHaveBeenCalledWith('REFRESH');

      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: 'setQueryStringWithHistory',
        payload: emptyQuery,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(5, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(6, {
        type: 'setActiveTab',
        payload: '',
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(7, {
        type: 'detectAndSetOptimalTab',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(8, {
        type: 'queryEditor/setQueryExecutionButtonStatus',
        payload: 'REFRESH',
      });
    });
  });

  describe('when queryExecutionButtonStatus is not UPDATE', () => {
    beforeEach(() => {
      mockGetState.mockReturnValue({
        queryEditor: { queryExecutionButtonStatus: 'REFRESH' },
      });
    });

    it('dispatches setQueryStringWithHistory, clearResults, clearQueryStatusMap, setIsQueryEditorDirty, and executeQueries but not tab-related actions when query is provided', async () => {
      await runQueryActionCreator(mockServices, query)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).toHaveBeenCalledWith(query);
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).not.toHaveBeenCalled();
      expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
      expect(setQueryExecutionButtonStatus).not.toHaveBeenCalled();

      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: 'setQueryStringWithHistory',
        payload: query,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(5, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenCalledTimes(5);
    });

    it('dispatches clearResults, clearQueryStatusMap, setIsQueryEditorDirty, and executeQueries but not tab-related actions when no query is provided', async () => {
      await runQueryActionCreator(mockServices)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).not.toHaveBeenCalled();
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).not.toHaveBeenCalled();
      expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
      expect(setQueryExecutionButtonStatus).not.toHaveBeenCalled();

      expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenCalledTimes(4);
    });

    it('dispatches clearResults, clearQueryStatusMap, setIsQueryEditorDirty, and executeQueries but not tab-related actions when query is undefined', async () => {
      await runQueryActionCreator(mockServices, undefined)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).not.toHaveBeenCalled();
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).not.toHaveBeenCalled();
      expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
      expect(setQueryExecutionButtonStatus).not.toHaveBeenCalled();

      expect(mockDispatch).toHaveBeenNthCalledWith(1, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenCalledTimes(4);
    });

    it('dispatches setQueryStringWithHistory, clearResults, clearQueryStatusMap, setIsQueryEditorDirty, and executeQueries but not tab-related actions when query is an empty string', async () => {
      const emptyQuery = '';
      await runQueryActionCreator(mockServices, emptyQuery)(mockDispatch, mockGetState);

      expect(setQueryStringWithHistory).toHaveBeenCalledWith(emptyQuery);
      expect(clearResults).toHaveBeenCalled();
      expect(clearQueryStatusMap).toHaveBeenCalled();
      expect(executeQueries).toHaveBeenCalledWith({ services: mockServices });
      expect(setActiveTab).not.toHaveBeenCalled();
      expect(detectAndSetOptimalTab).not.toHaveBeenCalled();
      expect(setQueryExecutionButtonStatus).not.toHaveBeenCalled();

      expect(mockDispatch).toHaveBeenNthCalledWith(1, {
        type: 'setQueryStringWithHistory',
        payload: emptyQuery,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: 'clearResults' });
      expect(mockDispatch).toHaveBeenNthCalledWith(3, {
        type: 'queryEditor/clearQueryStatusMap',
        payload: undefined,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(4, {
        type: 'queryEditor/setIsQueryEditorDirty',
        payload: false,
      });
      expect(mockDispatch).toHaveBeenNthCalledWith(5, {
        type: 'executeQueries',
        payload: { services: mockServices },
      });
      expect(mockDispatch).toHaveBeenCalledTimes(5);
    });
  });
});
