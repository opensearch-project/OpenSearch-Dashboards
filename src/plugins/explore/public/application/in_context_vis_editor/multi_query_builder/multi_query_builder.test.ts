/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MultiQueryBuilder } from './multi_query_builder';
import { RowListItem, buildSingleQueryToList } from './utils';
import {
  EditorMode,
  QueryExecutionStatus,
} from '../../../application/utils/state_management/types';

// Rows here never load a dataset or run: no service is read.
const getServices = () => ({}) as any;

const errorStatus = {
  status: QueryExecutionStatus.ERROR,
  error: {
    statusCode: 400,
    error: 'Bad Request',
    message: { details: 'boom', reason: 'Invalid query' },
    originalErrorMessage: 'boom',
  },
};

describe('MultiQueryBuilder', () => {
  let container: MultiQueryBuilder;
  let emitted: RowListItem[][];

  beforeEach(() => {
    container = new MultiQueryBuilder(getServices);
    emitted = [];
  });

  afterEach(() => {
    container.dispose();
  });

  describe('getQueryRowItems$', () => {
    it('emits [] without rows', () => {
      container.getQueryRowItems$().subscribe((items) => emitted.push(items));
      expect(emitted).toEqual([[]]);
      expect(container.getQueryRowItems()).toEqual([]);
    });

    it('lists every row in row order, hidden ones included', () => {
      container.addRow({ refId: 'A' });
      container.addRow({ refId: 'B', savedEditorState: { isHidden: true } });
      container.getQueryRowItems$().subscribe((items) => emitted.push(items));

      const expected = [
        { refId: 'A', isHidden: false, isValid: true },
        { refId: 'B', isHidden: true, isValid: true },
      ];
      expect(emitted[emitted.length - 1]).toEqual(expected);
      expect(container.getQueryRowItems()).toEqual(expected);

      container.reorderRows(1, 0);
      expect(emitted[emitted.length - 1].map((item) => item.refId)).toEqual(['B', 'A']);
    });

    it('follows hide and error changes, and added / removed rows', () => {
      const rowA = container.addRow({ refId: 'A' });
      container.getQueryRowItems$().subscribe((items) => emitted.push(items));

      rowA.updateQueryEditorState({ isHidden: true });
      expect(emitted[emitted.length - 1]).toEqual([{ refId: 'A', isHidden: true, isValid: true }]);

      rowA.updateQueryEditorState({ queryStatus: errorStatus });
      expect(emitted[emitted.length - 1]).toEqual([{ refId: 'A', isHidden: true, isValid: false }]);

      container.addRow({ refId: 'B' });
      expect(emitted[emitted.length - 1].map((item) => item.refId)).toEqual(['A', 'B']);

      container.removeRow('A');
      expect(emitted[emitted.length - 1].map((item) => item.refId)).toEqual(['B']);
    });

    it("doesn't re-emit for editor changes outside the listed fields", () => {
      const rowA = container.addRow({ refId: 'A' });
      container.getQueryRowItems$().subscribe((items) => emitted.push(items));
      const count = emitted.length;

      rowA.updateQueryEditorState({ userInitiatedQuery: true });
      rowA.updateQueryState({ query: 'source = logs' });
      expect(emitted.length).toBe(count);
    });
  });

  describe('splitRow', () => {
    const promql = (query: string, perQueryOptions?: any[]) =>
      ({ query, language: 'PROMQL', dataset: undefined, queryOptions: { perQueryOptions } }) as any;

    it('replaces an old-format row with one row per expression, in place', () => {
      container.addRow({ refId: 'A', savedQueryState: promql('up;\nrate(x[5m]);') });
      container.addRow({ refId: 'C' });
      const source = container.getRow('A');

      const created = container.splitRow('A');

      expect(created.map((row) => row.refId)).toEqual(['A', 'B']);
      expect(container.getAllRows().map((row) => row.refId)).toEqual(['A', 'B', 'C']);
      expect(container.getRow('A')).not.toBe(source);
      expect(container.getRow('A')?.queryState$.getValue().query).toBe('up');
      expect(container.getRow('B')?.queryState$.getValue().query).toBe('rate(x[5m])');
    });

    it('gives each row its own perQueryOptions entry and the hidden flag', () => {
      container.addRow({
        refId: 'A',
        savedQueryState: promql('up; down', [{ minStep: '1m' }, { legendFormat: '{{job}}' }]),
        savedEditorState: { isHidden: true },
      });

      const [first, second] = container.splitRow('A');

      expect(first.queryState$.getValue().queryOptions?.perQueryOptions).toEqual([
        { minStep: '1m' },
      ]);
      expect(second.queryState$.getValue().queryOptions?.perQueryOptions).toEqual([
        { legendFormat: '{{job}}' },
      ]);
      expect(second.getQueryEditorState().isHidden).toBe(true);
    });

    it('takes a new refId when the label is in use, and later rows skip the labels taken', () => {
      container.addRow({ refId: 'C', savedQueryState: promql('up; down') });
      container.addRow({ refId: 'B' });

      const created = container.splitRow('C');
      // B is taken: the second expression gets a new refId.
      expect(created[0].refId).toBe('C');
      expect(created[1].refId).not.toBe('B');

      const added = container.addRow();
      expect(['B', 'C', created[1].refId]).not.toContain(added.refId);
    });

    it('does nothing for a single expression', () => {
      container.addRow({ refId: 'A', savedQueryState: promql('up') });
      expect(container.splitRow('A')).toEqual([]);
      expect(container.getAllRows()).toHaveLength(1);
    });
  });
});

describe('MultiQueryBuilder (rows, selection, execution, results)', () => {
  let container: MultiQueryBuilder;
  const ppl = (query: string, dataset?: any) => ({ query, language: 'PPL', dataset }) as any;
  const logs = { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' };
  const readyStatus = { status: QueryExecutionStatus.READY };
  const result = (id: string) =>
    ({ hits: { hits: [{ _id: id, _source: { id } }] }, fieldSchema: [] }) as any;

  beforeEach(() => {
    container = new MultiQueryBuilder(getServices);
  });

  afterEach(() => {
    container.dispose();
  });

  describe('rows', () => {
    it('adds rows A, B, … and selects only the first one added', () => {
      const first = container.addRow();
      const second = container.addRow();

      expect([first.refId, second.refId]).toEqual(['A', 'B']);
      expect(container.getSelectedRow()).toBe(first);
    });

    it("doesn't remove the last row", () => {
      container.addRow({ refId: 'A' });
      container.removeRow('A');
      expect(container.getAllRows()).toHaveLength(1);
    });

    it('moves the selection to the first row when the selected one is removed', () => {
      container.addRow({ refId: 'A' });
      const rowB = container.addRow({ refId: 'B' });
      const dispose = jest.spyOn(rowB, 'dispose');
      container.selectRow('B');

      container.removeRow('B');

      expect(container.getAllRows().map((row) => row.refId)).toEqual(['A']);
      expect(container.getSelectedRow()?.refId).toBe('A');
      expect(dispose).toHaveBeenCalled();
    });

    it("doesn't reuse a removed refId", () => {
      container.addRow();
      container.addRow();
      container.removeRow('B');
      expect(container.addRow().refId).toBe('C');
    });

    it('ignores an out-of-range or same-position reorder', () => {
      container.addRow({ refId: 'A' });
      container.addRow({ refId: 'B' });
      const before = container.getAllRows();

      container.reorderRows(0, 0);
      container.reorderRows(-1, 1);
      container.reorderRows(0, 5);

      expect(container.getAllRows()).toBe(before);
    });
  });

  describe('duplicateRow', () => {
    it('inserts the copy right after the source under a new refId', () => {
      container.addRow({ refId: 'A', savedQueryState: ppl('source = a', logs) });
      container.addRow({ refId: 'B' });
      container.addRow({ refId: 'C' });

      const copy = container.duplicateRow('A');

      expect(copy?.refId).toBe('D');
      expect(container.getAllRows().map((row) => row.refId)).toEqual(['A', 'D', 'B', 'C']);
    });

    it("copies the editor's unsent text, the dataset (not shared) and the hidden flag", () => {
      const source = container.addRow({
        refId: 'A',
        savedQueryState: ppl('source = a', logs),
        savedEditorState: { isHidden: true },
      });
      source.editorRef.current = { getValue: () => 'source = a | head 5' } as any;

      const copy = container.duplicateRow('A');

      expect(copy?.queryState$.getValue().query).toBe('source = a | head 5');
      expect(copy?.queryState$.getValue().dataset).toEqual(logs);
      expect(copy?.queryState$.getValue().dataset).not.toBe(source.queryState$.getValue().dataset);
      expect(copy?.getQueryEditorState().isHidden).toBe(true);
    });

    it('copies the generated query, not the prompt, in Prompt mode', () => {
      const source = container.addRow({ refId: 'A', savedQueryState: ppl('', logs) });
      source.updateQueryEditorState({
        editorMode: EditorMode.Prompt,
        lastExecutedTranslatedQuery: 'source = logs | stats count()',
      });
      source.editorRef.current = { getValue: () => 'how many logs?' } as any;

      expect(container.duplicateRow('A')?.queryState$.getValue().query).toBe(
        'source = logs | stats count()'
      );
    });

    it('returns undefined for an unknown row', () => {
      expect(container.duplicateRow('Z')).toBeUndefined();
    });
  });

  describe('selection', () => {
    it('ignores an unknown refId', () => {
      container.addRow({ refId: 'A' });
      container.selectRow('Z');
      expect(container.multiQueryEditorState$.getValue().selectedRowRefId).toBe('A');
    });

    it('emits the selected row as it changes', () => {
      container.addRow({ refId: 'A' });
      container.addRow({ refId: 'B' });
      const selected: string[] = [];
      container.getSelectedRow$().subscribe((row) => selected.push(row.refId));

      container.selectRow('B');
      container.selectRow('B');

      expect(selected).toEqual(['A', 'B']);
    });
  });

  describe('load', () => {
    it('builds the rows and restores their hidden flags, selection and maxDataPoints', () => {
      container.load({
        queries: [
          ['A', ppl('a')],
          ['C', ppl('c')],
        ],
        editorState: {
          selectedRowRefId: 'C',
          maxDataPoints: 400,
          rows: [['C', { isHidden: true }]],
        },
      });

      expect(container.isLoaded()).toBe(true);
      expect(container.getAllRows().map((row) => row.refId)).toEqual(['A', 'C']);
      expect(container.getRow('C')?.getQueryEditorState().isHidden).toBe(true);
      expect(container.getSelectedRow()?.refId).toBe('C');
      expect(container.multiQueryEditorState$.getValue().maxDataPoints).toBe(400);
      // New rows continue after the highest restored refId.
      expect(container.addRow().refId).toBe('D');
    });

    it('takes max data points from the editor state, not from the rows', () => {
      container.load({
        queries: [
          ['A', ppl('a')],
          ['B', { query: 'up', language: 'PROMQL', queryOptions: { maxDataPoints: 250 } } as any],
        ],
        editorState: { maxDataPoints: 400, rows: [] },
      });
      expect(container.multiQueryEditorState$.getValue().maxDataPoints).toBe(400);
    });

    it('setMaxDataPoints sets the shared value; undefined is auto', () => {
      container.setMaxDataPoints(120);
      expect(container.multiQueryEditorState$.getValue().maxDataPoints).toBe(120);
      container.setMaxDataPoints(undefined);
      expect(container.multiQueryEditorState$.getValue().maxDataPoints).toBeUndefined();
    });

    it('loads only once', () => {
      container.load({ queries: [['A', ppl('a')]], editorState: { rows: [] } });
      container.load({ queries: [['B', ppl('b')]], editorState: { rows: [] } });
      expect(container.getAllRows().map((row) => row.refId)).toEqual(['A']);
    });

    it('writes the rows and editor state to the URL, debounced', () => {
      jest.useFakeTimers();
      const set = jest.fn();
      const withUrl = new MultiQueryBuilder(() => ({ osdUrlStateStorage: { set } }) as any);
      withUrl.load({ queries: [['A', ppl('a')]], editorState: { rows: [] } });
      withUrl.getRow('A')?.updateQueryEditorState({ isHidden: true });

      jest.advanceTimersByTime(600);

      expect(set).toHaveBeenCalledWith('_eq', [['A', expect.objectContaining({ query: 'a' })]], {
        replace: true,
      });
      expect(set).toHaveBeenCalledWith(
        '_e',
        { selectedRowRefId: 'A', rows: [['A', { isHidden: true }]] },
        { replace: true }
      );
      withUrl.dispose();
      jest.useRealTimers();
    });
  });

  describe('executeAll / cancelAll', () => {
    it('runs only the visible rows and marks the batch as executing', async () => {
      const rowA = container.addRow({ refId: 'A' });
      const rowB = container.addRow({ refId: 'B', savedEditorState: { isHidden: true } });
      const submitA = jest.spyOn(rowA, 'onQueryExecutionSubmit').mockResolvedValue();
      const submitB = jest.spyOn(rowB, 'onQueryExecutionSubmit').mockResolvedValue();
      const executing: boolean[] = [];
      container.isExecuting$.subscribe((value) => executing.push(value));

      await container.executeAll();

      expect(submitA).toHaveBeenCalledTimes(1);
      expect(submitB).not.toHaveBeenCalled();
      expect(executing).toEqual([false, true, false]);
    });

    it('runs executeQuery directly when not user initiated', async () => {
      const rowA = container.addRow({ refId: 'A' });
      const execute = jest.spyOn(rowA, 'executeQuery').mockResolvedValue();
      const submit = jest.spyOn(rowA, 'onQueryExecutionSubmit');

      await container.executeAll({ userInitiated: false });

      expect(execute).toHaveBeenCalledTimes(1);
      expect(submit).not.toHaveBeenCalled();
    });

    it('keeps running the other rows when one fails', async () => {
      const rowA = container.addRow({ refId: 'A' });
      const rowB = container.addRow({ refId: 'B' });
      jest.spyOn(rowA, 'onQueryExecutionSubmit').mockRejectedValue(new Error('boom'));
      const submitB = jest.spyOn(rowB, 'onQueryExecutionSubmit').mockResolvedValue();

      await expect(container.executeAll()).resolves.toBeUndefined();
      expect(submitB).toHaveBeenCalled();
    });

    it('warns about visible rows it skips (no dataset / empty query)', async () => {
      const addWarning = jest.fn();
      const withToasts = new MultiQueryBuilder(
        () => ({ notifications: { toasts: { addWarning } } }) as any
      );
      const rowA = withToasts.addRow({ refId: 'A' });
      const rowB = withToasts.addRow({ refId: 'B', savedEditorState: { isHidden: true } });
      jest.spyOn(rowA, 'onQueryExecutionSubmit').mockResolvedValue();
      jest.spyOn(rowB, 'onQueryExecutionSubmit').mockResolvedValue();

      await withToasts.executeAll();

      expect(addWarning).toHaveBeenCalledTimes(1);
      expect(addWarning.mock.calls[0][0].text).toContain('Query A');
      expect(addWarning.mock.calls[0][0].text).not.toContain('Query B');
      withToasts.dispose();
    });

    // it('getIsStale$ is false before a run, true after an edit, and false again after a run', async () => {
    //   const rowA = container.addRow({ refId: 'A' });
    //   jest.spyOn(rowA, 'onQueryExecutionSubmit').mockResolvedValue();
    //   const stale: boolean[] = [];
    //   const sub = container.getIsStale$().subscribe((value) => stale.push(value));
    //
    //   // no baseline until the first run
    //   rowA.updateQueryState({ query: 'source = a' });
    //   await container.executeAll();
    //   rowA.updateQueryState({ query: 'source = b' });
    //   await container.executeAll();
    //
    //   expect(stale).toEqual([false, true, false]);
    //   sub.unsubscribe();
    // });
    //
    // it('getIsStale$ turns false again when an edit is changed back', async () => {
    //   const rowA = container.addRow({ refId: 'A' });
    //   jest.spyOn(rowA, 'onQueryExecutionSubmit').mockResolvedValue();
    //   rowA.updateQueryState({ query: 'source = a' });
    //   await container.executeAll();
    //   const stale: boolean[] = [];
    //   const sub = container.getIsStale$().subscribe((value) => stale.push(value));
    //
    //   rowA.updateQueryState({ query: 'source = b' });
    //   rowA.updateQueryState({ query: 'source = a' });
    //
    //   expect(stale[stale.length - 1]).toBe(false);
    //   sub.unsubscribe();
    // });

    describe('isStale$', () => {
      const setupRows = () => {
        const rowA = container.addRow({ refId: 'A' });
        const rowB = container.addRow({ refId: 'B' });
        jest.spyOn(rowA, 'onQueryExecutionSubmit').mockResolvedValue();
        jest.spyOn(rowB, 'onQueryExecutionSubmit').mockResolvedValue();
        jest.spyOn(rowA, 'executeQuery').mockResolvedValue();
        jest.spyOn(rowB, 'executeQuery').mockResolvedValue();
        return { rowA, rowB };
      };

      it('is set by markStale and cleared when a user-initiated run starts', async () => {
        setupRows();
        container.isStale$.next(false);

        container.markStale();
        expect(container.isStale$.getValue()).toBe(true);

        const run = container.executeAll();
        // Cleared at the start, so an edit made while the run is in flight counts again.
        expect(container.isStale$.getValue()).toBe(false);
        container.markStale();
        await run;
        expect(container.isStale$.getValue()).toBe(true);
      });

      it('is kept by a run the user did not start', async () => {
        setupRows();
        container.markStale();
        await container.executeAll({ userInitiated: false });
        expect(container.isStale$.getValue()).toBe(true);
      });

      it('emits once for repeated markStale calls (typing calls it on every keystroke)', () => {
        container.isStale$.next(false);
        const emitted: boolean[] = [];
        const sub = container.isStale$.subscribe((value) => emitted.push(value));
        container.markStale();
        container.markStale();
        expect(emitted).toEqual([false, true]);
        sub.unsubscribe();
      });

      it('is set by adding, removing, duplicating and splitting rows', () => {
        setupRows();
        const expectMarks = (change: () => void) => {
          container.isStale$.next(false);
          change();
          expect(container.isStale$.getValue()).toBe(true);
        };
        expectMarks(() => container.addRow({ refId: 'C' }));
        expectMarks(() => container.removeRow('C'));
        expectMarks(() => container.duplicateRow('A'));
        container.getRow('B')?.updateQueryState({ query: 'up;\nrate(x[5m]);', language: 'PROMQL' });
        expectMarks(() => container.splitRow('B'));
        expectMarks(() => container.setMaxDataPoints(500));
      });

      it('is false after load, even though load builds rows', () => {
        container.load({
          queries: [
            ['A', ppl('a')],
            ['B', ppl('b')],
          ],
          editorState: { rows: [] },
        });
        expect(container.isStale$.getValue()).toBe(false);
      });
    });

    it('cancelAll aborts every row and resets its result and status', () => {
      const rowA = container.addRow({ refId: 'A' });
      rowA.updateQueryResultForEditor(result('1'));
      rowA.updateQueryEditorState({ queryStatus: readyStatus as any });
      const abort = jest.spyOn(rowA, 'abortActiveQueries');
      container.isExecuting$.next(true);

      container.cancelAll();

      expect(abort).toHaveBeenCalled();
      expect(rowA.resultState$.getValue()).toBeUndefined();
      expect(rowA.getQueryEditorState().queryStatus.status).toBe(
        QueryExecutionStatus.UNINITIALIZED
      );
      expect(container.isExecuting$.getValue()).toBe(false);
    });
  });

  describe('results', () => {
    it('getSeriesResult$ emits the READY visible rows in row order, once the batch is done', () => {
      const rowA = container.addRow({ refId: 'A' });
      const rowB = container.addRow({ refId: 'B' });
      const rowC = container.addRow({ refId: 'C', savedEditorState: { isHidden: true } });
      const emitted: string[][] = [];
      container.getSeriesResult$().subscribe((series) => emitted.push(series.map((s) => s.refId)));

      container.isExecuting$.next(true);
      [rowB, rowA, rowC].forEach((row) => {
        row.updateQueryResultForEditor(result(row.refId));
        row.updateQueryEditorState({ queryStatus: readyStatus as any });
      });
      // Nothing while the batch runs.
      expect(emitted).toEqual([[]]);

      container.isExecuting$.next(false);
      expect(emitted[emitted.length - 1]).toEqual(['A', 'B']);
    });

    it("getSeriesResult$ doesn't re-emit for a change that leaves the results as they are", () => {
      const rowA = container.addRow({ refId: 'A' });
      rowA.updateQueryResultForEditor(result('A'));
      rowA.updateQueryEditorState({ queryStatus: readyStatus as any });
      const emitted: unknown[] = [];
      container.getSeriesResult$().subscribe((series) => emitted.push(series));
      const count = emitted.length;

      // A new row without results, and an editor change on A.
      container.addRow({ refId: 'B' });
      rowA.updateQueryEditorState({ userInitiatedQuery: true });

      expect(emitted.length).toBe(count);
    });

    it('getAggregateStatus$ follows the rows and the batch', () => {
      const rowA = container.addRow({ refId: 'A' });
      const statuses: string[] = [];
      container.getAggregateStatus$().subscribe(({ status }) => statuses.push(status));

      container.isExecuting$.next(true);
      rowA.updateQueryResultForEditor(result('A'));
      rowA.updateQueryEditorState({ queryStatus: readyStatus as any });
      container.isExecuting$.next(false);

      expect(statuses).toEqual([
        QueryExecutionStatus.UNINITIALIZED,
        QueryExecutionStatus.LOADING,
        QueryExecutionStatus.READY,
      ]);
    });

    it('getSeriesResult(refId) reads one visible row, none for hidden or empty rows', () => {
      const rowA = container.addRow({ refId: 'A' });
      container.addRow({ refId: 'B' });
      rowA.updateQueryResultForEditor(result('A'));

      expect(container.getSeriesResult('A')?.rows).toEqual([{ id: 'A' }]);
      expect(container.getSeriesResult('B')).toBeUndefined();

      rowA.updateQueryEditorState({ isHidden: true });
      expect(container.getSeriesResult('A')).toBeUndefined();
    });

    it('getHasTimeBasedRow$ is true while a visible row has a time-based dataset', () => {
      const rowA = container.addRow({ refId: 'A' });
      const values: boolean[] = [];
      container.getHasTimeBasedRow$().subscribe((value) => values.push(value));

      rowA.datasetView$.next({
        dataView: { isTimeBased: () => true } as any,
        isLoading: false,
        error: null,
      });
      rowA.updateQueryEditorState({ isHidden: true });

      expect(values).toEqual([false, true, false]);
    });
  });

  describe('variables and dispose', () => {
    it('shares the interpolation service with rows created later', async () => {
      const service = { hasVariables: () => false } as any;
      container.setInterpolationService(service);
      container.setVariableNames(['env']);
      const row = container.addRow({ refId: 'A' });

      expect(container.getVariableNames()).toEqual(['env']);
      expect((row as any).getInterpolationService()).toBe(service);
    });

    it('disposes every row and completes its streams', () => {
      const row = container.addRow({ refId: 'A' });
      const dispose = jest.spyOn(row, 'dispose');
      let completed = false;
      container.queryRows$.subscribe({ complete: () => (completed = true) });

      container.dispose();

      expect(dispose).toHaveBeenCalled();
      expect(completed).toBe(true);
    });
  });
});

describe('MultiQueryBuilder saved state and dirty baseline', () => {
  let container: MultiQueryBuilder;
  const ppl = (query: string) =>
    ({
      query,
      language: 'PPL',
      dataset: { id: 'logs', title: 'logs', type: 'INDEX_PATTERN' },
    }) as any;

  beforeEach(() => {
    container = new MultiQueryBuilder(getServices);
  });

  afterEach(() => {
    container.dispose();
  });

  it('gives every row and its hidden state as saved, max data points on each metrics row', () => {
    container.addRow({ refId: 'A', savedQueryState: ppl('a') });
    container.addRow({
      refId: 'B',
      savedQueryState: ppl('b'),
      savedEditorState: { isHidden: true },
    });
    container.addRow({
      refId: 'C',
      savedQueryState: { query: 'up', language: 'PROMQL' } as any,
    });
    container.setMaxDataPoints(250);

    const { queries, editorState } = container.getContainerState();
    expect(queries.map(([refId, query]) => [refId, query.query])).toEqual([
      ['A', 'a'],
      ['B', 'b'],
      ['C', 'up'],
    ]);
    // A PPL row keeps no queryOptions; the PromQL row carries the panel's value.
    expect(queries[0][1].queryOptions).toBeUndefined();
    expect(queries[2][1].queryOptions).toEqual({ maxDataPoints: 250 });
    expect(editorState).toEqual({
      rows: [
        ['A', { isHidden: false }],
        ['B', { isHidden: true }],
        ['C', { isHidden: false }],
      ],
    });
  });

  it('streams the saved state on every change', () => {
    const rowA = container.addRow({ refId: 'A', savedQueryState: ppl('a') });
    const emitted: string[] = [];
    const sub = container
      .getContainerState$()
      .subscribe(({ queries }) => emitted.push(queries[0][1].query as string));

    rowA.updateQueryState({ query: 'changed' });
    sub.unsubscribe();

    expect(emitted).toEqual(['a', 'changed']);
  });

  it('takes a legacy saved query as row A, with its max data points', () => {
    container.setSavedBaseline(
      buildSingleQueryToList({
        query: 'up',
        language: 'PROMQL',
        queryOptions: { maxDataPoints: 100 },
      } as any)
    );

    expect(container.savedQueriesSnapshot$.getValue()).toEqual(
      expect.objectContaining({
        queries: [
          [
            'A',
            expect.objectContaining({
              query: 'up',
              language: 'PROMQL',
              queryOptions: { maxDataPoints: 100 },
            }),
          ],
        ],
      })
    );
  });

  it('is clean as it opened, dirty on a change, and clean again once it is changed back', () => {
    const row = container.addRow({ refId: 'A', savedQueryState: ppl('a') });
    container.setSavedBaseline();
    const dirty: boolean[] = [];
    const sub = container.getIsDirty$().subscribe((value) => dirty.push(value));

    row.updateQueryState({ query: 'changed' });
    row.updateQueryState({ query: 'a' });
    sub.unsubscribe();

    expect(dirty).toEqual([false, true, false]);
  });

  it('is clean after the snapshot taken when saving is committed', () => {
    const row = container.addRow({ refId: 'A', savedQueryState: ppl('a') });
    container.setSavedBaseline();
    row.updateQueryState({ query: 'saved' });
    const snapshot = container.getQueriesSnapshot();
    // An edit made while the save is in flight is not part of it.
    row.updateQueryState({ query: 'edited during save' });

    container.confirmSaveSnapshot(snapshot);
    let dirty: boolean | undefined;
    container
      .getIsDirty$()
      .subscribe((value) => (dirty = value))
      .unsubscribe();
    expect(dirty).toBe(true);

    row.updateQueryState({ query: 'saved' });
    container
      .getIsDirty$()
      .subscribe((value) => (dirty = value))
      .unsubscribe();
    expect(dirty).toBe(false);
  });
});
