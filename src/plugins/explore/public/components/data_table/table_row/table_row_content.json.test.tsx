/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { TableRowContent, TableRowContentProps } from './table_row_content';

jest.mock('../table_cell/table_cell', () => ({
  TableCell: ({ columnId, splitDateTime, jsonValue }: any) => (
    <td
      data-test-subj={`cell-${columnId}`}
      data-split={String(!!splitDateTime)}
      data-json={jsonValue === undefined ? '' : JSON.stringify(jsonValue)}
    />
  ),
}));

jest.mock('../table_cell/non_filterable_table_cell', () => ({
  NonFilterableTableCell: ({ columnId }: any) => <td data-test-subj={`plain-${columnId}`} />,
}));

let mockFormatJson = true;
jest.mock('../table_cell/json_tree/format_json_setting', () => ({
  useFormatJson: () => mockFormatJson,
}));

describe('TableRowContent JSON cells and date/time split', () => {
  const makeProps = (payload: unknown, filterable = true): TableRowContentProps => {
    const source = { '@timestamp': '2026-10-10T10:05:00.000Z', payload, message: 'plain' };
    return {
      row: { _index: 'idx', _id: '1', _source: source } as any,
      columns: ['@timestamp', 'payload', 'message'],
      dataset: {
        timeFieldName: '@timestamp',
        flattenHit: () => source,
        formatField: (_row: unknown, name: string) => String((source as any)[name]),
        fields: {
          getByName: (name: string) => ({
            name,
            type: name === '@timestamp' ? 'date' : 'string',
            filterable: name === 'payload' ? filterable : true,
          }),
        },
      } as any,
      isShortDots: false,
      isExpanded: false,
      onToggleExpand: jest.fn(),
      isOnTracesPage: false,
    };
  };

  const renderRow = (payload: unknown, filterable?: boolean) =>
    render(
      <table>
        <tbody>
          <TableRowContent {...makeProps(payload, filterable)} />
        </tbody>
      </table>
    );

  beforeEach(() => {
    mockFormatJson = true;
  });

  it('splits the time cell of a row that shows a JSON tree', () => {
    renderRow('{"a":{"b":1}}');
    expect(screen.getByTestId('cell-@timestamp')).toHaveAttribute('data-split', 'true');
    // only the time cell is asked to split
    expect(screen.getByTestId('cell-payload')).toHaveAttribute('data-split', 'false');
  });

  it('parses the JSON once and passes it to the cell that shows it', () => {
    renderRow('{"a":{"b":1}}');
    expect(screen.getByTestId('cell-payload')).toHaveAttribute('data-json', '{"a":{"b":1}}');
    expect(screen.getByTestId('cell-message')).toHaveAttribute('data-json', '');
    expect(screen.getByTestId('cell-@timestamp')).toHaveAttribute('data-json', '');
  });

  it('shows no tree, and keeps the time on one line, for a non-filterable JSON field', () => {
    // e.g. a raw payload mapped with `index: false`, rendered by NonFilterableTableCell
    renderRow('{"a":{"b":1}}', false);
    expect(screen.getByTestId('plain-payload')).toBeInTheDocument();
    expect(screen.getByTestId('cell-@timestamp')).toHaveAttribute('data-split', 'false');
  });

  it('keeps the time on one line in a row without JSON', () => {
    renderRow('not json');
    expect(screen.getByTestId('cell-@timestamp')).toHaveAttribute('data-split', 'false');
  });

  it('keeps the time on one line when JSON formatting is off', () => {
    mockFormatJson = false;
    renderRow('{"a":{"b":1}}');
    expect(screen.getByTestId('cell-@timestamp')).toHaveAttribute('data-split', 'false');
    expect(screen.getByTestId('cell-payload')).toHaveAttribute('data-json', '');
  });

  it('keeps the time on one line when the JSON field has its own format', () => {
    const props = makeProps('{"a":{"b":1}}');
    render(
      <table>
        <tbody>
          <TableRowContent
            {...props}
            dataset={{ ...props.dataset, fieldFormatMap: { payload: { id: 'url' } } } as any}
          />
        </tbody>
      </table>
    );
    expect(screen.getByTestId('cell-@timestamp')).toHaveAttribute('data-split', 'false');
    expect(screen.getByTestId('cell-payload')).toHaveAttribute('data-json', '');
  });

  it('ignores JSON in fields that are not displayed columns', () => {
    const props = makeProps('{"a":1}');
    render(
      <table>
        <tbody>
          <TableRowContent {...props} columns={['@timestamp', 'message']} />
        </tbody>
      </table>
    );
    expect(screen.getByTestId('cell-@timestamp')).toHaveAttribute('data-split', 'false');
  });
});
