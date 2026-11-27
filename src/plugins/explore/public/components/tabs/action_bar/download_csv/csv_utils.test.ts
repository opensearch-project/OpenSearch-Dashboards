/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import { buildCsv, buildCsvFromTabular } from './csv_utils';
import { FormattedData } from '../../../../../../inspector/public';
import { indexPatterns } from '../../../../../../data/public';
import { StringFormat } from '../../../../../../data/common';

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

describe('buildCsv: the _source column', () => {
  const uiSettings = { get: (_key: string, defaultValue: unknown) => defaultValue } as any;
  const row = { _source: { service: 'orders', status: 200 } };
  const datasetWith = (field?: object) =>
    ({
      fields: { getByName: () => field },
      flattenHit: (hit: any) => hit._source,
      formatField: () => 'formatted as one value',
      formatHit: (hit: any) => hit._source,
    }) as any;
  const firstCell = (csv: string) => csv.split(/\r?\n/)[1];

  it('writes the whole row for an index pattern that lists _source', () => {
    const csv = buildCsv({
      rows: [row] as any,
      displayedColumnNames: ['_source'],
      indexPattern: datasetWith({ name: '_source', type: '_source' }),
      uiSettings,
    });
    expect(firstCell(csv)).toContain('orders');
  });

  it("writes the whole row for a dataset that doesn't list _source", () => {
    const csv = buildCsv({
      rows: [row] as any,
      displayedColumnNames: ['_source'],
      indexPattern: datasetWith(undefined),
      uiSettings,
    });
    expect(firstCell(csv)).toContain('orders');
    expect(firstCell(csv)).not.toContain('formatted as one value');
  });
});

describe('buildCsv: the _source cell holds the fields the table shows', () => {
  const uiSettings = { get: (_key: string, defaultValue: unknown) => defaultValue } as any;
  const metaFields = ['_id', '_index', '_type', '_score', '_source'];
  const fields = [{ name: '_source', type: '_source' }, { name: 'service' }];
  // Wired like IndexPattern: flattenHitWrapper adds the meta fields to every flattened hit.
  const createDataset = () => {
    const dataset: any = {
      metaFields,
      fields: { getByName: (name: string) => fields.find((field) => field.name === name) },
      getFormatterForField: () => new StringFormat(),
    };
    dataset.flattenHit = indexPatterns.flattenHitWrapper(dataset, metaFields);
    dataset.formatHit = indexPatterns.formatHitProvider(dataset, new StringFormat());
    dataset.formatField = dataset.formatHit.formatField;
    return dataset;
  };

  it('keeps the columns as the table shows them', () => {
    const csv = buildCsv({
      rows: [{ _id: '1', _source: { service: 'orders' } }] as any,
      displayedColumnNames: ['_source'],
      indexPattern: createDataset(),
      uiSettings,
    });
    expect(csv.split(/\r?\n/)[0]).toBe('"_source"');
  });

  it('leaves out meta fields and the data importer lookup field', () => {
    const csv = buildCsv({
      rows: [
        {
          _id: '1',
          _index: 'logs',
          _source: { service: 'orders', personal: { name: 'Ann' }, __lookup: 'import-1' },
        },
      ] as any,
      displayedColumnNames: ['_source'],
      indexPattern: createDataset(),
      uiSettings,
    });
    const cell = JSON.parse(Papa.parse(csv).data[1][0] as string);
    expect(cell).toEqual({ service: 'orders', 'personal.name': 'Ann' });
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
