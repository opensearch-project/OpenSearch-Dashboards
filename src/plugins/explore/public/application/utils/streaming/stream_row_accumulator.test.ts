/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamRowAccumulator } from './stream_row_accumulator';

const schema = [
  { name: '@timestamp', type: 'timestamp' },
  { name: 'event_id', type: 'int' },
];

/** A snapshot holding the first `n` rows of a result, each carrying its index. */
const firstRows = (n: number) =>
  ({
    schema,
    datarows: Array.from({ length: n }, (_, i) => [`2026-09-15 10:00:00`, i]),
  }) as any;

const rowsWithIds = (eventIds: number[]) =>
  ({ schema, datarows: eventIds.map((id) => [`2026-09-15 10:00:00`, id]) }) as any;

const ids = (acc: StreamRowAccumulator) => acc.heldRows.map((r) => r.event_id);

describe('StreamRowAccumulator', () => {
  it('starts empty', () => {
    expect(new StreamRowAccumulator().heldRows).toEqual([]);
  });

  // Every snapshot carries all the rows found so far, so appending would repeat them.
  it('replaces the held rows with each snapshot', () => {
    const acc = new StreamRowAccumulator();
    expect(acc.absorb(firstRows(10))).toBe(10);
    expect(acc.absorb(firstRows(25))).toBe(25);
    expect(ids(acc)).toEqual([...Array(25).keys()]);
  });

  it('takes a revised result as it is', () => {
    const acc = new StreamRowAccumulator();
    acc.absorb(firstRows(10));

    acc.absorb(rowsWithIds([900, 901]));

    expect(ids(acc)).toEqual([900, 901]);
  });

  // The backend drops a query's rows when it falls back to the legacy engine.
  it('drops the held rows when a snapshot has none', () => {
    const acc = new StreamRowAccumulator();
    acc.absorb(firstRows(10));

    expect(acc.absorb(firstRows(0))).toBe(0);
    expect(acc.heldRows).toEqual([]);
    expect(acc.rowGeneration).toBe(1);
  });

  // The backend's fetch_size bounds the rows; the client keeps every one it is sent.
  it('holds every row of a snapshot, however many', () => {
    const acc = new StreamRowAccumulator();
    expect(acc.absorb(firstRows(250_000))).toBe(250_000);
  });

  describe('row generation', () => {
    it('does not advance on the first snapshot, which replaces nothing', () => {
      const acc = new StreamRowAccumulator();
      acc.absorb(firstRows(5));
      expect(acc.rowGeneration).toBe(0);
    });

    // A scan appends to its result; changing the generation would remount every row each poll.
    it('does not advance when the new rows extend the held ones', () => {
      const acc = new StreamRowAccumulator();
      acc.absorb(firstRows(5));

      acc.absorb(firstRows(5));
      acc.absorb(firstRows(12));

      expect(acc.rowGeneration).toBe(0);
    });

    it('advances when the held rows change, so their ids do not carry over', () => {
      const acc = new StreamRowAccumulator();
      acc.absorb(firstRows(5));

      acc.absorb(rowsWithIds([100, 101, 102, 103, 104, 105]));

      expect(acc.rowGeneration).toBe(1);
    });

    // A nested field value is a fresh object each poll, so reference equality would see every
    // snapshot as a change.
    it('does not advance when identical rows carry a nested field', () => {
      const nested = () =>
        ({
          schema: [
            { name: '@timestamp', type: 'timestamp' },
            { name: 'geo', type: 'geo_point' },
          ],
          datarows: [['2026-09-15 10:00:00', { lat: 1, lon: 2 }]],
        }) as any;
      const acc = new StreamRowAccumulator();
      acc.absorb(nested());

      acc.absorb(nested());

      expect(acc.rowGeneration).toBe(0);
    });
  });
});
