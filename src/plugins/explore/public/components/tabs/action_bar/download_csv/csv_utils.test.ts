/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { buildCsv, buildCsvFromTabular } from './csv_utils';
import { FormattedData } from '../../../../../../inspector/public';

describe('buildCsv', () => {
  const uiSettings = { get: (_key: string, defaultValue: unknown) => defaultValue } as any;

  const createIndexPattern = (timeFieldName?: string) =>
    ({
      timeFieldName,
      fields: { getByName: (name: string) => ({ name }) },
      flattenHit: (hit: any) => ({ ...hit._source }),
      formatField: (hit: any, name: string) => hit._source?.[name] ?? '-',
      formatHit: (hit: any) => hit._source,
    }) as any;

  const header = (csv: string) => csv.split(/\r?\n/)[0];

  it('keeps the time column when rows carry a time value', () => {
    const csv = buildCsv({
      rows: [{ _source: { '@timestamp': '2026-09-01', host: 'a' } }] as any,
      displayedColumnNames: ['@timestamp', 'host'],
      indexPattern: createIndexPattern('@timestamp'),
      uiSettings,
    });

    expect(header(csv)).toBe('"@timestamp","host"');
  });

  it('keeps the time column when only some rows carry a time value', () => {
    const csv = buildCsv({
      rows: [
        { _source: { '@timestamp': '2026-09-01', host: 'a' } },
        { _source: { host: 'b' } },
      ] as any,
      displayedColumnNames: ['@timestamp', 'host'],
      indexPattern: createIndexPattern('@timestamp'),
      uiSettings,
    });

    expect(csv).toBe('"@timestamp","host"\r\n"2026-09-01","a"\r\n"-","b"');
  });

  it('leaves the columns unchanged when the dataset has no time field', () => {
    const csv = buildCsv({
      rows: [{ _source: { host: 'a' } }] as any,
      displayedColumnNames: ['host'],
      indexPattern: createIndexPattern(undefined),
      uiSettings,
    });

    expect(header(csv)).toBe('"host"');
  });
});

describe('buildCsvFromTabular', () => {
  const uiSettings = { get: (_key: string, defaultValue: unknown) => defaultValue } as any;

  it('writes the tabular columns as the header and the formatted values as rows', () => {
    const csv = buildCsvFromTabular(
      {
        columns: [
          { name: 'host', field: 'host' },
          { name: 'count()', field: 'count()' },
        ],
        rows: [{ host: new FormattedData('a', 'a'), 'count()': new FormattedData(3, '3') }],
      },
      uiSettings
    );

    expect(csv).toBe('"host","count()"\r\n"a","3"');
  });

  it('writes an empty cell for a column the row lacks', () => {
    const csv = buildCsvFromTabular(
      { columns: [{ name: 'host', field: 'host' }], rows: [{}] },
      uiSettings
    );

    expect(csv).toBe('"host"\r\n""');
  });
});
