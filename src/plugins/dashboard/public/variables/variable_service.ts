/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { Observable, BehaviorSubject, combineLatest, merge, Subscription } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { DataPublicPluginStart, TimeRange } from '../../../data/public';
import { SavedObjectsClientContract } from '../../../../core/public';
import {
  Variable,
  VariableType,
  VariableSortOrder,
  QueryVariable,
  CustomVariable,
  TextVariable,
  VariableState,
  VariableWithState,
  VariableOption,
  VariableOptionType,
  NormalizedVariableOption,
  DistributiveOmit,
  PromQLResourceQuery,
  isAllMarker,
  ALL_OPTION_VALUE,
} from './types';
import {
  buildVariableOptionsFromQueryResult,
  executeVariableQuery,
  applyRegexToVariableOptions,
  VariableQueryResult,
} from './variable_query_utils';
import {
  executePromQLResourceQuery,
  buildPromQLVariableOptions,
  interpolateResourceQuery,
  collectResourceQueryTextFields,
} from './promql_variable_query_utils';
import { normalizePersistedVariables } from './variable_query_utils';
import {
  IVariableInterpolationService,
  VariableInterpolationService,
} from './variable_interpolation_service';

/**
 * Max options rendered at once in the selector. Runtime state keeps the full
 * list so search and "All" cover every value.
 */
export const MAX_DISPLAY_OPTIONS = 100;

/**
 * Minimal telemetry sink so this service can report feature usage without
 * depending on core. Mirrors the pattern used by the query_enhancements plugin.
 * Callers wire this to core.telemetry's plugin recorder; when omitted, all
 * reporting is skipped.
 */
export type VariableTelemetrySink = (event: { name: string; data: Record<string, any> }) => void;

/** Returns the runtime state fields to change, given the variable's state at that moment. */
type RuntimeStateUpdate = (current: VariableState) => Partial<VariableState>;

/** External inputs of the refresh scheduler. */
export interface VariableRefreshSchedulerInputs {
  /** Current time range. Must emit its initial value on subscribe. */
  time$: Observable<TimeRange | undefined>;
  /** Each emission re-queries every query variable, even if its inputs did not change. */
  reload$: Observable<unknown>;
}

/**
 * VariableService — a self-contained feature for managing dashboard variables.
 */
export class VariableService {
  private dataPlugin?: DataPublicPluginStart;
  private dashboardId?: string;
  private savedObjectsClient?: SavedObjectsClientContract;
  private variables$ = new BehaviorSubject<Variable[]>([]);
  private refreshControllers: Map<string, AbortController> = new Map();
  private interpolationService?: IVariableInterpolationService;
  private runtimeState: Map<string, VariableState> = new Map();
  private runtimeStateChange$ = new BehaviorSubject<number>(0);
  private telemetrySink?: VariableTelemetrySink;

  // Refresh scheduler state. See startRefreshScheduler().
  private schedulerSubscription?: Subscription;
  private schedulerTime?: TimeRange;
  private schedulerTimeReady = false;
  private reloadToken = 0;
  /** Fetch key of the last query started for each variable. */
  private lastFetchKeys = new Map<string, string>();
  /** Variables the last reconcile held back (and marked loading) because an upstream was not done. */
  private waitingIds = new Set<string>();
  private reconcileScheduled = false;
  private settledWaiters: Array<() => void> = [];

  /**
   * @param dataPlugin - Data plugin for executing queries
   * @param dashboardId - Dashboard ID for auto-saving (optional)
   * @param savedObjectsClient - Client for saving to dashboard saved object
   * @param telemetrySink - Optional sink for feature-usage telemetry
   */
  constructor(
    dataPlugin?: DataPublicPluginStart,
    dashboardId?: string,
    savedObjectsClient?: SavedObjectsClientContract,
    telemetrySink?: VariableTelemetrySink
  ) {
    this.dataPlugin = dataPlugin;
    this.dashboardId = dashboardId;
    this.savedObjectsClient = savedObjectsClient;
    this.telemetrySink = telemetrySink;
  }

  /**
   * Report a telemetry event. Never throws -- telemetry must not break the
   * feature it measures.
   */
  private recordTelemetry(name: string, data: Record<string, any> = {}): void {
    try {
      this.telemetrySink?.({ name, data });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[VariableService] Failed to record telemetry:', e);
    }
  }

  public setInterpolationService(service: IVariableInterpolationService): void {
    this.interpolationService = service;
  }

  /**
   * Update the dashboard ID after dashboard is saved.
   * This allows variables to be saved to the dashboard after it gets an ID.
   */
  public setDashboardId(dashboardId: string): void {
    this.dashboardId = dashboardId;
  }

  /**
   * Initialize the service with variables loaded from dashboard saved object.
   * This should be called once after creating the service.
   *
   * @param initialVariables - Variables loaded from dashboard saved object
   */
  public initialize(initialVariables: Variable[] = []): void {
    this.variables$.next(initialVariables);

    // Telemetry: reported once per dashboard load that carries variables.
    if (initialVariables.length > 0) {
      this.recordTelemetry('variables_loaded', {
        count: initialVariables.length,
        types: Array.from(new Set(initialVariables.map((v) => v.type))),
      });
    }
  }

  /**
   * Initialize the service by loading variables from dashboard saved object (asynchronous).
   * Only works if dashboardId and savedObjectsClient were provided in constructor.
   * This should be called once after creating the service, as an alternative to initialize().
   */
  public async initializeFromDashboard(): Promise<void> {
    if (!this.dashboardId || !this.savedObjectsClient) {
      return;
    }

    try {
      const dashboard = await this.savedObjectsClient.get<{ variablesJSON?: string }>(
        'dashboard',
        this.dashboardId
      );
      let variables: Variable[] = [];

      if (dashboard.attributes.variablesJSON) {
        const parsed = JSON.parse(dashboard.attributes.variablesJSON);
        variables = normalizePersistedVariables(parsed.variables) ?? [];
      }

      this.initialize(variables);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[VariableService] Failed to load variables from dashboard:', error);
    }
  }

  /**
   * Observable of variables merged with their runtime state.
   * Use this for UI components that need loading/error states.
   */
  public getVariables$(): Observable<VariableWithState[]> {
    return combineLatest([this.variables$, this.runtimeStateChange$]).pipe(
      map(([variables]) => this.mergeWithState(variables)),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr))
    );
  }

  /**
   * Observable of pure variables (configuration + current values only, no runtime state).
   * Use this for persistence/serialization where runtime state should be excluded.
   */
  public getVariablesWithoutState$(): Observable<Variable[]> {
    return this.variables$.pipe(distinctUntilChanged((prev, curr) => isEqual(prev, curr)));
  }

  /**
   * Get current variables (without runtime state).
   */
  public getVariables(): Variable[] {
    return this.variables$.getValue();
  }

  /**
   * Get current variables merged with runtime state (synchronous).
   * Use this for interpolation where runtime state (optionType) is needed.
   */
  public getVariablesWithState(): VariableWithState[] {
    return this.mergeWithState(this.variables$.getValue());
  }

  /**
   * Add a new variable.
   */
  public async addVariable(variable: DistributiveOmit<Variable, 'id'>): Promise<void> {
    const id = this.generateId();
    const newVariable = this.buildVariable(id, variable);

    // Initialize runtime state
    const initialRuntimeState = this.deriveRuntimeState(newVariable);
    if (newVariable.type === VariableType.Text) {
      newVariable.current = variable.current;
    } else {
      newVariable.current =
        initialRuntimeState.options.length > 0 ? [initialRuntimeState.options[0].value] : undefined;
    }

    const updatedVariables = [...this.getVariables(), newVariable];

    try {
      await this.saveVariables(updatedVariables, { id, update: () => initialRuntimeState });
    } catch (error) {
      this.recordTelemetry('variable_create_failed', {
        type: newVariable.type,
        errorType: (error as Error)?.name ?? 'Unknown',
      });
      throw error;
    }
    this.recordTelemetry('variable_create_succeeded', { type: newVariable.type });
  }

  public async updateVariable(id: string, updates: Partial<Variable>): Promise<void> {
    const currentVariables = this.getVariables();
    const index = currentVariables.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Variable with id ${id} not found`);
    }

    const existing = currentVariables[index];
    let updatedVariable: Variable;
    // Computed when the save is applied, not now: a refresh unrelated to this
    // save may start or finish while the save request is in flight, and its
    // loading flag and options must not be replaced with a stale snapshot.
    let runtimeUpdate: RuntimeStateUpdate | undefined;

    if (updates.type && updates.type !== existing.type) {
      // Type changed — rebuild from scratch and clear any error/loading states.
      // Clearing loading is safe: a refresh of the old query variable is
      // aborted by the next reconcile, and the new type has not been fetched.
      updatedVariable = this.buildVariable(id, { ...existing, ...updates } as DistributiveOmit<
        Variable,
        'id' | 'current'
      >);
      const derived = this.deriveRuntimeState(updatedVariable);
      runtimeUpdate = () => ({ ...derived, loading: false, error: undefined });
      if (updatedVariable.type === VariableType.Text) {
        const next = updates.current;
        updatedVariable.current = next && next.length > 0 ? [next[0]] : undefined;
      } else {
        updatedVariable.current =
          derived.options.length > 0 ? [derived.options[0].value] : undefined;
      }
    } else {
      updatedVariable = { ...existing, ...updates } as Variable;
      const sortChanged = updates.sort !== undefined && updates.sort !== existing.sort;

      if (updatedVariable.type === VariableType.Custom) {
        const customOptionsChanged =
          (updates as Partial<CustomVariable>).customOptions !== undefined &&
          !isEqual(
            (updates as Partial<CustomVariable>).customOptions,
            (existing as CustomVariable).customOptions
          );
        if (customOptionsChanged || sortChanged) {
          // Custom options come from the definition, so derive them now.
          const derived = this.deriveRuntimeState(updatedVariable);
          runtimeUpdate = () => derived;
          if (customOptionsChanged) {
            // Keep the "All" marker as-is so it tracks the new option list, instead
            // of reconciling it away to the first option (it is not a real option).
            updatedVariable.current = isAllMarker(updatedVariable.current)
              ? updatedVariable.current
              : this.resolveCurrentValueForCustom(
                  updatedVariable.current,
                  derived.options,
                  updatedVariable.multi
                );
          }
        }
      } else if (sortChanged) {
        // Re-sort whatever options the variable has when the save is applied.
        runtimeUpdate = (state) => ({
          options: this.sortVariableOptions(state.options, updates.sort),
        });
      }

      // When switching from multi to single, trim current to first value
      if (updates.multi === false && existing.multi === true && updatedVariable.current) {
        const current = this.clearAllMarker(updatedVariable.current);
        updatedVariable.current = current?.length ? [current[0]] : undefined;
      }

      // "All" no longer exists as an option, so drop the marker.
      if (updates.includeAll === false && existing.includeAll === true) {
        updatedVariable.current = this.clearAllMarker(updatedVariable.current);
      }
    }

    const updatedVariables = [...currentVariables];
    updatedVariables[index] = updatedVariable;

    try {
      // Runtime state is applied inside the save, after it succeeds.
      await this.saveVariables(
        updatedVariables,
        runtimeUpdate ? { id, update: runtimeUpdate } : undefined
      );
    } catch (error) {
      this.recordTelemetry('variable_update_failed', {
        type: updatedVariable.type,
        errorType: (error as Error)?.name ?? 'Unknown',
      });
      throw error;
    }
    this.recordTelemetry('variable_update_succeeded', { type: updatedVariable.type });
  }

  public async removeVariable(id: string): Promise<void> {
    const removed = this.getVariables().find((v) => v.id === id);
    const updatedVariables = this.getVariables().filter((v) => v.id !== id);
    this.refreshControllers.get(id)?.abort();
    await this.saveVariables(updatedVariables);
    this.recordTelemetry('variable_deleted', { type: removed?.type ?? 'unknown' });

    this.refreshControllers.delete(id);
    this.runtimeState.delete(id);
    this.runtimeStateChange$.next(this.runtimeStateChange$.value + 1);
  }

  public reorderVariables(sourceIndex: number, destinationIndex: number): void {
    const vars = [...this.getVariables()];
    const [moved] = vars.splice(sourceIndex, 1);
    vars.splice(destinationIndex, 0, moved);
    this.variables$.next(vars);
  }

  /**
   * Toggle variable visibility in memory without persisting to backend.
   * Changes will be saved when the dashboard is saved.
   */
  public toggleVariableHide(id: string): void {
    const currentVariables = this.getVariables();
    const updatedVariables = currentVariables.map((v) =>
      v.id === id ? ({ ...v, hide: !v.hide } as Variable) : v
    );
    this.variables$.next(updatedVariables);
  }

  public updateVariableValue(id: string, value: string[]): void {
    const currentVariables = this.getVariables();
    const index = currentVariables.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Variable with id ${id} not found`);
    }

    const variable = currentVariables[index];
    const updatedVariables = [...currentVariables];
    updatedVariables[index] = {
      ...variable,
      current: this.normalizeAllSelection(value),
    } as Variable;
    this.variables$.next(updatedVariables);
    // Telemetry: record variable change.
    this.recordTelemetry('variable_value_changed', { type: variable.type });
  }

  /**
   * Start the refresh scheduler. From then on every query variable is
   * re-queried whenever its fetch inputs change (see computeFetchKey), so no
   * mutation needs to trigger a refresh itself. The first reconcile runs once
   * `time$` has emitted. Returns a function that stops the scheduler; starting
   * again stops the previous one.
   */
  public startRefreshScheduler({ time$, reload$ }: VariableRefreshSchedulerInputs): () => void {
    this.stopRefreshScheduler();
    const subscription = new Subscription();
    this.schedulerSubscription = subscription;

    subscription.add(
      time$.subscribe((time) => {
        this.schedulerTime = time;
        this.schedulerTimeReady = true;
        this.scheduleReconcile();
      })
    );
    subscription.add(
      reload$.subscribe(() => {
        this.reloadToken++;
        this.scheduleReconcile();
      })
    );
    subscription.add(
      merge(this.variables$, this.runtimeStateChange$).subscribe(() => this.scheduleReconcile())
    );

    return () => {
      if (this.schedulerSubscription === subscription) this.stopRefreshScheduler();
    };
  }

  private stopRefreshScheduler(): void {
    this.schedulerSubscription?.unsubscribe();
    this.schedulerSubscription = undefined;
    this.schedulerTimeReady = false;
    // Nothing will refresh the waiting variables any more, so stop showing them as loading.
    this.waitingIds.forEach((id) => this.stopWaiting(id));
    this.waitingIds.clear();
    // Forget the last queries, so starting again always loads every variable.
    this.lastFetchKeys.clear();
    this.resolveSettledWaiters();
  }

  /**
   * Resolves once no query variable is loading or waiting on an upstream and
   * no reconcile is pending.
   */
  public whenSettled(): Promise<void> {
    if (this.isSettled()) return Promise.resolve();
    return new Promise((resolve) => this.settledWaiters.push(resolve));
  }

  private isSettled(): boolean {
    return (
      !this.reconcileScheduled &&
      this.waitingIds.size === 0 &&
      !this.getVariables().some((v) => this.runtimeState.get(v.id)?.loading)
    );
  }

  private resolveSettledWaiters(): void {
    if (!this.isSettled() && this.schedulerSubscription) return;
    const waiters = this.settledWaiters;
    this.settledWaiters = [];
    waiters.forEach((resolve) => resolve());
  }

  /**
   * Coalesces all state changes in the current task into one reconcile. Must be
   * asynchronous: reconcile starts refreshes, which emit state changes
   * synchronously and would otherwise re-enter it.
   */
  private scheduleReconcile(): void {
    if (this.reconcileScheduled) return;
    this.reconcileScheduled = true;
    Promise.resolve().then(() => {
      this.reconcileScheduled = false;
      if (this.schedulerSubscription && this.schedulerTimeReady) {
        this.reconcile();
      }
      this.resolveSettledWaiters();
    });
  }

  /**
   * Refreshes every query variable whose fetch key changed since its last query.
   * Variables are visited in list order, and a variable only interpolates
   * variables listed before it, so its upstreams are visited first. A variable
   * waits while an upstream is loading or itself waiting; otherwise it would
   * query with the upstream's old value and query again when it changes.
   */
  private reconcile(): void {
    const variables = this.getVariables();
    const ids = new Set(variables.map((v) => v.id));
    const waiting = new Set<string>();

    variables.forEach((variable, index) => {
      if (variable.type !== VariableType.Query) {
        // No longer a query variable (or never was): nothing to fetch.
        this.forgetFetch(variable.id);
        this.stopWaiting(variable.id);
        return;
      }

      const upstream = this.getUpstreamIds(variable, variables, index);
      if (upstream.some((id) => waiting.has(id) || this.runtimeState.get(id)?.loading)) {
        waiting.add(variable.id);
        // Show a waiting variable as loading. Panels and the editor act only
        // when no variable is loading, so they would otherwise query with its
        // old value as soon as its upstream finishes, before it refreshes.
        if (!this.runtimeState.get(variable.id)?.loading) {
          this.updateRuntimeState(variable.id, { loading: true });
        }
        return;
      }

      const key = this.computeFetchKey(variable as QueryVariable);
      if (key === this.lastFetchKeys.get(variable.id)) {
        this.stopWaiting(variable.id);
        return;
      }

      this.lastFetchKeys.set(variable.id, key);
      void this.refreshVariableOptions(variable.id);
    });

    for (const id of [...this.lastFetchKeys.keys()]) {
      if (!ids.has(id)) this.forgetFetch(id);
    }
    this.waitingIds = waiting;
  }

  /**
   * Clears the loading flag reconcile set on a variable while it waited, unless
   * a refresh of its own is running and owns that flag.
   */
  private stopWaiting(id: string): void {
    if (!this.waitingIds.has(id) || this.refreshControllers.has(id)) return;
    if (this.runtimeState.get(id)?.loading) {
      this.updateRuntimeState(id, { loading: false });
    }
  }

  private forgetFetch(id: string): void {
    if (!this.lastFetchKeys.has(id)) return;
    this.lastFetchKeys.delete(id);
    this.refreshControllers.get(id)?.abort();
  }

  /** Ids of variables listed before `variable` that its query references. */
  private getUpstreamIds(variable: Variable, variables: Variable[], index: number): string[] {
    const referenced = this.getReferencedVariableNames(variable);
    return variables
      .slice(0, index)
      .filter((v) => referenced.has(v.name))
      .map((v) => v.id);
  }

  /**
   * Everything a query variable's options depend on. Upstream values, "All"
   * expansion, renames, removals and ordering all show up in the interpolated
   * query, so equal keys mean an identical query.
   */
  private computeFetchKey(variable: QueryVariable): string {
    // The key uses the scheduler's time$ (the container's input.timeRange),
    // while the query itself reads the global timefilter (searchSource and
    // executePromQLResourceQuery). On a dashboard the two are kept in sync; if
    // they ever diverge, the time a query uses could change without its key.
    const time = variable.useTimeFilter
      ? { from: this.schedulerTime?.from, to: this.schedulerTime?.to }
      : undefined;
    return JSON.stringify({
      query: this.resolveQueryForFetch(variable),
      language: variable.language,
      dataset: variable.dataset,
      sourceKind: variable.sourceKind,
      valueField: variable.sourceKind === 'prometheusResource' ? undefined : variable.valueField,
      labelField: variable.sourceKind === 'prometheusResource' ? undefined : variable.labelField,
      regex: variable.regex,
      time,
      reload: this.reloadToken,
    });
  }

  /**
   * The query a variable will actually send: its query text, or PromQL resource
   * query, with the variables listed before it interpolated.
   */
  private resolveQueryForFetch(variable: QueryVariable): string | PromQLResourceQuery {
    return variable.sourceKind === 'prometheusResource'
      ? this.resolveResourceQueryForFetch(variable)
      : this.resolveQueryTextForFetch(variable);
  }

  private resolveResourceQueryForFetch(
    variable: Extract<QueryVariable, { sourceKind: 'prometheusResource' }>
  ): PromQLResourceQuery {
    const interpolation = this.interpolationService;
    if (!interpolation) return variable.promQLResourceQuery;
    return interpolateResourceQuery(variable.promQLResourceQuery, (value) =>
      interpolation.hasVariables(value)
        ? interpolation.interpolate(value, variable.language, variable.name, true)
        : value
    );
  }

  private resolveQueryTextForFetch(
    variable: Exclude<QueryVariable, { sourceKind: 'prometheusResource' }>
  ): string {
    const interpolation = this.interpolationService;
    if (!interpolation || !interpolation.hasVariables(variable.query)) return variable.query;
    // Order constraint: only variables listed before this one are interpolated.
    return interpolation.interpolate(variable.query, variable.language, variable.name);
  }

  private async refreshVariableOptions(id: string): Promise<void> {
    const variable = this.getVariables().find((v) => v.id === id);
    if (!variable || variable.type !== VariableType.Query) {
      return;
    }

    const queryVariable = variable as QueryVariable;

    this.refreshControllers.get(id)?.abort();
    const controller = new AbortController();
    this.refreshControllers.set(id, controller);

    this.updateRuntimeState(id, { loading: true, error: undefined });

    try {
      let options: NormalizedVariableOption[];
      let optionType: VariableOptionType | undefined;

      if (queryVariable.sourceKind === 'prometheusResource') {
        if (!this.dataPlugin) {
          throw new Error('VariableService not initialized with dataPlugin');
        }

        const timeRange = queryVariable.useTimeFilter
          ? this.dataPlugin.query.timefilter.timefilter.getTime()
          : undefined;

        const values = await executePromQLResourceQuery(
          this.dataPlugin,
          queryVariable.dataset?.id,
          this.resolveResourceQueryForFetch(queryVariable),
          timeRange
        );
        options = buildPromQLVariableOptions(values, queryVariable.regex);
        optionType = 'string';
      } else {
        const result = await this.fetchOptionsForVariableWithType(
          queryVariable,
          this.resolveQueryTextForFetch(queryVariable),
          controller.signal
        );
        const builtResult = buildVariableOptionsFromQueryResult(result, {
          valueField: queryVariable.valueField,
          labelField: queryVariable.labelField,
        });

        options = builtResult.options;
        if (queryVariable.regex) {
          options = applyRegexToVariableOptions(options, queryVariable.regex);
        }
        optionType = builtResult.optionType;
      }

      if (controller.signal.aborted) {
        return;
      }

      // Read current now rather than at the start: the user may have changed
      // the value while the query was running.
      const latest = this.getVariables().find((v) => v.id === id);
      if (!latest || latest.type !== VariableType.Query) {
        // Removed, or switched to another type before the reconcile aborted this refresh.
        return;
      }
      const latestCurrent = latest.current;

      // Likewise read sort now: it may have been changed by a save in the meantime.
      const sortedOptions = this.sortVariableOptions(options, (latest as QueryVariable).sort);
      // Keep the "All" marker as-is so it tracks whatever the new options are.
      const preservedCurrent = isAllMarker(latestCurrent)
        ? latestCurrent
        : this.resolveCurrentValueForQuery(latestCurrent, this.getOptionValues(sortedOptions));

      this.updateRuntimeState(id, {
        options: sortedOptions,
        optionType,
        loading: false,
        error: undefined,
      });

      // Update current in persisted state if it changed
      const currentVariables = this.getVariables();
      const updatedVariables = currentVariables.map((v) =>
        v.id === id ? { ...v, current: preservedCurrent } : v
      );
      this.variables$.next(updatedVariables);
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        // A newer refresh aborted this one and owns the loading state. An abort
        // from elsewhere must not leave the variable loading forever.
        if (!controller.signal.aborted) {
          this.updateRuntimeState(id, { loading: false });
        }
        return;
      }
      this.recordTelemetry('variable_query_failed', {
        type: queryVariable.type,
        language: queryVariable.language ?? 'unknown',
        errorType: error?.name ?? 'Unknown',
      });
      this.updateRuntimeState(id, {
        loading: false,
        error: error.message || 'Failed to fetch options',
      });
    } finally {
      if (this.refreshControllers.get(id) === controller) {
        this.refreshControllers.delete(id);
      }
    }
  }

  /** Names of the variables a query variable references, using the interpolation syntax. */
  private getReferencedVariableNames(variable: Variable): Set<string> {
    const names = new Set<string>();
    if (variable.type !== VariableType.Query) return names;
    const qv = variable as QueryVariable;
    const texts =
      qv.sourceKind === 'prometheusResource'
        ? collectResourceQueryTextFields(qv.promQLResourceQuery)
        : [qv.query];
    for (const text of texts) {
      if (typeof text !== 'string') continue;
      const pattern = VariableInterpolationService.VARIABLE_PATTERN;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        names.add(match[1] || match[2]);
      }
    }
    return names;
  }

  private getRuntimeState(id: string): VariableState {
    return this.runtimeState.get(id) ?? { options: [] };
  }

  /** Derive runtime option state from the variable definition. */
  private deriveRuntimeState(
    variable: Variable | DistributiveOmit<Variable, 'id' | 'current'>
  ): VariableState {
    if (variable.type === VariableType.Custom) {
      return this.deriveCustomRuntimeState(variable as CustomVariable);
    }
    return { options: [] };
  }

  private deriveCustomRuntimeState(variable: CustomVariable): VariableState {
    const normalizedOptions = this.normalizeCustomOptions(variable.customOptions ?? []);
    const sortedOptions = this.sortVariableOptions(normalizedOptions, variable.sort);

    return {
      options: sortedOptions,
    };
  }

  private sortVariableOptions(
    options: NormalizedVariableOption[],
    sort?: VariableSortOrder
  ): NormalizedVariableOption[] {
    if (!sort || sort === VariableSortOrder.Disabled) return options;

    const sorted = [...options];
    const getDisplayText = (option: NormalizedVariableOption) => option.label || option.value;
    switch (sort) {
      case VariableSortOrder.AlphabeticalAsc:
        return sorted.sort((a, b) => getDisplayText(a).localeCompare(getDisplayText(b)));
      case VariableSortOrder.AlphabeticalDesc:
        return sorted.sort((a, b) => getDisplayText(b).localeCompare(getDisplayText(a)));
      case VariableSortOrder.NumericalAsc:
        return sorted.sort((a, b) => parseFloat(a.value) - parseFloat(b.value));
      case VariableSortOrder.NumericalDesc:
        return sorted.sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
      default:
        return sorted;
    }
  }

  private normalizeCustomOptions(options: VariableOption[] = []): NormalizedVariableOption[] {
    return options.map((option) => {
      if (typeof option === 'string') {
        return { value: option };
      }

      const label = option.label?.trim();
      return {
        value: option.value,
        ...(label ? { label } : {}),
      };
    });
  }

  private getOptionValues(options: NormalizedVariableOption[]): string[] {
    return options.map((option) => option.value);
  }

  private normalizeVariableForPersistence(variable: Variable): Variable {
    if (variable.type !== VariableType.Custom) {
      return variable;
    }

    return {
      ...variable,
      customOptions: this.normalizeCustomOptions(variable.customOptions),
    };
  }

  /**
   * Resolve current value for Custom variables.
   * If current value is not in options, reset to first option.
   */
  private resolveCurrentValueForCustom(
    currentVal: string[] | undefined,
    options: NormalizedVariableOption[],
    multi?: boolean
  ): string[] | undefined {
    const optionValues = this.getOptionValues(options);
    if (currentVal && currentVal.length > 0 && optionValues.length > 0) {
      if (multi) {
        const selected = currentVal.filter((v) => optionValues.includes(v));
        return selected.length > 0 ? selected : [optionValues[0]];
      }
      return optionValues.includes(currentVal[0]) ? [currentVal[0]] : [optionValues[0]];
    }
    return optionValues.length > 0 ? [optionValues[0]] : undefined;
  }

  /**
   * Resolve current value for Query variables.
   * Preserve current value even if not in options (options may change with time range).
   */
  private resolveCurrentValueForQuery(
    currentVal: string[] | undefined,
    options: string[]
  ): string[] | undefined {
    if (currentVal && currentVal.length > 0) {
      // Always preserve user's selection for Query variables
      return currentVal;
    }
    // No current value: default to first option if available
    return options.length > 0 ? [options[0]] : undefined;
  }

  private clearAllMarker(currentVal: string[] | undefined): string[] | undefined {
    return isAllMarker(currentVal) ? undefined : currentVal;
  }

  /**
   * The "All" marker is mutually exclusive with concrete values. If both arrive
   * together, keep the concrete picks so the marker never leaks as a literal.
   */
  private normalizeAllSelection(value: string[]): string[] {
    if (value.length > 1 && value.includes(ALL_OPTION_VALUE)) {
      return value.filter((v) => v !== ALL_OPTION_VALUE);
    }
    return value;
  }

  private buildVariable(id: string, input: DistributiveOmit<Variable, 'id' | 'current'>): Variable {
    const base = {
      id,
      name: input.name,
      label: input.label,
      type: input.type,
      current: undefined,
      hide: input.hide,
      description: input.description,
    };

    const optionMeta = {
      multi: input.multi,
      includeAll: input.includeAll,
      customAllValue: input.customAllValue,
      allowCustomValue: input.allowCustomValue,
      sort: input.sort,
    };

    switch (input.type) {
      case VariableType.Query: {
        const v = input as DistributiveOmit<QueryVariable, 'id' | 'current'>;
        const shared = {
          ...base,
          ...optionMeta,
          type: VariableType.Query as const,
          regex: v.regex,
          useTimeFilter: v.useTimeFilter ?? false,
        };

        if (v.sourceKind === 'prometheusResource') {
          return {
            ...shared,
            sourceKind: v.sourceKind,
            language: 'PROMQL',
            dataset: v.dataset,
            promQLResourceQuery: v.promQLResourceQuery,
          };
        }
        return {
          ...shared,
          sourceKind: 'queryResult',
          language: v.language,
          query: v.query ?? '',
          dataset: v.dataset,
          valueField: v.valueField,
          labelField: v.labelField,
        };
      }
      case VariableType.Custom: {
        const v = input as Omit<CustomVariable, 'id' | 'current'>;
        return {
          ...base,
          ...optionMeta,
          type: VariableType.Custom,
          customOptions: this.normalizeCustomOptions(v.customOptions),
        } as CustomVariable;
      }
      case VariableType.Text: {
        return {
          ...base,
          type: VariableType.Text,
        } as TextVariable;
      }
      default:
        return { ...base, ...optionMeta } as Variable;
    }
  }

  /** Merge persisted variables with in-memory runtime state */
  private mergeWithState(variables: Variable[]): VariableWithState[] {
    return variables.map((v) => {
      if (!this.runtimeState.has(v.id)) {
        this.runtimeState.set(v.id, this.deriveRuntimeState(v));
      }
      return {
        ...v,
        ...this.getRuntimeState(v.id),
      };
    });
  }

  private updateRuntimeState(id: string, updates: Partial<VariableState>): void {
    const current = this.getRuntimeState(id);
    this.runtimeState.set(id, { ...current, ...updates });
    this.runtimeStateChange$.next(this.runtimeStateChange$.value + 1);
  }

  private async fetchOptionsForVariableWithType(
    variable: Exclude<QueryVariable, { sourceKind: 'prometheusResource' }>,
    query: string,
    signal?: AbortSignal
  ): Promise<VariableQueryResult> {
    if (!this.dataPlugin) {
      throw new Error('VariableService not initialized with dataPlugin');
    }
    return executeVariableQuery(
      this.dataPlugin,
      { query, language: variable.language, dataset: variable.dataset },
      signal,
      variable.useTimeFilter ?? false
    );
  }

  private generateId(): string {
    return uuidv4();
  }

  /**
   * Save variables - updates internal state and persists configuration to dashboard.
   * @param variables - Updated variables array
   * @param runtimeState - Runtime state change to apply for one variable once the
   *   save succeeds. It is written before variables$ emits, so the refresh the
   *   scheduler starts for the new configuration sees it and is not overwritten
   *   by it afterwards. `update` receives the runtime state at that moment and
   *   returns only the fields to change.
   */
  private async saveVariables(
    variables: Variable[],
    runtimeState?: { id: string; update: RuntimeStateUpdate }
  ): Promise<void> {
    if (!this.savedObjectsClient) {
      throw new Error('SavedObjectsClient is not initialized');
    }
    // Dashboard must be saved before adding/updating variables
    if (!this.dashboardId) {
      throw new Error('Dashboard must be saved before adding variables');
    }

    try {
      // Use empty string to clear variablesJSON when all variables are deleted
      // Using undefined would not remove the field from saved object
      const normalizedVariables = variables.map((variable) =>
        this.normalizeVariableForPersistence(variable)
      );
      const variablesJSON =
        normalizedVariables.length > 0 ? JSON.stringify({ variables: normalizedVariables }) : '';
      await this.savedObjectsClient.update('dashboard', this.dashboardId, {
        variablesJSON,
      });

      if (runtimeState) {
        // No runtimeStateChange$ emit needed: getVariables$ reads the map when
        // variables$ emits below, and that emit also schedules the reconcile.
        const current = this.getRuntimeState(runtimeState.id);
        this.runtimeState.set(runtimeState.id, { ...current, ...runtimeState.update(current) });
      }
      this.variables$.next(normalizedVariables);
    } catch (error) {
      throw error;
    }
  }

  public destroy(): void {
    this.stopRefreshScheduler();
    this.refreshControllers.forEach((c) => c.abort());
    this.refreshControllers.clear();
    this.runtimeState.clear();
    this.runtimeStateChange$.complete();
    this.variables$.complete();
    this.dashboardId = undefined;
    this.savedObjectsClient = undefined;
  }
}
