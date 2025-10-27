/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getSpanHierarchyTableColumns } from './span_table_columns';
import { TraceTimeRange } from '../../utils/span_timerange_utils';

jest.mock('./timeline_waterfall_bar', () => ({
  TimelineHeader: jest.fn(() => 'TimelineHeader'),
}));

describe('getSpanHierarchyTableColumns', () => {
  const mockTraceTimeRange: TraceTimeRange = {
    durationMs: 1000,
    startTimeMs: 0,
    endTimeMs: 1000,
  };

  it('should return correct column structure with default width', () => {
    const columns = getSpanHierarchyTableColumns(mockTraceTimeRange);

    expect(columns).toHaveLength(3);
    expect(columns[0]).toEqual({
      id: 'span',
      display: 'Span',
      isExpandable: false,
      isResizable: true,
      actions: false,
    });
    expect(columns[1]).toMatchObject({
      id: 'timeline',
      initialWidth: 600,
      isExpandable: false,
      isResizable: true,
      actions: false,
    });
    expect(columns[2]).toEqual({
      id: 'durationInNanos',
      display: 'Duration',
      initialWidth: 100,
      isExpandable: false,
      actions: false,
    });
  });

  it('should calculate timeline width based on availableWidth', () => {
    const availableWidth = 1200;
    const columns = getSpanHierarchyTableColumns(mockTraceTimeRange, availableWidth);

    expect(columns[1].initialWidth).toBe(600); // Math.floor(1200 / 2)
  });

  it('should use default width when availableWidth is not provided', () => {
    const columns = getSpanHierarchyTableColumns(mockTraceTimeRange);

    expect(columns[1].initialWidth).toBe(600);
  });
});
