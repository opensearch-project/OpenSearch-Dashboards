/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/*
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { StringFormat } from '../../../../../data/common';
import { IndexPattern, indexPatterns } from '../../../../../data/public';
import { SourceFieldTableCell } from './source_field_table_cell';

// Simple mocks
jest.mock('../../../helpers/shorten_dotted_string', () => ({
  shortenDottedString: jest.fn((str) => `short_${str}`),
}));

const PRE = '@opensearch-dashboards-highlighted-field@';
const POST = '@/opensearch-dashboards-highlighted-field@';

describe('SourceFieldTableCell', () => {
  const stringFormatter = new StringFormat();
  const mockDataset = {
    fields: { getByName: jest.fn() },
    getFormatterForField: jest.fn(),
    flattenHit: jest.fn(),
  };

  const mockRow = {
    _id: 'test-row-1',
    _index: 'test-index',
    _source: { field1: 'value1' },
  };

  const defaultProps = {
    colName: 'test-column',
    dataset: mockDataset,
    row: mockRow,
    isShortDots: false,
  };

  const renderInTable = (props: any) => {
    return render(
      <table>
        <tbody>
          <tr>
            <SourceFieldTableCell {...props} />
          </tr>
        </tbody>
      </table>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDataset.fields.getByName.mockReturnValue(undefined);
    mockDataset.getFormatterForField.mockReturnValue(stringFormatter);
    mockDataset.flattenHit.mockImplementation(
      indexPatterns.flattenHitWrapper(mockDataset as unknown as IndexPattern)
    );
  });

  it('renders table cell with correct structure', () => {
    renderInTable(defaultProps);

    const cell = screen.getByTestId('docTableField');
    expect(cell).toBeInTheDocument();
    expect(cell).toHaveClass('exploreDocTableCell__source');
    expect(screen.queryByTestId('sourceFieldPreviewHint')).not.toBeInTheDocument();
  });

  it('uses the configured field formatter for the inline value', () => {
    mockDataset.fields.getByName.mockReturnValue({ name: 'field1', type: 'string' });
    mockDataset.getFormatterForField.mockReturnValue({
      convert: () => 'formatted value',
    });
    renderInTable(defaultProps);

    expect(screen.getByTestId('sourceFieldValue')).toHaveTextContent('formatted value');
  });

  it('prioritizes root and dotted highlights before the cap, preserving their values and field order', () => {
    const longValue = 'x'.repeat(1000);
    const fields = Object.fromEntries(
      Array.from({ length: 12 }, (_, index) => [`field${index}`, `value${index}`])
    );
    const rowWithHighlight = {
      ...mockRow,
      _source: { ...fields, firstname: 'Holmes', attributes: [{ http: { status: longValue } }] },
      highlight: {
        'attributes.http.status': [`before ${PRE}${longValue}${POST} after`],
        attributes: [`${PRE}parent${POST}`],
        field0: [],
        firstname: [`${PRE}Holmes${POST}`],
      },
    };

    renderInTable({ ...defaultProps, row: rowWithHighlight });

    expect(screen.getAllByTestId('sourceFieldKey').map((field) => field.textContent)).toEqual([
      'firstname:',
      'attributes.http.status:',
      ...Array.from({ length: 8 }, (_, index) => `field${index}:`),
    ]);
    const values = screen.getAllByTestId('sourceFieldValue');
    expect(values.map((value) => value.textContent)).toEqual([
      'Holmes',
      `before ${longValue} after`,
      ...Array.from({ length: 8 }, (_, index) => `value${index}`),
    ]);
    expect(values.map((value) => value.querySelector('mark')?.textContent)).toEqual([
      'Holmes',
      longValue,
      ...Array(8).fill(undefined),
    ]);
    expect(mockDataset.getFormatterForField).toHaveBeenCalledTimes(10);
    expect(screen.getByTestId('sourceFieldPreviewHint')).toBeInTheDocument();
  });

  it.each([10, 12])(
    'keeps the cap and omission hint correct with %i highlighted fields',
    (count) => {
      const fields = Object.fromEntries(
        Array.from({ length: count }, (_, index) => [`field${index}`, `value${index}`])
      );
      renderInTable({
        ...defaultProps,
        row: {
          ...mockRow,
          _source: fields,
          highlight: Object.fromEntries(
            Object.entries(fields)
              .reverse()
              .map(([key, value]) => [key, [`${PRE}${value}${POST}`]])
          ),
        },
      });

      expect(screen.getAllByTestId('sourceFieldKey').map((field) => field.textContent)).toEqual(
        Array.from({ length: 10 }, (_, index) => `field${index}:`)
      );
      expect(screen.getAllByTestId('sourceFieldValue').map((value) => value.textContent)).toEqual(
        Array.from({ length: 10 }, (_, index) => `value${index}`)
      );
      expect(mockDataset.getFormatterForField).toHaveBeenCalledTimes(10);
      expect(Boolean(screen.queryByTestId('sourceFieldPreviewHint'))).toBe(count > 10);
    }
  );

  it('renders plain text when no highlight exists for field', () => {
    renderInTable({
      ...defaultProps,
      row: { ...mockRow, _source: { firstname: 'Holmes' } },
    });

    const valueEl = screen.getByTestId('sourceFieldValue');
    expect(valueEl.textContent).toBe('Holmes');
    expect(valueEl.querySelector('mark')).toBeNull();
  });

  it('renders field names and values', () => {
    renderInTable({
      ...defaultProps,
      row: { ...mockRow, _source: { field1: 'value1', field2: 'value2' } },
    });

    expect(screen.getByText('field1:')).toBeInTheDocument();
    expect(screen.getByText('field2:')).toBeInTheDocument();
  });

  it.each([7, 12])(
    'omits parent containers and hints only when fields are omitted (%i children)',
    async (fieldCount) => {
      const fields = Object.fromEntries(
        Array.from({ length: fieldCount }, (_, index) => [`field${index}`, 'x'.repeat(250)])
      );
      const tags = ['one', 'two'];
      mockDataset.fields.getByName.mockImplementation((name) =>
        name === 'emptyObject' ? { name, type: 'object' } : undefined
      );
      renderInTable({
        ...defaultProps,
        dataset: { ...mockDataset, metaFields: ['_id'] },
        row: {
          ...mockRow,
          _source: {
            _id: 'test-row-1',
            emptyObject: {},
            emptyArray: [],
            tags,
            attributes: [{ http: [{ request: [fields] }] }],
          },
        },
      });

      expect(screen.getAllByTestId('sourceFieldKey').map((field) => field.textContent)).toEqual([
        'emptyObject:',
        'emptyArray:',
        'tags:',
        ...Array.from({ length: 7 }, (_, index) => `attributes.http.request.field${index}:`),
      ]);
      const values = screen.getAllByTestId('sourceFieldValue');
      expect(values.map((value) => value.textContent)).toEqual([
        '{}',
        '[]',
        stringFormatter.convert(tags, 'text'),
        ...Array(7).fill('x'.repeat(250)),
      ]);
      expect(mockDataset.getFormatterForField).toHaveBeenCalledTimes(10);

      if (fieldCount === 7) {
        expect(screen.queryByTestId('sourceFieldPreviewHint')).not.toBeInTheDocument();
      } else {
        fireEvent.mouseOver(screen.getByTestId('sourceFieldPreviewHint'));
        expect(
          await screen.findByText('Expand the document to see all fields.')
        ).toBeInTheDocument();
      }
    }
  );

  it.each([{ computed: 'source value' }, undefined])(
    'preserves returned field values with source %p',
    (source) => {
      const fields = { computed: ['returned value'], tags: ['one', 'two'], _private: ['hidden'] };
      renderInTable({
        ...defaultProps,
        row: { ...mockRow, _source: source, fields },
      });

      expect(screen.getAllByTestId('sourceFieldKey').map((field) => field.textContent)).toEqual([
        'computed:',
        'tags:',
      ]);
      expect(screen.getAllByTestId('sourceFieldValue').map((field) => field.textContent)).toEqual([
        'returned value',
        stringFormatter.convert(['one', 'two'], 'text'),
      ]);
    }
  );

  it('selects leaf fields when returned fields put many parent containers before their children', () => {
    const count = 1000;
    const parents = Object.fromEntries(
      Array.from({ length: count }, (_, index) => [`group${index}`, [{ value: index }]])
    );
    const children = Object.fromEntries(
      Array.from({ length: count }, (_, index) => [`group${index}.value`, [index]])
    );
    renderInTable({
      ...defaultProps,
      row: { ...mockRow, _source: {}, fields: { ...parents, ...children } },
    });

    expect(screen.getAllByTestId('sourceFieldKey').map((field) => field.textContent)).toEqual(
      Array.from({ length: 10 }, (_, index) => `group${index}.value:`)
    );
    expect(screen.getAllByTestId('sourceFieldValue').map((field) => field.textContent)).toEqual(
      Array.from({ length: 10 }, (_, index) => String(index))
    );
    expect(mockDataset.getFormatterForField).toHaveBeenCalledTimes(10);
    expect(screen.getByTestId('sourceFieldPreviewHint')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    renderInTable({ ...defaultProps, row: { ...mockRow, _source: {} } });

    const cell = screen.getByTestId('docTableField');
    expect(cell).toBeInTheDocument();
  });

  it('excludes the __lookup metadata field from the inline _source display', () => {
    renderInTable({
      ...defaultProps,
      row: {
        ...mockRow,
        _source: { host_name: 'web-01', __lookup: 'c0ffee-uuid' },
        highlight: { __lookup: [`${PRE}c0ffee-uuid${POST}`] },
      },
    });

    expect(screen.getByText('host_name:')).toBeInTheDocument();
    expect(screen.queryByText('__lookup:')).not.toBeInTheDocument();
    expect(screen.queryByText('c0ffee-uuid')).not.toBeInTheDocument();
  });
});
