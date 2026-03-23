/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorFilterClick } from './use_error_filter_click';

const mockDispatch = jest.fn().mockImplementation((action: any) => {
  if (typeof action === 'function')
    return action(mockDispatch, () => ({ query: {}, legacy: { sort: [] }, results: {} }));
  return action;
});
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

const mockGetEditorText = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();
jest.mock('../../../hooks', () => ({
  useEditorText: () => mockGetEditorText,
  useSetEditorTextWithQuery: () => mockSetEditorTextWithQuery,
}));

const mockServices = { tabRegistry: { getTab: jest.fn() } };
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({ services: mockServices }),
  withOpenSearchDashboards: (Component: any) => Component,
}));

const mockLoadQueryActionCreator = jest.fn(
  (_services: any, _setEditor: any, _query: string) => () => {}
);
jest.mock('../../../utils/state_management/actions/query_editor', () => ({
  loadQueryActionCreator: (...args: any[]) => mockLoadQueryActionCreator(...args),
}));

jest.mock('../../../utils/state_management/slices', () => ({
  setActiveTab: (id: string) => ({ type: 'ui/setActiveTab', payload: id }),
  clearQueryStatusMapByKey: (key: string) => ({
    type: 'queryEditor/clearQueryStatusMapByKey',
    payload: key,
  }),
}));

jest.mock('../../../utils/state_management/actions/query_actions', () => ({
  executeTabQuery: jest.fn(() => ({ type: 'executeTabQuery' })),
}));

describe('useErrorFilterClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEditorText.mockReturnValue('source = my_index');
  });

  it('appends error filter and dispatches setActiveTab for traces', async () => {
    const { result } = renderHook(() => useErrorFilterClick());

    await act(async () => {
      await result.current('traces');
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/setActiveTab', payload: 'traces' });
    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      mockServices,
      mockSetEditorTextWithQuery,
      'source = my_index | where `status.code` = 2'
    );
  });

  it('appends error filter and dispatches setActiveTab for spans', async () => {
    const { result } = renderHook(() => useErrorFilterClick());

    await act(async () => {
      await result.current('spans');
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/setActiveTab', payload: 'spans' });
    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      mockServices,
      mockSetEditorTextWithQuery,
      'source = my_index | where `status.code` = 2'
    );
  });

  it('does not duplicate filter if already present', async () => {
    mockGetEditorText.mockReturnValue('source = my_index | where `status.code` = 2');

    const { result } = renderHook(() => useErrorFilterClick());

    await act(async () => {
      await result.current('traces');
    });

    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      mockServices,
      mockSetEditorTextWithQuery,
      'source = my_index | where `status.code` = 2'
    );
  });
});
