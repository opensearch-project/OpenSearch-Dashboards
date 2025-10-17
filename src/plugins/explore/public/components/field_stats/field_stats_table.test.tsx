/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { ReactWrapper } from 'enzyme';
import { FieldStatsTable } from './field_stats_table';
import { FieldStatsItem } from './utils/field_stats_types';
import { findTestSubject } from 'test_utils/helpers';
import { getFieldStatsColumns } from './field_stats_table_columns';
import { FieldStatsRowDetails } from './field_stats_row_details';

jest.mock('./field_stats_table_columns', () => ({
  getFieldStatsColumns: jest.fn(() => [
    {
      field: 'name',
      name: 'Name',
    },
    {
      field: 'type',
      name: 'Type',
    },
  ]),
}));

jest.mock('./field_stats_row_details', () => ({
  FieldStatsRowDetails: jest.fn(() => <div>Mock Row Details</div>),
}));

describe('FieldStatsTable', () => {
  const mockItems: FieldStatsItem[] = [
    {
      name: 'field1',
      type: 'string',
      docCount: 100,
      distinctCount: 50,
      docPercentage: 0.5,
    },
    {
      name: 'field2',
      type: 'number',
      docCount: 200,
      distinctCount: 75,
      docPercentage: 0.75,
    },
  ];

  const defaultProps = {
    items: mockItems,
    expandedRows: new Set<string>(),
    fieldDetails: {},
    onRowExpand: jest.fn(),
    isLoading: false,
    detailsLoading: new Set<string>(),
  };

  let component: ReactWrapper;

  afterEach(() => {
    jest.clearAllMocks();
    if (component) {
      component.unmount();
    }
  });

  it('renders without crashing', () => {
    component = mountWithIntl(<FieldStatsTable {...defaultProps} />);
    expect(component.exists()).toBe(true);
  });

  it('displays loading state when isLoading is true', () => {
    component = mountWithIntl(<FieldStatsTable {...defaultProps} isLoading={true} />);
    const loadingElement = findTestSubject(component, 'fieldStatsLoading');
    expect(loadingElement.length).toBe(1);
    expect(component.find('EuiLoadingSpinner').length).toBe(1);
  });

  it('does not display loading state when isLoading is false', () => {
    component = mountWithIntl(<FieldStatsTable {...defaultProps} isLoading={false} />);
    const loadingElement = findTestSubject(component, 'fieldStatsLoading');
    expect(loadingElement.length).toBe(0);
  });

  it('renders EuiBasicTable with correct items', () => {
    component = mountWithIntl(<FieldStatsTable {...defaultProps} />);
    const table = component.find('EuiBasicTable');
    expect(table.length).toBe(1);
    expect(table.prop('items')).toEqual(mockItems);
  });

  it('passes correct props to getFieldStatsColumns', () => {
    const expandedRows = new Set(['field1']);
    const onRowExpand = jest.fn();

    component = mountWithIntl(
      <FieldStatsTable {...defaultProps} expandedRows={expandedRows} onRowExpand={onRowExpand} />
    );

    expect(getFieldStatsColumns).toHaveBeenCalledWith({
      expandedRows,
      onRowExpand,
    });
  });

  it('renders expanded row content when rows are expanded', () => {
    const expandedRows = new Set(['field1']);
    const fieldDetails = {
      field1: {
        topValues: [
          { value: 'value1', count: 10 },
          { value: 'value2', count: 5 },
        ],
      },
    };

    component = mountWithIntl(
      <FieldStatsTable {...defaultProps} expandedRows={expandedRows} fieldDetails={fieldDetails} />
    );

    const table = component.find('EuiBasicTable');
    const expandedRowMap = table.prop('itemIdToExpandedRowMap');
    expect(expandedRowMap).toBeDefined();
    expect(expandedRowMap).toHaveProperty('field1');
  });

  it('passes isLoading prop to FieldStatsRowDetails for expanded rows', () => {
    const expandedRows = new Set(['field1']);
    const detailsLoading = new Set(['field1']);

    component = mountWithIntl(
      <FieldStatsTable
        {...defaultProps}
        expandedRows={expandedRows}
        detailsLoading={detailsLoading}
      />
    );

    expect(FieldStatsRowDetails).toHaveBeenCalledWith(
      expect.objectContaining({
        isLoading: true,
      }),
      {}
    );
  });

  it('handles empty items array', () => {
    component = mountWithIntl(<FieldStatsTable {...defaultProps} items={[]} />);
    const table = component.find('EuiBasicTable');
    expect(table.length).toBe(1);
    expect(table.prop('items')).toEqual([]);
  });

  it('sets correct table properties', () => {
    component = mountWithIntl(<FieldStatsTable {...defaultProps} />);
    const table = component.find('EuiBasicTable');
    expect(table.prop('itemId')).toBe('name');
    expect(table.prop('isExpandable')).toBe(true);
    expect(table.prop('sorting')).toBeDefined();
  });
});
