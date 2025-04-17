/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { HttpStart, NotificationsStart } from 'opensearch-dashboards/public';
import { ASYNC_POLLING_INTERVAL } from '../constants';
import { DirectQueryLoadingStatus, DirectQueryRequest } from '../types';
import { getAsyncSessionId, setAsyncSessionId } from '../utils/query_session_utils';
import { get as getObjValue, formatError } from '../utils/shared';
import { usePolling } from '../utils/use_polling';
import { SQLService } from '../requests/sql';

export const useDirectQuery = (
  http: HttpStart,
  notifications: NotificationsStart,
  dataSourceMDSId?: string
) => {
  const sqlService = new SQLService(http);
  const [loadStatus, setLoadStatus] = useState<DirectQueryLoadingStatus>(
    DirectQueryLoadingStatus.FRESH
  );

  const {
    data: pollingResult,
    loading: _pollingLoading,
    error: pollingError,
    startPolling,
    stopPolling: stopLoading,
  } = usePolling<any, any>((params) => {
    return sqlService.fetchWithJobId(params, dataSourceMDSId || '');
  }, ASYNC_POLLING_INTERVAL);

  const startLoading = (requestPayload: DirectQueryRequest) => {
    setLoadStatus(DirectQueryLoadingStatus.SCHEDULED);

    const sessionId = getAsyncSessionId(requestPayload.datasource);
    if (sessionId) {
      requestPayload = { ...requestPayload, sessionId };
    }

    sqlService
      .fetch(requestPayload, dataSourceMDSId)
      .then((result) => {
        setAsyncSessionId(requestPayload.datasource, getObjValue(result, 'sessionId', null));
        if (result.queryId) {
          startPolling({
            queryId: result.queryId,
          });
        } else {
          // eslint-disable-next-line no-console
          console.error('No query id found in response');
          setLoadStatus(DirectQueryLoadingStatus.FAILED);
        }
      })
      .catch((e) => {
        setLoadStatus(DirectQueryLoadingStatus.FAILED);
        const formattedError = formatError(
          '',
          'The query failed to execute and the operation could not be complete.',
          e.body?.message
        );
        notifications.toasts.addError(formattedError, {
          title: 'Query Failed',
        });
        // eslint-disable-next-line no-console
        console.error(e);
      });
  };

  useEffect(() => {
    // cancel direct query
    if (!pollingResult) return;
    const { status: anyCaseStatus, datarows, error } = pollingResult;
    const status = anyCaseStatus?.toLowerCase();

    if (status === DirectQueryLoadingStatus.SUCCESS || datarows) {
      setLoadStatus(status);
      stopLoading();
    } else if (status === DirectQueryLoadingStatus.FAILED) {
      setLoadStatus(status);
      stopLoading();
      const formattedError = formatError(
        '',
        'The query failed to execute and the operation could not be complete.',
        error
      );
      notifications.toasts.addError(formattedError, {
        title: 'Query Failed',
      });
    } else {
      setLoadStatus(status);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollingResult, pollingError, stopLoading]);

  return { loadStatus, startLoading, stopLoading, pollingResult };
};
