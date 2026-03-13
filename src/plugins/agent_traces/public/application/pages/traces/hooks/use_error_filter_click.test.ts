/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react';
import { useErrorFilterClick } from './use_error_filter_click';

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  useDispatch: () => mockDispatch,
}));

const mockGetEditorText = jest.fn();
const mockSetEditorTextWithQuery = jest.fn();
jest.mock('../../../hooks', () => ({
  useEditorText: () => mockGetEditorText,
  useSetEditorTextWithQuery: () => mockSetEditorTextWithQuery,
}));

const mockServices = { tabRegistry: {} };
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({ services: mockServices }),
}));

const mockLoadQueryActionCreator = jest.fn(
  (_services: any, _setEditor: any, _query: string) => () => {}
);
jest.mock('../../../utils/state_management/actions/query_editor', () => ({
  loadQueryActionCreator: (...args: any[]) => mockLoadQueryActionCreator(...args),
}));

jest.mock('../../../utils/state_management/slices', () => ({
  setActiveTab: (id: string) => ({ type: 'ui/setActiveTab', payload: id }),
}));

describe('useErrorFilterClick', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEditorText.mockReturnValue('source = my_index');
  });

  it('appends error filter and dispatches setActiveTab for traces', () => {
    const { result } = renderHook(() => useErrorFilterClick());

    act(() => {
      result.current('traces');
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/setActiveTab', payload: 'traces' });
    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      mockServices,
      mockSetEditorTextWithQuery,
      'source = my_index | where `status.code` = 2'
    );
  });

  it('appends error filter and dispatches setActiveTab for spans', () => {
    const { result } = renderHook(() => useErrorFilterClick());

    act(() => {
      result.current('spans');
    });

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'ui/setActiveTab', payload: 'spans' });
    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      mockServices,
      mockSetEditorTextWithQuery,
      'source = my_index | where `status.code` = 2'
    );
  });

  it('does not duplicate filter if already present', () => {
    mockGetEditorText.mockReturnValue('source = my_index | where `status.code` = 2');

    const { result } = renderHook(() => useErrorFilterClick());

    act(() => {
      result.current('traces');
    });

    expect(mockLoadQueryActionCreator).toHaveBeenCalledWith(
      mockServices,
      mockSetEditorTextWithQuery,
      'source = my_index | where `status.code` = 2'
    );
  });
});
