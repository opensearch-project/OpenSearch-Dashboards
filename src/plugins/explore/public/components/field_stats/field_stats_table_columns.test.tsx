/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { getFieldStatsColumns } from './field_stats_table_columns';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  FieldIcon: ({ type }: { type: string }) => <span data-test-subj={`fieldIcon-${type}`} />,
}));

describe('getFieldStatsColumns', () => {
  const onRowExpandMock = jest.fn();
  let expandedRows: Set<string>;

  beforeEach(() => {
    expandedRows = new Set<string>();
    onRowExpandMock.mockClear();
  });

  it('returns 5 columns', () => {
    const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
    expect(columns).toHaveLength(5);
  });
});
