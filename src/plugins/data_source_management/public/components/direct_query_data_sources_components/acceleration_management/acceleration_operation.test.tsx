/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useAccelerationOperation } from './acceleration_operation';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { CachedAcceleration, DirectQueryLoadingStatus } from '../../../../framework/types';
import { useDirectQuery } from '../../../../framework/hooks/direct_query_hook';

jest.mock('../../../../framework/hooks/direct_query_hook', () => ({
  useDirectQuery: jest.fn(),
}));

const mockHttp: HttpStart = ({
  get: jest.fn(),
  post: jest.fn(),
} as unknown) as HttpStart;

const mockNotifications: NotificationsStart = ({
  toasts: {
    addSuccess: jest.fn(),
    addDanger: jest.fn(),
  },
} as unknown) as NotificationsStart;

const mockAcceleration: CachedAcceleration = {
  flintIndexName: 'flint_index',
  type: 'covering',
  database: 'default',
  table: 'test_table',
  indexName: 'actual_index',
  autoRefresh: false,
  status: 'active',
};

describe('useAccelerationOperation', () => {
  const startLoading = jest.fn();
  const stopLoading = jest.fn();
  const mockUseDirectQuery = useDirectQuery as jest.MockedFunction<typeof useDirectQuery>;

  beforeEach(() => {
    mockUseDirectQuery.mockReturnValue({
      startLoading,
      stopLoading,
      loadStatus: DirectQueryLoadingStatus.WAITING,
      pollingResult: {},
    });
  });

  it('should initialize correctly', () => {
    const { result } = renderHook(() =>
      useAccelerationOperation('test_data_source', mockHttp, mockNotifications)
    );
    expect(result.current.isOperating).toBe(false);
    expect(result.current.operationSuccess).toBe(false);
  });

  it('should perform delete operation', () => {
    const { result } = renderHook(() =>
      useAccelerationOperation('test_data_source', mockHttp, mockNotifications)
    );

    act(() => {
      result.current.performOperation(mockAcceleration, 'delete', false);
    });

    expect(startLoading).toHaveBeenCalled();
    expect(result.current.isOperating).toBe(true);
  });

  it('should show success toast on successful operation', () => {
    mockUseDirectQuery.mockReturnValue({
      startLoading,
      stopLoading,
      loadStatus: DirectQueryLoadingStatus.SUCCESS,
      pollingResult: {},
    });

    const { result } = renderHook(() =>
      useAccelerationOperation('test_data_source', mockHttp, mockNotifications)
    );

    act(() => {
      result.current.performOperation(mockAcceleration, 'delete', false);
    });

    expect(mockNotifications.toasts.addSuccess).toHaveBeenCalledWith(
      'Successfully deleted acceleration: actual_index'
    );
    expect(result.current.isOperating).toBe(false);
    expect(result.current.operationSuccess).toBe(true);
  });

  it('should show failure toast on failed operation', () => {
    mockUseDirectQuery.mockReturnValue({
      startLoading,
      stopLoading,
      loadStatus: DirectQueryLoadingStatus.FAILED,
      pollingResult: {},
    });

    const { result } = renderHook(() =>
      useAccelerationOperation('test_data_source', mockHttp, mockNotifications)
    );

    act(() => {
      result.current.performOperation(mockAcceleration, 'delete', false);
    });

    expect(mockNotifications.toasts.addDanger).toHaveBeenCalledWith(
      'Failed to delete acceleration: actual_index'
    );
    expect(result.current.isOperating).toBe(false);
    expect(result.current.operationSuccess).toBe(false);
  });

  it('should stop loading on unmount', () => {
    const { unmount } = renderHook(() =>
      useAccelerationOperation('test_data_source', mockHttp, mockNotifications)
    );

    unmount();

    expect(stopLoading).toHaveBeenCalled();
  });
});
