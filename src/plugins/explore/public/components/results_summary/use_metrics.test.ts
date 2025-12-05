/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react-hooks';
import { useMetrics } from './use_metrics';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid'),
}));

describe('useMetrics', () => {
  let mockUsageCollection: any;

  beforeEach(() => {
    mockUsageCollection = {
      reportUiStats: jest.fn(),
      METRIC_TYPE: {
        CLICK: 'click',
        COUNT: 'count',
      },
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return reportMetric and reportCountMetric functions', () => {
    const { result } = renderHook(() => useMetrics(mockUsageCollection));

    expect(result.current).toHaveProperty('reportMetric');
    expect(result.current).toHaveProperty('reportCountMetric');
    expect(typeof result.current.reportMetric).toBe('function');
    expect(typeof result.current.reportCountMetric).toBe('function');
  });

  it('should call reportUiStats with correct parameters when reportMetric is called', () => {
    const { result } = renderHook(() => useMetrics(mockUsageCollection));

    result.current.reportMetric('test-metric');

    expect(mockUsageCollection.reportUiStats).toHaveBeenCalledTimes(1);
    expect(mockUsageCollection.reportUiStats).toHaveBeenCalledWith(
      'query-assist',
      'click',
      'test-metric-test-uuid'
    );
  });

  it('should call reportUiStats with correct parameters when reportCountMetric is called', () => {
    const { result } = renderHook(() => useMetrics(mockUsageCollection));

    result.current.reportCountMetric('test-metric', 5);

    expect(mockUsageCollection.reportUiStats).toHaveBeenCalledTimes(1);
    expect(mockUsageCollection.reportUiStats).toHaveBeenCalledWith(
      'query-assist',
      'count',
      'test-metric-test-uuid',
      5
    );
  });

  it('should not call reportUiStats when usageCollection is undefined', () => {
    const { result } = renderHook(() => useMetrics(undefined));

    result.current.reportMetric('test-metric');
    result.current.reportCountMetric('test-metric', 5);

    expect(mockUsageCollection.reportUiStats).not.toHaveBeenCalled();
  });
});
