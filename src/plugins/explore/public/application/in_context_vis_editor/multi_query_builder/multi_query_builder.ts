/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Subscription, combineLatest, Observable, of } from 'rxjs';
import { distinctUntilChanged, debounceTime, map, filter, switchMap } from 'rxjs/operators';
import { cloneDeep, isEqual, isUndefined, omitBy } from 'lodash';

import { ExploreServices } from '../../../types';
import {
  QueryBuilder,
  QueryState,
  QueryResultState,
  QueryEditorState,
} from '../query_builder/query_builder';
import { shouldPrefixSeriesWithRefId } from '../query_builder/utils';
import { getQueryLabel, splitMultiQueries } from '../../../../../data/common';

import {
  computeAggregateStatus,
  toRowListItem,
  toSeriesResult,
  getQueryLabelIndex,
  toQueriesSnapshot,
} from './utils';
import type {
  AggregateStatus,
  QueryRows,
  RowExecutionState,
  RowListItem,
  SeriesResult,
  UrlMultiEditorState,
  UrlRowEditorState,
  UrlRowEntry,
  QueriesSnapshot,
} from './types';
import { QUERY_BUILDER_QUERY_STATE_KEY, QUERY_EDITOR_STATE_KEY } from '../types';
import { ContainerState, SaveableRow, toSavedContainerState } from './container_state_utils';

import {
  EditorMode,
  QueryExecutionStatus,
  QueryResultStatus,
} from '../../../application/utils/state_management/types';
import { IVariableInterpolationService } from '../../../../../dashboard/public';
import { PromQLQueryOptions } from '../../../../../query_enhancements/common';
import { shouldSkipQueryExecution } from '../../../application/utils/state_management/actions/query_actions';
import { showSkippedQueriesWarning } from '../query_builder/utils';

export interface PerQueryResult {
  refId: string;
  perQueryStatus: QueryResultStatus;
  perQueryResult: QueryResultState;
}

interface UpdateMap {
  Query: Partial<QueryState>;
  QueryEditor: Partial<QueryEditorState>;
  QueryOptions: Partial<PromQLQueryOptions>;
}

export type MultiQueryResult = Record<string, PerQueryResult>;

export interface MultiQueryEditorState {
  dateRange?: { from: string; to: string };
  maxDataPoints?: number;
  selectedRowRefId?: string;
}

interface RowSavedStates {
  savedQueryState?: QueryState;
  savedEditorState?: Partial<QueryEditorState>;
}

const initialMultiQueryEditorState: MultiQueryEditorState = {
  dateRange: undefined,
};

/**
 * MultiQueryBuilder — container over N QueryRow.
 */
export class MultiQueryBuilder {
  public queryRows$ = new BehaviorSubject<QueryRows>([]);
  public multiQueryEditorState$ = new BehaviorSubject<MultiQueryEditorState>(
    initialMultiQueryEditorState
  );

  // isExecuting indicates an executeAll runs, and vis will wait for the results
  public isExecuting$ = new BehaviorSubject<boolean>(false);
  private executionRun = 0;

  public variableNames$ = new BehaviorSubject<string[]>([]);
  private interpolationService?: IVariableInterpolationService;

  private getServices: () => ExploreServices;
  private refIdCounter = 0;
  private subscriptions = Array<Subscription>();

  // Rows are built in load(); until then there are none (the page renders nothing before load).
  private loaded = false;

  // mark queries dirty when their current snapshot differs (getIsDirty$).
  public savedQueriesSnapshot$ = new BehaviorSubject<QueriesSnapshot | undefined>(undefined);

  // Whether the rows changed since the last user-initiated run (Update / Refresh). Set by every
  // edit (markStale), cleared when a user-initiated executeAll starts and on load.
  public isStale$ = new BehaviorSubject<boolean>(false);

  constructor(getServices: () => ExploreServices) {
    this.getServices = getServices;
  }

  // TODO URL sync is one-way (state -> URL). An external URL change (back/forward POP, or a PUSH
  // into the app with a different `_eq`) is not picked up because the app stays mounted. Rather
  // than every builder listening to the URL, remount the editor on such a change (bump the
  // MultiQueryBuilderProvider's key from scopedHistory.listen), so a new instance reads the URL.
  // Our own writes use `replace: true`, so REPLACE can be ignored.

  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Load the container from its resolved states: builds every row with its
   * final state, restores the editor state, then starts the global and URL syncs.
   */
  load(container: ContainerState): void {
    if (this.loaded) {
      return;
    }

    this.loadQueryRows(container.queries, container.editorState);

    this.setupGlobalDataRangeSync();
    this.setupTimefilterToDateRangeSync();
    this.startUrlSync();
    this.loaded = true;
    // Building the rows is not an edit; stale is not kept across reloads.
    this.isStale$.next(false);
  }

  // Mark the rows changed since the last run. Idempotent: typing calls it on every keystroke.
  markStale(): void {
    if (!this.isStale$.getValue()) {
      this.isStale$.next(true);
    }
  }

  /* --- Subscription ---
   * - setupGlobalDataRangeSync(): sync current time filter to global time filter.
   * - setupTimefilterToDateRangeSync(): Sync global time filter to shared editor states
   * - startUrlSync(): one-way, state -> URL, debounced. dateRange is left out: _g (timefilter) owns
   *   it. External URL changes (back/forward) are not read back; remount the editor instead.
   */
  private setupGlobalDataRangeSync() {
    const dataRangeSyncSub = this.multiQueryEditorState$
      .pipe(
        map((state) => state?.dateRange),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((dateRange) => {
        if (dateRange && this.getServices().data?.query?.timefilter?.timefilter) {
          const timefilter = this.getServices().data.query.timefilter.timefilter;
          const currentTimefilterRange = timefilter.getTime();

          if (!isEqual(currentTimefilterRange, dateRange)) {
            timefilter.setTime(dateRange);
          }
        }
      });

    this.subscriptions.push(dataRangeSyncSub);
  }

  private setupTimefilterToDateRangeSync() {
    const timefilter = this.getServices().data?.query?.timefilter?.timefilter;
    if (!timefilter) {
      return;
    }
    const syncFromTimefilter = () => {
      const { from, to } = timefilter.getTime();
      const dateRange = { from, to };
      if (!isEqual(this.multiQueryEditorState$.getValue().dateRange, dateRange)) {
        this.updateMultiQueryEditorState({ dateRange });
      }
    };
    // Seed it so readers have a value before the first change.
    syncFromTimefilter();
    const timefilterSub = timefilter.getTimeUpdate$().subscribe(syncFromTimefilter);

    this.subscriptions.push(timefilterSub);
  }

  /* --- URL ---
   * - readUrlState(): reads _eq ([refId, QueryState][]) and _e (container state + per-row isHidden),
   *   both keyed by refId. For previous single query builder that holds a single row's state, use ref A.
   * - startUrlSync(): one-way, state -> URL, debounced. dateRange is left out: _g (timefilter) owns
   *   it. External URL changes (back/forward) are not read back; remount the editor instead.
   */

  private startUrlSync() {
    // Each row's query state and persisted editor state, in row order.
    const rowsUrlState$ = this.queryRows$.pipe(
      switchMap((rows) =>
        rows.length > 0
          ? combineLatest(
              rows.map((row) =>
                combineLatest([
                  row.queryState$,
                  row.queryEditorState$.pipe(
                    map((state): UrlRowEditorState => ({
                      isHidden: state.isHidden,
                    })),
                    distinctUntilChanged((prev, curr) => isEqual(prev, curr))
                  ),
                ]).pipe(map(([queryState, editorState]) => ({ row, queryState, editorState })))
              )
            )
          : of([])
      )
    );
    const multiQueryEditorUrlState$ = this.multiQueryEditorState$.pipe(
      map(({ selectedRowRefId, maxDataPoints }) => ({ selectedRowRefId, maxDataPoints })),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr))
    );

    const urlSync = combineLatest([rowsUrlState$, multiQueryEditorUrlState$])
      .pipe(debounceTime(500))
      .subscribe(([rowsState, multiQueryEditorUrlState]) => {
        const queries: Array<UrlRowEntry<QueryState>> = rowsState.map(({ row, queryState }) => [
          row.refId,
          queryState,
        ]);
        const editorState: UrlMultiEditorState = {
          ...omitBy(multiQueryEditorUrlState, isUndefined),
          rows: rowsState.map(({ row, editorState: rowEditorState }) => [
            row.refId,
            omitBy(rowEditorState, isUndefined) as UrlRowEditorState,
          ]),
        };
        this.syncToUrl(QUERY_BUILDER_QUERY_STATE_KEY, queries);
        this.syncToUrl(QUERY_EDITOR_STATE_KEY, editorState);
      });

    this.subscriptions.push(urlSync);
  }

  private syncToUrl<T>(place: string, state: T) {
    const urlStateStorage = this.getServices()?.osdUrlStateStorage;

    if (urlStateStorage) {
      urlStateStorage.set(place, state, { replace: true });
    }
  }

  /* --- Row management ---
   * Rows are identified by refId (A, B, ...)
   * - buildRow(): constructs a row without initializing it.
   * - createRow(): buildRow() + init row.
   * - ensureRow(): a placeholder row (built, not initialized), so hooks have a selected row before init() runs.
   * - addRow(): createRow() + appends to queryRows$; selects it only when it's the first row.
   * - removeRow(): the last row can't be removed; removing the selected row selects the first one.
   * - loadQueryRows() / loadSavedQueries(): replace all rows (refIds de-duplicated), then restore per-row editor state (isHidden) and container editor state (selectedRow, maxDataPoints).
   * - selectRow() / getSelectedRow$(): get selected row
   * - getRow() / getAllRows()
   * - updateQueryRow(): update query state or query editor for a specific row
   * - duplicateRow(): copies a row right after it under a new refId (A, B, C: copying A gives A, D, B, C).
   * - reorderRows(): reorders rows, refIds stay as they are.
   * - splitRow(): splits a saved multi-lines PromQL query into one row each.
   */

  private buildRow(refId?: string): QueryBuilder {
    const row = new QueryBuilder(
      this.getServices,
      refId ?? this.nextRefId(),
      () => this.interpolationService,
      // () => ({ maxDataPoints: this.multiQueryEditorState$.getValue().maxDataPoints })
      () => ({
        maxDataPoints: this.multiQueryEditorState$.getValue().maxDataPoints,
        // Read at execution: the visible rows of the batch decide.
        prefixSeriesWithRefId: shouldPrefixSeriesWithRefId(
          this.queryRows$
            .getValue()
            .filter((r) => !r.queryEditorState$.getValue().isHidden)
            .map((r) => r.queryState$.getValue())
        ),
      })
    );
    if (!refId) {
      this.refIdCounter += 1;
    } else {
      // A given refId doesn't come from the counter; keep later rows from reusing it.
      this.refIdCounter = Math.max(this.refIdCounter, getQueryLabelIndex(refId) + 1);
    }
    return row;
  }

  private createRow(options?: RowSavedStates & { refId?: string }): QueryBuilder {
    const row = this.buildRow(options?.refId);
    row.init(options);
    return row;
  }

  addRow(opts?: RowSavedStates & { refId?: string }): QueryBuilder {
    const row = this.createRow(opts);
    const isBeforeEmpty = this.queryRows$.getValue().length === 0;
    this.queryRows$.next([...this.queryRows$.getValue(), row]);
    // if previous container is empty, select first row
    if (isBeforeEmpty) {
      this.selectRow(row.refId);
    }
    this.markStale();
    return row;
  }

  removeRow(refId: string): void {
    if (this.getAllRows().length <= 1) {
      return;
    }
    const deletedRow = this.getRow(refId);
    if (!deletedRow) return;
    const newRows = this.getAllRows().filter((row) => row.refId !== refId);
    // After removing the selected row, move selection to the first remaining row.
    if (this.multiQueryEditorState$.getValue().selectedRowRefId === refId) {
      this.selectRow(newRows[0].refId);
    }

    this.queryRows$.next(newRows);
    // Dispose last: until now the row was still listed (and maybe selected).
    deletedRow.dispose();
    this.markStale();
  }

  duplicateRow(refId: string): QueryBuilder | undefined {
    const target = this.getRow(refId);
    if (!target) return undefined;
    // duplicate the query, dataset, language, query options, and hidden state
    const { editorMode, isHidden, lastExecutedTranslatedQuery } = target.getQueryEditorState();

    // Query mode copies from editor because it may hold text that hasn't run yet.
    // Prompt mode copies from lastExecutedTranslatedQuery
    const queryText =
      editorMode === EditorMode.Query
        ? target.getEditor()?.getValue()
        : lastExecutedTranslatedQuery;

    const sourceQuery = target.queryState$.getValue();
    const row = this.createRow({
      savedQueryState: cloneDeep(
        queryText === undefined ? sourceQuery : { ...sourceQuery, query: queryText }
      ),
      // A copy of a hidden row stays hidden.
      savedEditorState: { isHidden: !!isHidden },
    });

    const rows = [...this.getAllRows()];
    rows.splice(rows.indexOf(target) + 1, 0, row);
    this.queryRows$.next(rows);
    this.markStale();
    return row;
  }

  splitRow(refId: string): QueryBuilder[] {
    const source = this.getRow(refId);
    if (!source) return [];
    const sourceQuery = source.queryState$.getValue();
    const parts = splitMultiQueries(sourceQuery.query);
    if (parts.length <= 1) return [];
    const { isHidden } = source.getQueryEditorState();
    const perQueryOptions = sourceQuery.queryOptions?.perQueryOptions;
    const taken = new Set(this.getAllRows().map((row) => row.refId));
    const created = parts.map((part, index) => {
      //   The first keeps the row's refId; the others try to use the label the source query gave them (B in `Value #B` / `B: <series>`)
      const partRefId = index === 0 ? refId : taken.has(part.label) ? undefined : part.label;
      const row = this.createRow({
        refId: partRefId,
        savedQueryState: cloneDeep({
          // Each keeps the row's dataset, options (with its own perQueryOptions entry) and hidden flag.
          ...sourceQuery,
          query: part.query,
          queryOptions: {
            ...sourceQuery.queryOptions,
            perQueryOptions: perQueryOptions?.[index] ? [perQueryOptions[index]] : undefined,
          },
        }),
        savedEditorState: { isHidden: !!isHidden },
      });
      taken.add(row.refId);
      return row;
    });

    const rows = [...this.getAllRows()];
    rows.splice(rows.indexOf(source), 1, ...created);
    this.queryRows$.next(rows);
    // distroy source query
    source.dispose();
    this.markStale();
    return created;
  }

  reorderRows(fromIndex: number, toIndex: number): void {
    const rows = [...this.getAllRows()];
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= rows.length ||
      toIndex >= rows.length
    ) {
      return;
    }
    const [moved] = rows.splice(fromIndex, 1);
    rows.splice(toIndex, 0, moved);
    this.queryRows$.next(rows);
  }

  private loadQueryRows(
    queries: Array<UrlRowEntry<QueryState>>,
    editorState?: UrlMultiEditorState
  ): void {
    // clean rows first
    this.disposeAllRows();

    this.refIdCounter = Math.max(
      queries.length,
      ...queries.map(([refId]) => getQueryLabelIndex(refId) + 1)
    );

    const editorStateByRefId = new Map(editorState?.rows ?? []);

    // apply editor state for each row
    queries.forEach(([refId, savedQueryState]) => {
      this.addRow({ refId, savedQueryState, savedEditorState: editorStateByRefId.get(refId) });
    });

    // apply global editor state for container
    this.applyMultiEditorState(editorState);
  }

  // Only an existing row can be selected
  selectRow(refId: string) {
    // TODO if select first
    if (!this.getRow(refId)) {
      return;
    }
    this.updateMultiQueryEditorState({ selectedRowRefId: refId });
  }

  getSelectedRow$(): Observable<QueryBuilder> {
    const selectedRow$ = this.multiQueryEditorState$.pipe(
      map((state) => state.selectedRowRefId),
      distinctUntilChanged()
    );
    return combineLatest([selectedRow$, this.queryRows$]).pipe(
      // Rows and selection are updated in two steps (e.g. removeRow: rows first, then selectRow), so
      // an emission can briefly carry a stale refId; fall back to the first row until selection catches up.
      map(([refId, rows]) => rows.find((row) => row.refId === refId)),
      filter((row): row is QueryBuilder => !!row),
      distinctUntilChanged()
    );
  }

  getSelectedRow(): QueryBuilder | undefined {
    const selectedRow = this.multiQueryEditorState$.getValue().selectedRowRefId;
    return (selectedRow ? this.getRow(selectedRow) : undefined) ?? this.getAllRows()[0];
  }

  getRow(refId: string) {
    return this.getAllRows().find((row) => row.refId === refId);
  }

  getAllRows() {
    return this.queryRows$.value;
  }

  updateQueryRow<T extends keyof UpdateMap>(refId: string, type: T, updates: UpdateMap[T]) {
    const updateRow = this.getRow(refId);

    switch (type) {
      case 'Query':
        updateRow?.updateQueryState(updates as Partial<QueryState>);
        break;
      case 'QueryEditor':
        updateRow?.updateQueryEditorState(updates as Partial<QueryEditorState>);
        break;
      case 'QueryOptions':
        updateRow?.updateQueryOptions(updates as Partial<PromQLQueryOptions>);
    }
  }

  /* --- Execution ---
   * executeAll(): runs every visible (non-hidden) row in parallel; one row failing doesn't stop the others. userInitiated: false runs executeQuery directly.
   * cancelAll(): aborts every row's in-flight request and resets its result and status. Each row aborts only its own requests (abort key = refId).
   */

  async executeAll({ userInitiated = true }: { userInitiated?: boolean } = {}): Promise<void> {
    // get all visible rows
    const currentRows = this.queryRows$
      .getValue()
      .filter((row) => !row.getQueryEditorState().isHidden);

    // Tell the user which visible rows are skiped.
    this.warnSkippedRows(currentRows);

    // The rows run in parallel，
    const run = ++this.executionRun;
    this.isExecuting$.next(true);
    // Cleared when the run starts, so an edit made while it runs marks the rows stale again.
    if (userInitiated) {
      this.isStale$.next(false);
    }
    try {
      await Promise.allSettled(
        currentRows.map(async (row) => {
          try {
            if (userInitiated) {
              await row.onQueryExecutionSubmit();
            } else {
              await row.executeQuery();
            }
          } catch (e) {
            // skip: the row's own queryStatus records the error
          }
        })
      );
    } finally {
      if (run === this.executionRun) {
        this.isExecuting$.next(false);
      }
    }
  }

  cancelAll(): void {
    this.isExecuting$.next(false);
    this.getAllRows().forEach((row) => {
      row.abortActiveQueries();
      row.clearResultState();
      row.updateQueryEditorState({
        queryStatus: {
          status: QueryExecutionStatus.UNINITIALIZED,
          startTime: undefined,
          elapsedMs: undefined,
          error: undefined,
        },
        userInitiatedQuery: false,
      });
    });
  }

  /* --- Results ---
   * getVisibleRowExecutionStates$(): return each visible row's status and result in row order.
   * getAggregateStatus$(): runs every visible row in parallel; one row failing doesn't stop the others. userInitiated: false runs executeQuery directly.
   * getSeriesResult$(): return READY visible rows' results, always in row order. Emits only when the all queries are finished.
   * getQueryRowItems$() / getQueryRowItems(): every row (hidden ones too) as a list item(for UI display in section panel), in row order.
   */

  getQueryRowItems$(): Observable<RowListItem[]> {
    return this.queryRows$.pipe(
      switchMap((rows) =>
        rows.length > 0
          ? combineLatest(
              rows.map((row) =>
                row.queryEditorState$.pipe(
                  map((editorState) => toRowListItem(row.refId, editorState))
                )
              )
            )
          : of([])
      ),
      // Editor-state changes that don't touch these fields (text, dirty flag) emit equal items.
      distinctUntilChanged((prev, curr) => isEqual(prev, curr))
    );
  }

  getQueryRowItems(): RowListItem[] {
    return this.getAllRows().map((row) => toRowListItem(row.refId, row.getQueryEditorState()));
  }

  private getVisibleRowExecutionStates$(): Observable<RowExecutionState[]> {
    return this.queryRows$.pipe(
      switchMap((rows) =>
        rows.length > 0
          ? combineLatest(
              rows.map((row) =>
                combineLatest([
                  // Only what the results depend on: other editor-state changes stop here.
                  row.queryEditorState$.pipe(
                    map(({ isHidden, queryStatus }) => ({
                      isHidden: !!isHidden,
                      status: queryStatus,
                    })),
                    distinctUntilChanged((prev, curr) => isEqual(prev, curr))
                  ),
                  row.resultState$,
                ]).pipe(
                  // A hidden row doesn't run or count; it's still watched so hiding updates the list.
                  map(([{ isHidden, status }, result]): RowExecutionState | undefined =>
                    isHidden ? undefined : { refId: row.refId, status, result }
                  )
                )
              )
            )
          : of([])
      ),
      map((states) => states.filter((state): state is RowExecutionState => !!state))
    );
  }

  getAggregateStatus$(): Observable<AggregateStatus> {
    return combineLatest([this.getVisibleRowExecutionStates$(), this.isExecuting$]).pipe(
      map(([states, isExecuting]) => computeAggregateStatus(states, isExecuting)),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr))
    );
  }

  getSeriesResult$(): Observable<SeriesResult[]> {
    return combineLatest([this.getVisibleRowExecutionStates$(), this.isExecuting$]).pipe(
      filter(
        ([states, isExecuting]) =>
          !isExecuting &&
          !states.some((state) => state.status.status === QueryExecutionStatus.LOADING)
      ),
      map(([states]) =>
        states.filter(
          (state) => state.status.status === QueryExecutionStatus.READY && !!state.result
        )
      ),
      // Adding a new row may re-emit again, add deduplication
      distinctUntilChanged(
        (prev, curr) =>
          prev.length === curr.length &&
          prev.every((p, i) => p.refId === curr[i].refId && p.result === curr[i].result)
      ),
      map((states) => states.map(toSeriesResult))
    );
  }

  /**
   * One visible row's current result as a series, read from the row itself (no stored copy).
   * Undefined when the row is gone, hidden, or has no result.
   */
  getSeriesResult(refId: string): SeriesResult | undefined {
    const row = this.getRow(refId);
    if (!row || row.getQueryEditorState().isHidden) return undefined;
    const result = row.resultState$.getValue();
    if (!result) return undefined;
    return toSeriesResult({ refId, status: row.getQueryEditorState().queryStatus, result });
  }

  /* --- Variables ---
   * Dashboard variables are shared by every row. Rows read the interpolation service through a
   * getter at execution time, so rows created later get it too.
   */

  setVariableNames(names: string[]) {
    this.variableNames$.next(names);
  }

  setInterpolationService(service: IVariableInterpolationService) {
    this.interpolationService = service;
  }

  getVariableNames(): string[] {
    return this.variableNames$.value;
  }

  /* --- Saved object state ---
   * - getContainerState(): every row and the editor state as the saved object stores them.
   * - getContainerState$(): the same, on every change (for the editor's dirty check).
   * - setSavedBaseline(): set the dirty check baseline. The first version comes from saved object.
   */

  private toSaveableRow(row: QueryBuilder): SaveableRow {
    const { isHidden, editorMode, lastExecutedTranslatedQuery } = row.getQueryEditorState();
    return {
      refId: row.refId,
      queryState: row.queryState$.getValue(),
      isHidden,
      editorMode,
      lastExecutedTranslatedQuery,
    };
  }

  getContainerState(): ContainerState {
    return toSavedContainerState(
      this.getAllRows().map((row) => this.toSaveableRow(row)),
      this.multiQueryEditorState$.getValue().maxDataPoints
    );
  }

  getContainerState$(): Observable<ContainerState> {
    const rows$ = this.queryRows$.pipe(
      switchMap((rows) =>
        rows.length > 0
          ? combineLatest(
              rows.map((row) =>
                combineLatest([
                  row.queryState$,
                  row.queryEditorState$.pipe(
                    map(({ isHidden, editorMode, lastExecutedTranslatedQuery }) => ({
                      isHidden,
                      editorMode,
                      lastExecutedTranslatedQuery,
                    })),
                    distinctUntilChanged((prev, curr) => isEqual(prev, curr))
                  ),
                ]).pipe(
                  map(([queryState, editorState]): SaveableRow => ({
                    refId: row.refId,
                    queryState,
                    ...editorState,
                  }))
                )
              )
            )
          : of([] as SaveableRow[])
      )
    );
    const maxDataPoints$ = this.multiQueryEditorState$.pipe(
      map(({ maxDataPoints }) => maxDataPoints),
      distinctUntilChanged()
    );
    return combineLatest([rows$, maxDataPoints$]).pipe(
      map(([rows, maxDataPoints]) => toSavedContainerState(rows, maxDataPoints))
    );
  }

  setSavedBaseline(saved?: ContainerState) {
    const state = saved
      ? toSavedContainerState(
          saved.queries.map(([refId, queryState]) => ({
            refId,
            queryState,
            isHidden: saved.editorState.rows.find(([id]) => id === refId)?.[1].isHidden,
          })),
          saved.editorState.maxDataPoints
        )
      : this.getContainerState();
    this.savedQueriesSnapshot$.next(toQueriesSnapshot(state));
  }

  // The rows as they'd be saved now, for the dirty check.
  getQueriesSnapshot(): QueriesSnapshot {
    return toQueriesSnapshot(this.getContainerState());
  }

  // Update the baseline, this is used when user opens visualization outside dashboard.
  confirmSaveSnapshot(snapshot: QueriesSnapshot = this.getQueriesSnapshot()) {
    this.savedQueriesSnapshot$.next(snapshot);
  }

  // Return whether the rows differ from the saved baseline; changing one back is clean again.
  getIsDirty$(): Observable<boolean> {
    return combineLatest([this.getContainerState$(), this.savedQueriesSnapshot$]).pipe(
      map(([state, saved]) => !!saved && !isEqual(toQueriesSnapshot(state), saved)),
      distinctUntilChanged()
    );
  }

  /* --- Helpers --- */

  // Restores the container-level editor state.
  private applyMultiEditorState(editorState?: UrlMultiEditorState): void {
    if (editorState?.maxDataPoints !== undefined) {
      this.updateMultiQueryEditorState({ maxDataPoints: editorState.maxDataPoints });
    }

    if (editorState?.selectedRowRefId) {
      this.selectRow(editorState.selectedRowRefId);
    }
  }

  // Panel-level, shared by every row: each metrics row runs with them
  setMaxDataPoints(maxDataPoints?: number) {
    this.updateMultiQueryEditorState({ maxDataPoints });
    // Changes what every metrics row runs with.
    this.markStale();
  }

  updateMultiQueryEditorState(updates: Partial<MultiQueryEditorState>) {
    const currentState = this.multiQueryEditorState$.value;
    this.multiQueryEditorState$.next({
      ...currentState,
      ...updates,
    });
  }

  private nextRefId(): string {
    return getQueryLabel(this.refIdCounter);
  }

  private disposeAllRows(): void {
    this.queryRows$.getValue().forEach((r) => r.dispose());
    this.queryRows$.next([]);
    this.updateMultiQueryEditorState({ selectedRowRefId: undefined });
  }

  // Some rows don't have dataset or prompt input, skip them and show warnings.
  private warnSkippedRows(rows: QueryBuilder[]): void {
    const noDataset: string[] = [];
    const emptyQuery: string[] = [];

    rows.forEach((row) => {
      const query = row.queryState$.getValue();
      if (!query.dataset) {
        noDataset.push(row.refId);
      } else if (
        // In Prompt mode, an empty prompt is not expected.
        row.getQueryEditorState().editorMode !== EditorMode.Prompt &&
        shouldSkipQueryExecution(query)
      ) {
        emptyQuery.push(row.refId);
      }
    });
    const toasts = this.getServices().notifications?.toasts;
    if (toasts) showSkippedQueriesWarning(toasts, { noDataset, emptyQuery });
  }

  // Whether any visible row's dataset is time based: decides if the shared date picker shows.
  getHasTimeBasedRow$(): Observable<boolean> {
    return this.queryRows$.pipe(
      switchMap((rows) =>
        rows.length > 0
          ? combineLatest(
              rows.map((row) =>
                combineLatest([row.datasetView$, row.queryEditorState$]).pipe(
                  map(
                    ([datasetView, editorState]) =>
                      !editorState?.isHidden && !!datasetView?.dataView?.isTimeBased()
                  )
                )
              )
            ).pipe(map((flags) => flags.some(Boolean)))
          : of(false)
      ),
      distinctUntilChanged()
    );
  }

  dispose(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions = [];
    this.disposeAllRows();
    this.queryRows$.complete();
    this.multiQueryEditorState$.complete();
    this.isExecuting$.complete();
    this.variableNames$.complete();
    this.savedQueriesSnapshot$.complete();
    this.isStale$.complete();
  }
}
