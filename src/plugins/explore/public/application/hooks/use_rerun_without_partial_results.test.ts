/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { executeQueries } from '../utils/state_management/actions/query_actions';
import { clearQueryStatusMap, clearResults } from '../utils/state_management/slices';
import { useRerunWithoutPartialResults } from './use_rerun_without_partial_results';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../utils/state_management/actions/query_actions', () => ({
  executeQueries: jest.fn((arg) => ({ type: 'query/executeQueries', arg })),
}));

jest.mock('../utils/state_management/slices', () => ({
  clearResults: jest.fn(() => ({ type: 'clearResults' })),
  clearQueryStatusMap: jest.fn(() => ({ type: 'clearQueryStatusMap' })),
}));

describe('useRerunWithoutPartialResults', () => {
  const mockDispatch = jest.fn();
  const services = { some: 'service' };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({ services });
  });

  it('reruns with partial results disabled for this one execution', () => {
    const { result } = renderHook(() => useRerunWithoutPartialResults());

    result.current();

    // The opt-out is passed as a per-execution thunk arg, not stored in state, so it does not
    // leak into later runs (a time-range change dispatches executeQueries without the flag).
    expect(executeQueries).toHaveBeenCalledWith({ services, disablePartialResults: true });
    expect(clearResults).toHaveBeenCalled();
    expect(clearQueryStatusMap).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'query/executeQueries',
      arg: { services, disablePartialResults: true },
    });
  });
});
