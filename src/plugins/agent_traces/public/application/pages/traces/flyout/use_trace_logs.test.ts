/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, waitFor } from '@testing-library/react';
import {
  TRACE_LOGS_LIMIT,
  clearTraceLogsCache,
  countSpanLogs,
  useTraceLogs,
} from './use_trace_logs';

const mockCheck = jest.fn();
jest.mock('../../../../../../explore/public', () => ({
  CorrelationService: jest.fn().mockImplementation(() => ({
    checkCorrelationsAndFetchLogs: mockCheck,
  })),
  filterLogsBySpanId: (logs: Array<{ spanId?: string }>, spanId: string) =>
    logs.filter((log) => log.spanId === spanId),
}));

const mockServices = {
  savedObjects: { client: {} },
  uiSettings: {},
  data: {},
};
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: () => ({ services: mockServices }),
}));

let mockDataset: { id: string; title: string; type?: string; timeFieldName?: string } | undefined;
jest.mock('../../../context/dataset_context/dataset_context', () => ({
  useDatasetContext: () => ({ dataset: mockDataset }),
}));

describe('useTraceLogs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearTraceLogsCache();
    mockDataset = { id: 'traces-1', title: 'otel-v1-apm-span*', timeFieldName: 'endTime' };
  });

  it('fetches the logs correlated with the traces dataset for the trace', async () => {
    const logDatasets = [{ id: 'logs-1', title: 'logs-otel-v1*', type: 'INDEX_PATTERN' }];
    mockCheck.mockResolvedValue({
      logDatasets,
      datasetLogs: { 'logs-1': [{ _id: 'a', spanId: 's1' }] },
      logHitCount: 1,
    });

    const { result } = renderHook(() => useTraceLogs('trace-1'));
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(mockCheck).toHaveBeenCalledWith(
      {
        id: 'traces-1',
        title: 'otel-v1-apm-span*',
        type: 'INDEX_PATTERN',
        timeFieldName: 'endTime',
      },
      mockServices.data,
      'trace-1',
      TRACE_LOGS_LIMIT
    );
    expect(result.current.logCount).toBe(1);
    expect(result.current.logDatasets).toEqual(logDatasets);
  });

  it('fetches nothing without a trace id or traces dataset', () => {
    mockDataset = undefined;
    const { result, rerender } = renderHook(({ id }) => useTraceLogs(id), {
      initialProps: { id: 'trace-1' as string | undefined },
    });
    rerender({ id: undefined });
    expect(mockCheck).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ logDatasets: [], logCount: 0, isLoading: false });
  });

  it('shows no logs when the lookup fails', async () => {
    mockCheck.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useTraceLogs('trace-1'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.logCount).toBe(0);
  });
});

describe('countSpanLogs', () => {
  it("counts a span's logs across logs datasets", () => {
    const logs = {
      logDatasets: [{ id: 'a' }, { id: 'b' }] as never,
      datasetLogs: {
        a: [{ spanId: 's1' }, { spanId: 's2' }],
        b: [{ spanId: 's1' }],
      } as never,
    };
    expect(countSpanLogs(logs, 's1')).toBe(2);
    expect(countSpanLogs(logs, 'none')).toBe(0);
    expect(countSpanLogs(logs, undefined)).toBe(0);
  });
});
