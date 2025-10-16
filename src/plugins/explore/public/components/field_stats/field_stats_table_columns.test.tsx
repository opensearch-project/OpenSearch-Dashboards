/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { getFieldStatsColumns } from './field_stats_table_columns';
import { FieldStatsItem } from './utils/field_stats_types';
import { EuiBadge } from '@elastic/eui';

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

  it('renders error badge for fields with errors', () => {
    const errorItem: FieldStatsItem = {
      name: 'errorField',
      type: 'string',
      docCount: 0,
      distinctCount: 0,
      docPercentage: 0,
      errorMessage: 'Failed to load',
    };

    const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
    const docCountColumn = columns.find((col) => 'field' in col && col.field === 'docCount') as any;
    const rendered = docCountColumn.render(errorItem.docCount, errorItem);
    const wrapper = shallow(<div>{rendered}</div>);

    expect(wrapper.find(EuiBadge).exists()).toBe(true);
  });

  it('renders emdash when percentage is undefined (total count fetch failed)', () => {
    const item: FieldStatsItem = {
      name: 'field1',
      type: 'string',
      docCount: 100,
      distinctCount: 50,
      docPercentage: undefined,
    };

    const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
    const docCountColumn = columns.find((col) => 'field' in col && col.field === 'docCount') as any;
    const rendered = docCountColumn.render(item.docCount, item);
    const wrapper = shallow(<div>{rendered}</div>);

    expect(wrapper.text()).toContain('—');
    expect(wrapper.text()).not.toContain('%');
  });
});
