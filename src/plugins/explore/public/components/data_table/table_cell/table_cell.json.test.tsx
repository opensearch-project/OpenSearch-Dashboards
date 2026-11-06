/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import moment from 'moment';
import { render, screen, fireEvent } from '@testing-library/react';
import { TableCell, ITableCellProps } from './table_cell';
import { useDatasetContext } from '../../../application/context';

jest.mock('../../../application/context', () => ({
  useDatasetContext: jest.fn(),
}));

jest.mock('../../../application/pages/traces/trace_flyout/trace_flyout_context');

jest.mock('../../log_action_menu', () => ({
  LogActionMenu: () => <div data-test-subj="logActionMenu" />,
}));

let mockFormatJson = true;
jest.mock('./json_tree/format_json_setting', () => ({
  useFormatJson: () => mockFormatJson,
}));

describe('TableCell JSON and date rendering', () => {
  const payload = '{"order_id":1002,"error":{"code":502,"detail":"upstream timeout"}}';
  const rowData = {
    _index: 'idx',
    _id: 'doc-1',
    _source: { payload_raw: payload },
  } as any;
  const flattened = {
    payload_raw: payload,
    'payload.order_id': 1002,
    'payload.error.code': 502,
    'payload.error.detail': 'upstream timeout',
  };

  class FakeDateFormat {
    type = FakeDateFormat;
    constructor(private readonly formatParams: Record<string, unknown>) {}
    param = (name: string) => this.formatParams[name];
    params = () => ({ ...this.formatParams });
    convert = (value: unknown) =>
      moment.utc(value as string).format(this.formatParams.pattern as string);
  }

  const dataset = {
    id: 'ds',
    title: 'idx*',
    flattenHit: () => flattened,
    fields: { getByName: (name: string) => ({ name, filterable: name !== 'payload.order_id' }) },
    getFormatterForField: () => new FakeDateFormat({ pattern: 'MMM D, YYYY @ HH:mm:ss' }),
  } as any;

  const onFilter = jest.fn();
  const props: ITableCellProps = {
    columnId: 'payload_raw',
    sanitizedCellValue: payload,
    fieldMapping: payload,
    rowData,
    dataset,
    onFilter,
    isTimeField: false,
    isOnTracesPage: false,
    setIsRowSelected: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatJson = true;
    (useDatasetContext as jest.Mock).mockReturnValue({ dataset, isLoading: false, error: null });
  });

  it('renders a JSON string value as a tree, without the whole-cell value filters', () => {
    render(<TableCell {...props} />);
    expect(screen.getByTestId('exploreJsonTree')).toBeInTheDocument();
    expect(screen.queryByTestId('osdDocTableCellDataField')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filterForValue')).not.toBeInTheDocument();
    expect(screen.queryByTestId('filterOutValue')).not.toBeInTheDocument();
  });

  it('renders the plain value when JSON formatting is turned off', () => {
    mockFormatJson = false;
    render(<TableCell {...props} />);
    expect(screen.queryByTestId('exploreJsonTree')).not.toBeInTheDocument();
    expect(screen.getByTestId('osdDocTableCellDataField')).toBeInTheDocument();
    expect(screen.getByTestId('filterForValue')).toBeInTheDocument();
  });

  it('does not render a tree for non-JSON strings or object values', () => {
    const { unmount } = render(
      <TableCell {...props} fieldMapping="plain text" sanitizedCellValue="plain text" />
    );
    expect(screen.queryByTestId('exploreJsonTree')).not.toBeInTheDocument();
    unmount();
    render(<TableCell {...props} fieldMapping={{ a: 1 }} sanitizedCellValue="{}" />);
    expect(screen.queryByTestId('exploreJsonTree')).not.toBeInTheDocument();
  });

  it('filters a leaf on the indexed field that holds the same value', () => {
    render(<TableCell {...props} />);
    fireEvent.click(screen.getAllByTestId('jsonTreeToggle')[1]); // expand `error`
    // `order_id` maps to a non-filterable field, so only `code` and `detail` get buttons
    expect(screen.getAllByTestId('jsonTreeLeafFilter')).toHaveLength(2);

    fireEvent.click(screen.getAllByTestId('jsonTreeFilterFor')[1]);
    expect(onFilter).toHaveBeenLastCalledWith('payload.error.detail', 'upstream timeout', '+');
    fireEvent.click(screen.getAllByTestId('jsonTreeFilterOut')[0]);
    expect(onFilter).toHaveBeenLastCalledWith('payload.error.code', 502, '-');
  });

  describe('time column', () => {
    const timeProps: ITableCellProps = {
      ...props,
      columnId: '@timestamp',
      isTimeField: true,
      fieldMapping: '2026-10-10T10:05:00.000Z',
      sanitizedCellValue: 'Oct 10, 2026 @ 10:05:00',
    };

    it('keeps the formatted value on one line by default', () => {
      render(<TableCell {...timeProps} />);
      expect(screen.getByTestId('osdDocTableCellDataField').innerHTML).toBe(
        'Oct 10, 2026 @ 10:05:00'
      );
    });

    it('shows the date and the time on separate lines when asked to split', () => {
      render(<TableCell {...timeProps} splitDateTime />);
      const spans = screen.getByTestId('osdDocTableCellDataField').querySelectorAll('span');
      expect(Array.from(spans).map((span) => span.textContent)).toEqual([
        'Oct 10, 2026',
        '10:05:00',
      ]);
    });

    it('falls back to one line when the value cannot be split', () => {
      render(<TableCell {...timeProps} splitDateTime fieldMapping={['a', 'b']} />);
      expect(screen.getByTestId('osdDocTableCellDataField').innerHTML).toBe(
        'Oct 10, 2026 @ 10:05:00'
      );
    });
  });
});
