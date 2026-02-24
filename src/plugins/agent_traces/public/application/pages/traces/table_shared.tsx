/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  EuiHealth,
  EuiText,
  EuiLoadingSpinner,
  EuiEmptyPrompt,
  EuiButton,
  EuiCallOut,
  CriteriaWithPagination,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { useSelector } from 'react-redux';
import { RootState } from '../../utils/state_management/store';

export const PAGE_SIZE_OPTIONS = [10, 25, 50];
export const DEFAULT_PAGE_SIZE = 50;

/** Shared hook for table pagination with query-change reset */
export const useTablePagination = (totalItemCount: number) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const query = useSelector((state: RootState) => state.query);
  const prevQueryRef = useRef(query);
  useEffect(() => {
    if (query !== prevQueryRef.current) {
      prevQueryRef.current = query;
      setPageIndex(0);
    }
  }, [query]);

  const pagination = useMemo(
    () => ({
      pageIndex,
      pageSize,
      totalItemCount,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
    }),
    [pageIndex, pageSize, totalItemCount]
  );

  const onTableChange = useCallback(
    ({ page }: CriteriaWithPagination<any>) => {
      if (page.size !== pageSize) {
        setPageSize(page.size);
        setPageIndex(0);
      } else {
        setPageIndex(page.index);
      }
    },
    [pageSize]
  );

  return { pageIndex, pageSize, pagination, onTableChange };
};

/** Shared status column renderer */
export const renderStatus = (status: string) => (
  <EuiHealth color={status === 'success' ? 'success' : 'danger'}>
    {status === 'success'
      ? i18n.translate('agentTraces.table.statusSuccess', { defaultMessage: 'Success' })
      : i18n.translate('agentTraces.table.statusError', { defaultMessage: 'Error' })}
  </EuiHealth>
);

/** Shared loading state */
export const TableLoadingState: React.FC<{ message: React.ReactNode }> = ({ message }) => (
  <EuiEmptyPrompt
    icon={<EuiLoadingSpinner size="xl" />}
    body={
      <EuiText size="s" color="subdued">
        {message}
      </EuiText>
    }
  />
);

/** Shared empty state */
export const TableEmptyState: React.FC<{
  title: React.ReactNode;
  onRefresh: () => void;
  refreshLabel: React.ReactNode;
}> = ({ title, onRefresh, refreshLabel }) => (
  <EuiEmptyPrompt
    iconType="apmTrace"
    title={<h3>{title}</h3>}
    body={
      <p>
        <FormattedMessage
          id="agentTraces.table.emptyBody"
          defaultMessage="No AI agent spans were found in the {indexName} index. Make sure your application is instrumented with OpenTelemetry and is sending spans with {attributeName} attribute."
          values={{
            indexName: <code>otel-v1-apm-span</code>,
            attributeName: <code>gen_ai.operation.name</code>,
          }}
        />
      </p>
    }
    actions={
      <EuiButton onClick={onRefresh} iconType="refresh">
        {refreshLabel}
      </EuiButton>
    }
  />
);

/** Shared error state */
export const TableErrorState: React.FC<{
  title: string;
  error: string;
  onRetry: () => void;
  retryLabel: React.ReactNode;
}> = ({ title, error, onRetry, retryLabel }) => (
  <EuiCallOut title={title} color="danger" iconType="alert">
    <p>{error}</p>
    <EuiButton onClick={onRetry} color="danger" size="s">
      {retryLabel}
    </EuiButton>
  </EuiCallOut>
);
