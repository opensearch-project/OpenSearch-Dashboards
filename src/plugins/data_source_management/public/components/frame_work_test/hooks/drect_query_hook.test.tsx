/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act } from '@testing-library/react-hooks';
import { useDirectQuery } from '../../../../framework/hooks/direct_query_hook';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { DirectQueryLoadingStatus } from '../../../../framework/types';
import { SQLService } from '../../../../framework/requests/sql';
import * as usePollingModule from '../../../../framework/utils/use_polling';

jest.mock('../../../../framework/requests/sql');
jest.mock('../../../../framework/utils/use_polling');
jest.mock('../../../../framework/utils/query_session_utils', () => ({
  getAsyncSessionId: jest.fn(),
  setAsyncSessionId: jest.fn(),
}));
jest.mock('../../../../framework/utils/shared', () => ({
  get: jest.fn((obj, path, defaultValue) => defaultValue),
  formatError: jest.fn((title, message, detail) => ({ title, message, detail })),
}));

describe('useDirectQuery', () => {
  let httpMock: jest.Mocked<HttpStart>;
  let notificationsMock: jest.Mocked<NotificationsStart>;
  let startPollingMock: jest.Mock;
  let stopLoadingMock: jest.Mock;
  let fetchMock: jest.Mock;
  let fetchWithJobIdMock: jest.Mock;
  let usePollingMock: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    httpMock = ({
      get: jest.fn(),
      post: jest.fn(),
    } as unknown) as jest.Mocked<HttpStart>;

    notificationsMock = ({
      toasts: {
        addError: jest.fn(),
        addWarning: jest.fn(),
        addSuccess: jest.fn(),
      },
    } as unknown) as jest.Mocked<NotificationsStart>;

    startPollingMock = jest.fn();
    stopLoadingMock = jest.fn();

    usePollingMock = jest.spyOn(usePollingModule, 'usePolling').mockReturnValue({
      data: null,
      loading: false,
      error: null,
      startPolling: startPollingMock,
      stopPolling: stopLoadingMock,
    });

    fetchMock = jest
      .fn()
      .mockResolvedValue({ queryId: 'test_query_id', sessionId: 'test_session_id' });
    fetchWithJobIdMock = jest.fn();

    (SQLService as jest.Mock).mockImplementation(() => ({
      fetch: fetchMock,
      fetchWithJobId: fetchWithJobIdMock,
    }));
  });

  it('should initialize with fresh status', () => {
    const { result } = renderHook(() => useDirectQuery(httpMock, notificationsMock));
    expect(result.current.loadStatus).toBe(DirectQueryLoadingStatus.FRESH);
  });

  it('should handle successful query execution and start polling', async () => {
    const { result } = renderHook(() => useDirectQuery(httpMock, notificationsMock));

    await act(async () => {
      await result.current.startLoading({ datasource: 'test_source' });
    });

    expect(fetchMock).toHaveBeenCalledWith({ datasource: 'test_source' }, undefined);
    expect(startPollingMock).toHaveBeenCalledWith({ queryId: 'test_query_id' });
  });

  it('should handle query execution failure', async () => {
    const error = new Error('Query failed');
    fetchMock.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useDirectQuery(httpMock, notificationsMock));

    await act(async () => {
      await result.current.startLoading({ datasource: 'test_source' });
    });

    expect(result.current.loadStatus).toBe(DirectQueryLoadingStatus.FAILED);
    expect(notificationsMock.toasts.addError).toHaveBeenCalledWith(
      {
        title: '',
        message: 'The query failed to execute and the operation could not be complete.',
        detail: undefined,
      },
      { title: 'Query Failed' }
    );
  });
});
