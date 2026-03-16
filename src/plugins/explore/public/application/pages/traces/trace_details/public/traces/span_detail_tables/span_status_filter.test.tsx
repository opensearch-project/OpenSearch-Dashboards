/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { shallow, ShallowWrapper } from 'enzyme';
import { EuiSelectable } from '@elastic/eui';
import { SpanStatusFilter, SpanStatusFilterProps } from './span_status_filter';
import { SpanFilter } from '../../../trace_view';

describe('SpanStatusFilter', () => {
  let component: ShallowWrapper;
  let mockSetSpanFiltersWithStorage: jest.Mock;

  beforeEach(() => {
    mockSetSpanFiltersWithStorage = jest.fn();
  });

  const createDefaultProps = (spanFilters: SpanFilter[] = []): SpanStatusFilterProps => ({
    spanFilters,
    setSpanFiltersWithStorage: mockSetSpanFiltersWithStorage,
  });

  describe('basic rendering', () => {
    it('renders filter button and opens popover with selectable options', () => {
      render(<SpanStatusFilter {...createDefaultProps()} />);

      expect(screen.getByTestId('span-status-filter-button')).toBeInTheDocument();
      expect(screen.getByText('Filter by status')).toBeInTheDocument();
      expect(screen.queryByText('0')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('span-status-filter-button'));

      expect(screen.getByTestId('span-status-filter-popover')).toBeInTheDocument();
      expect(screen.getByTestId('status-filter-selectable')).toBeInTheDocument();
    });
  });

  describe('options and filter count', () => {
    it('displays all three status options with correct labels', () => {
      component = shallow(<SpanStatusFilter {...createDefaultProps()} />);

      const options = component.find(EuiSelectable).prop('options');

      expect(options).toHaveLength(3);
      expect(options).toEqual([
        expect.objectContaining({ label: 'Error', key: 'error' }),
        expect.objectContaining({ label: 'OK', key: 'ok' }),
        expect.objectContaining({ label: 'Unset', key: 'unset' }),
      ]);
    });

    it('shows correct count badge for active status filter', () => {
      // Status filter
      const { rerender } = render(
        <SpanStatusFilter {...createDefaultProps([{ field: 'isError', value: true }])} />
      );
      expect(screen.getByText('1')).toBeInTheDocument();

      // Non-status filters ignored
      rerender(
        <SpanStatusFilter
          {...createDefaultProps([
            { field: 'serviceName', value: 'test' },
            { field: 'isError', value: true },
          ])}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  describe('filter selection', () => {
    it('adds correct filter when option is selected', () => {
      component = shallow(<SpanStatusFilter {...createDefaultProps()} />);
      const onChange = component.find(EuiSelectable).prop('onChange')!;

      // Error option
      onChange([
        { label: 'Error', key: 'error', checked: 'on' },
        { label: 'OK', key: 'ok' },
        { label: 'Unset', key: 'unset' },
      ]);
      expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
        { field: 'isError', value: true },
      ]);

      // OK option
      onChange([
        { label: 'Error', key: 'error' },
        { label: 'OK', key: 'ok', checked: 'on' },
        { label: 'Unset', key: 'unset' },
      ]);
      expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
        { field: 'status.code', value: 1 },
      ]);

      // Unset option
      onChange([
        { label: 'Error', key: 'error' },
        { label: 'OK', key: 'ok' },
        { label: 'Unset', key: 'unset', checked: 'on' },
      ]);
      expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
        { field: 'status.code', value: 0 },
      ]);
    });

    it('preserves non-status filters when updating', () => {
      const spanFilters = [
        { field: 'serviceName', value: 'test' },
        { field: 'isError', value: true },
      ];
      component = shallow(<SpanStatusFilter {...createDefaultProps(spanFilters)} />);
      const onChange = component.find(EuiSelectable).prop('onChange')!;

      // Deselect all
      onChange([
        { label: 'Error', key: 'error' },
        { label: 'OK', key: 'ok' },
        { label: 'Unset', key: 'unset' },
      ]);
      expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
        { field: 'serviceName', value: 'test' },
      ]);

      // Select different filter
      onChange([
        { label: 'Error', key: 'error' },
        { label: 'OK', key: 'ok', checked: 'on' },
        { label: 'Unset', key: 'unset' },
      ]);
      expect(mockSetSpanFiltersWithStorage).toHaveBeenCalledWith([
        { field: 'serviceName', value: 'test' },
        { field: 'status.code', value: 1 },
      ]);
    });
  });
});
