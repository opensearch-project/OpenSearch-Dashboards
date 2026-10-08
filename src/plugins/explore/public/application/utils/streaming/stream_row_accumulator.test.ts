/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { StreamRowAccumulator } from './stream_row_accumulator';

const schema = [
  { name: '@timestamp', type: 'timestamp' },
  { name: 'event_id', type: 'int' },
];

/** A window of `n` rows starting at `at`, each carrying its absolute index. */
const window_ = (at: number, n: number, updateMode = 'APPEND') =>
  ({
    schema,
    datarows: Array.from({ length: n }, (_, i) => [`2026-09-15 10:00:00`, at + i]),
    window: { offset: at, count: n },
    update_mode: updateMode,
  }) as any;

const ids = (acc: StreamRowAccumulator) => acc.heldRows.map((r) => r.event_id);

describe('StreamRowAccumulator', () => {
  it('starts empty, asking for the first row', () => {
    const acc = new StreamRowAccumulator(100);
    expect(acc.heldRows).toEqual([]);
    expect(acc.nextOffset).toBe(0);
  });

  it('accumulates successive windows into one prefix', () => {
    const acc = new StreamRowAccumulator(100);
    expect(acc.absorb(window_(0, 10))).toBe(10);
    expect(acc.absorb(window_(10, 10))).toBe(10);
    expect(ids(acc)).toEqual([...Array(20).keys()]);
    expect(acc.nextOffset).toBe(20);
  });

  // The defect this class exists to prevent: a completed job reports REPLACE while serving only the
  // window asked for, and placing by update_mode discarded everything accumulated before it.
  it('appends a terminal REPLACE window rather than replacing what came before', () => {
    const acc = new StreamRowAccumulator(100);
    acc.absorb(window_(0, 10));
    acc.absorb(window_(10, 10));

    acc.absorb(window_(20, 10, 'REPLACE'));

    expect(ids(acc)).toEqual([...Array(30).keys()]);
    expect(acc.nextOffset).toBe(30);
  });

  it('replaces wholesale when the engine re-serves from the start', () => {
    const acc = new StreamRowAccumulator(100);
    acc.absorb(window_(0, 10));
    acc.absorb(window_(10, 10));

    // A provisional set revised from the beginning, as a partial top-N would be.
    const revised = window_(0, 3, 'REPLACE');
    revised.datarows = [
      [`2026-09-15 10:00:00`, 900],
      [`2026-09-15 10:00:00`, 901],
    ];
    acc.absorb(revised);

    expect(ids(acc)).toEqual([900, 901]);
    expect(acc.nextOffset).toBe(2);
  });

  it('advances the generation on replacement so row ids do not carry over', () => {
    const acc = new StreamRowAccumulator(100);
    acc.absorb(window_(0, 5));
    const before = acc.rowGeneration;

    acc.absorb(window_(0, 5, 'REPLACE'));

    expect(acc.rowGeneration).toBe(before + 1);
  });

  it('does not advance the generation on the first window, which replaces nothing', () => {
    const acc = new StreamRowAccumulator(100);
    acc.absorb(window_(0, 5));
    expect(acc.rowGeneration).toBe(0);
  });

  describe('windows that cannot be placed', () => {
    it('ignores a window already held, so a re-served page is not duplicated', () => {
      const acc = new StreamRowAccumulator(100);
      acc.absorb(window_(0, 10));
      acc.absorb(window_(10, 10));

      expect(acc.absorb(window_(10, 10))).toBe(0);
      expect(acc.heldRows).toHaveLength(20);
    });

    it('refuses a window that would leave a gap', () => {
      const acc = new StreamRowAccumulator(100);
      acc.absorb(window_(0, 10));

      expect(acc.absorb(window_(50, 10))).toBe(0);
      // nextOffset still describes what is held, so the run re-requests the right window.
      expect(acc.nextOffset).toBe(10);
    });

    it('treats a window-less snapshot as starting from zero', () => {
      const acc = new StreamRowAccumulator(100);
      const bare = window_(0, 4);
      delete bare.window;
      expect(acc.absorb(bare)).toBe(4);
      expect(acc.nextOffset).toBe(4);
    });

    it('reports nothing added for an empty window', () => {
      const acc = new StreamRowAccumulator(100);
      acc.absorb(window_(0, 10));
      expect(acc.absorb(window_(10, 0))).toBe(0);
      expect(acc.heldRows).toHaveLength(10);
    });
  });

  describe('the hold cap', () => {
    it('stops at the cap and reports only the rows it took', () => {
      const acc = new StreamRowAccumulator(15);
      acc.absorb(window_(0, 10));

      expect(acc.absorb(window_(10, 10))).toBe(5);
      expect(acc.heldRows).toHaveLength(15);
      expect(acc.isFull).toBe(true);
    });

    it('truncates a replacement to the cap', () => {
      const acc = new StreamRowAccumulator(5);
      acc.absorb(window_(0, 20));
      expect(acc.heldRows).toHaveLength(5);
      expect(ids(acc)).toEqual([0, 1, 2, 3, 4]);
    });

    it('is not full before the cap is reached', () => {
      const acc = new StreamRowAccumulator(10);
      acc.absorb(window_(0, 9));
      expect(acc.isFull).toBe(false);
    });
  });
});
