/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { groupSeries, groupSeriesDatasets } from './group_series';

describe('groupSeries', () => {
  const data = [
    { time: '00:00', service: 'a', value: 1 },
    { time: '00:04', service: 'b', value: 9 },
    { time: '00:09', service: 'a', value: 2 },
  ];

  it('keeps each series on its own timeline', () => {
    expect(groupSeries(data, { groupField: 'service', valueField: 'value' })).toEqual([
      {
        name: 'a',
        rows: [
          { time: '00:00', service: 'a', value: 1 },
          { time: '00:09', service: 'a', value: 2 },
        ],
      },
      { name: 'b', rows: [{ time: '00:04', service: 'b', value: 9 }] },
    ]);
  });

  it('sorts the series by name by default', () => {
    const names = groupSeries(
      [
        { time: '00:00', service: 'z', value: 1 },
        { time: '00:00', service: 'm', value: 1 },
        { time: '00:00', service: 'a', value: 1 },
      ],
      { groupField: 'service', valueField: 'value' }
    ).map(({ name }) => name);

    expect(names).toEqual(['a', 'm', 'z']);
  });

  it('keeps a missing measurement as a null instead of reading it as zero', () => {
    // Number(null) and Number('') are both 0, so an absent reading must not reach the
    // cast. The row itself has to survive though, because the null is what draws the
    // break; dropping it would connect straight across a genuine hole.
    const result = groupSeries(
      [
        { time: '00:00', service: 'a', value: null },
        { time: '00:01', service: 'a', value: '' },
        { time: '00:02', service: 'a', value: undefined },
        { time: '00:03', service: 'a', value: 5 },
      ],
      { groupField: 'service', valueField: 'value' }
    );

    expect(result[0].rows.map((row) => row.value)).toEqual([null, null, null, 5]);
    expect(result[0].rows.map((row) => row.time)).toEqual(['00:00', '00:01', '00:02', '00:03']);
  });

  it('keeps a non-numeric value as a null', () => {
    const result = groupSeries(
      [
        { time: '00:00', service: 'a', value: 'not a number' },
        { time: '00:01', service: 'a', value: 5 },
      ],
      { groupField: 'service', valueField: 'value' }
    );

    expect(result[0].rows.map((row) => row.value)).toEqual([null, 5]);
  });

  it('casts numeric strings to numbers', () => {
    const result = groupSeries([{ time: '00:00', service: 'a', value: '5.5' }], {
      groupField: 'service',
      valueField: 'value',
    });

    expect(result[0].rows[0].value).toBe(5.5);
  });

  it('normalizes an empty group name', () => {
    const names = groupSeries([{ time: '00:00', service: '', value: 1 }], {
      groupField: 'service',
      valueField: 'value',
    }).map(({ name }) => name);

    expect(names).toEqual(['(empty)']);
  });

  it('returns nothing for empty input', () => {
    expect(groupSeries([], { groupField: 'service', valueField: 'value' })).toEqual([]);
  });
});

describe('groupSeriesDatasets', () => {
  const data = [
    { time: '00:00', service: 'a', value: 1 },
    { time: '00:04', service: 'b', value: 9 },
    { time: '00:09', service: 'a', value: 2 },
  ];

  it('emits one 2D dataset per series with a fixed column order', () => {
    const result = groupSeriesDatasets({
      groupField: 'service',
      valueField: 'value',
      timeField: 'time',
    })(data);

    expect(result).toEqual([
      [
        ['time', 'value'],
        ['00:00', 1],
        ['00:09', 2],
      ],
      [
        ['time', 'value'],
        ['00:04', 9],
      ],
    ]);
  });

  it('runs perSeries on each series own rows', () => {
    const seen: Array<Array<Record<string, any>>> = [];
    groupSeriesDatasets({
      groupField: 'service',
      valueField: 'value',
      timeField: 'time',
      perSeries: (rows) => {
        seen.push(rows);
        return rows;
      },
    })(data);

    // Each call sees only one series' points, never the union
    expect(seen).toHaveLength(2);
    expect(seen[0].map((row) => row.value)).toEqual([1, 2]);
    expect(seen[1].map((row) => row.value)).toEqual([9]);
  });

  it('reflects rows that perSeries adds', () => {
    const result = groupSeriesDatasets({
      groupField: 'service',
      valueField: 'value',
      timeField: 'time',
      perSeries: (rows) => [...rows, { time: '00:99', value: null }],
    })(data);

    expect(result[0]).toHaveLength(4);
    expect(result[0][3]).toEqual(['00:99', null]);
  });
});
