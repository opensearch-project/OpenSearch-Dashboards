/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { getFieldStatsColumns } from './field_stats_table_columns';
import { createMockFieldStatsItem } from './utils/field_stats.stubs';

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  FieldIcon: ({ type }: { type: string }) => <span data-test-subj={`fieldIcon-${type}`} />,
}));

describe('getFieldStatsColumns', () => {
  const mockItem = createMockFieldStatsItem({
    name: 'testField',
    type: 'string',
    docCount: 1000,
    distinctCount: 500,
    docPercentage: 75.5,
  });

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

  describe('expander column', () => {
    it('renders expand button when row is not expanded', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[0] as any).render(mockItem)}</div>);
      const button = wrapper.find('EuiButtonIcon');

      expect(button.prop('iconType')).toBe('arrowRight');
      expect(button.prop('data-test-subj')).toBe('fieldStatsExpandButton-testField');
    });

    it('renders collapse button when row is expanded', () => {
      expandedRows.add('testField');
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[0] as any).render(mockItem)}</div>);

      expect(wrapper.find('EuiButtonIcon').prop('iconType')).toBe('arrowDown');
    });

    it('calls onRowExpand when clicked', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[0] as any).render(mockItem)}</div>);

      wrapper.find('EuiButtonIcon').simulate('click');
      expect(onRowExpandMock).toHaveBeenCalledWith('testField');
    });
  });

  describe('type column', () => {
    it('renders FieldIcon with correct type', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[1] as any).render('string', mockItem)}</div>);

      expect(wrapper.find('FieldIcon').prop('type')).toBe('string');
      expect(wrapper.find('FieldIcon').prop('size')).toBe('s');
    });
  });

  describe('name column', () => {
    it('renders field name in bold', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[2] as any).render('testField', mockItem)}</div>);

      expect(wrapper.find('strong').text()).toBe('testField');
    });
  });

  describe('docCount column', () => {
    it('renders count with percentage', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[3] as any).render(1000, mockItem)}</div>);

      expect(wrapper.find('span').text()).toBe('1,000 (75.5%)');
    });

    it('formats large numbers', () => {
      const largeItem = { ...mockItem, docCount: 1234567, docPercentage: 99.9 };
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[3] as any).render(1234567, largeItem)}</div>);

      expect(wrapper.find('span').text()).toBe('1,234,567 (99.9%)');
    });
  });

  describe('distinctCount column', () => {
    it('renders count with locale formatting', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[4] as any).render(500, mockItem)}</div>);

      expect(wrapper.text()).toBe('500');
    });

    it('renders em dash for null/undefined', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapperNull = shallow(<div>{(columns[4] as any).render(null as any, mockItem)}</div>);
      const wrapperUndefined = shallow(
        <div>{(columns[4] as any).render(undefined as any, mockItem)}</div>
      );

      expect(wrapperNull.text()).toBe('—');
      expect(wrapperUndefined.text()).toBe('—');
    });

    it('renders 0 when count is 0', () => {
      const columns = getFieldStatsColumns({ expandedRows, onRowExpand: onRowExpandMock });
      const wrapper = shallow(<div>{(columns[4] as any).render(0, mockItem)}</div>);

      expect(wrapper.text()).toBe('0');
    });
  });
});
