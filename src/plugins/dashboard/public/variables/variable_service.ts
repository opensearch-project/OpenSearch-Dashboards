/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { DataPublicPluginStart } from '../../../data/public';
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
import { IVariableInterpolationService } from './variable_interpolation_service';

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

/**
 * VariableService — a self-contained feature for managing dashboard variables.
 */
export class VariableService {
  private dataPlugin?: DataPublicPluginStart;
  private dashboardId?: string;
  private savedObjectsClient?: SavedObjectsClientContract;
  private variables$ = new BehaviorSubject<Variable[]>([]);
  private refreshControllers: Map<string, AbortController> = new Map();
  private refreshRequests: Map<string, Promise<void>> = new Map();
  private interpolationService?: IVariableInterpolationService;
  private runtimeState: Map<string, VariableState> = new Map();
  private runtimeStateChange$ = new BehaviorSubject<number>(0);
  private telemetrySink?: VariableTelemetrySink;

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
      await this.saveVariables(updatedVariables);
    } catch (error) {
      this.recordTelemetry('variable_create_failed', {
        type: newVariable.type,
        errorType: (error as Error)?.name ?? 'Unknown',
      });
      throw error;
    }
    this.recordTelemetry('variable_create_succeeded', { type: newVariable.type });
    this.updateRuntimeState(id, initialRuntimeState);

    if (newVariable.type === VariableType.Query) {
      await this.refreshVariableOptions(id);
    }
  }

  public async updateVariable(id: string, updates: Partial<Variable>): Promise<void> {
    const currentVariables = this.getVariables();
    const index = currentVariables.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Variable with id ${id} not found`);
    }

    const existing = currentVariables[index];
    let updatedVariable: Variable;
    let newRuntimeState: VariableState | undefined;

    if (updates.type && updates.type !== existing.type) {
      // Type changed — rebuild from scratch and clear any error/loading states
      updatedVariable = this.buildVariable(id, { ...existing, ...updates } as DistributiveOmit<
        Variable,
        'id' | 'current'
      >);
      newRuntimeState = {
        ...this.deriveRuntimeState(updatedVariable),
        loading: false,
        error: undefined,
      };
      if (updatedVariable.type === VariableType.Text) {
        const next = updates.current;
        updatedVariable.current = next && next.length > 0 ? [next[0]] : undefined;
      } else {
        updatedVariable.current =
          newRuntimeState.options.length > 0 ? [newRuntimeState.options[0].value] : undefined;
      }
    } else {
      updatedVariable = { ...existing, ...updates } as Variable;

      // For Custom variables, re-derive options when customOptions changes
      if (
        updatedVariable.type === VariableType.Custom &&
        (updates as Partial<CustomVariable>).customOptions !== undefined &&
        !isEqual(
          (updates as Partial<CustomVariable>).customOptions,
          (existing as CustomVariable).customOptions
        )
      ) {
        newRuntimeState = {
          ...this.getRuntimeState(id),
          ...this.deriveRuntimeState(updatedVariable),
        };
        // Keep the "All" marker as-is so it tracks the new option list, instead
        // of reconciling it away to the first option (it is not a real option).
        updatedVariable.current = isAllMarker(updatedVariable.current)
          ? updatedVariable.current
          : this.resolveCurrentValueForCustom(
              updatedVariable.current,
              newRuntimeState.options,
              updatedVariable.multi
            );
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

      // When sort changes, re-sort the existing options
      if (updates.sort !== undefined && updates.sort !== existing.sort) {
        if (updatedVariable.type === VariableType.Custom) {
          newRuntimeState = {
            ...this.getRuntimeState(id),
            ...newRuntimeState,
            ...this.deriveRuntimeState(updatedVariable),
          };
        } else {
          const currentState = newRuntimeState || this.getRuntimeState(id);
          newRuntimeState = {
            ...currentState,
            options: this.sortVariableOptions(currentState.options, updates.sort),
          };
        }
      }
    }

    const updatedVariables = [...currentVariables];
    updatedVariables[index] = updatedVariable;

    try {
      await this.saveVariables(updatedVariables);
    } catch (error) {
      this.recordTelemetry('variable_update_failed', {
        type: updatedVariable.type,
        errorType: (error as Error)?.name ?? 'Unknown',
      });
      throw error;
    }
    this.recordTelemetry('variable_update_succeeded', { type: updatedVariable.type });

    // Update runtime state only after successful save
    if (newRuntimeState) {
      this.updateRuntimeState(id, newRuntimeState);
    }

    if (
      updatedVariable.type === VariableType.Query &&
      this.shouldRefreshQueryOptions(updates as Partial<QueryVariable>)
    ) {
      await this.refreshVariableOptions(id);
    }
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

    this.refreshDependentVariables(variable.name);
  }

  /**
   * Apply selected values that changed outside the service, e.g. when the dashboard URL
   * changes without remounting the dashboard (a link to the same dashboard, browser back/forward).
   * Only `current` is taken from the given variables; their definitions are ignored.
   */
  public applyCurrentValues(variables: Array<Pick<Variable, 'id' | 'current'>>): void {
    const currentById = new Map(variables.map((v) => [v.id, v.current]));
    const changed: Variable[] = [];
    const updatedVariables = this.getVariables().map((variable) => {
      if (!currentById.has(variable.id)) {
        return variable;
      }
      const next = currentById.get(variable.id);
      const current = next ? this.normalizeAllSelection(next) : next;
      if (isEqual(current, variable.current)) {
        return variable;
      }
      const updated = { ...variable, current } as Variable;
      changed.push(updated);
      return updated;
    });

    if (changed.length === 0) {
      return;
    }

    this.variables$.next(updatedVariables);
    // A query variable whose selection the URL cleared has no value to interpolate.
    // Re-run its options so it falls back to the first option, matching a fresh load.
    const cleared = changed.filter(
      (variable) =>
        variable.type === VariableType.Query && (!variable.current || variable.current.length === 0)
    );
    changed
      .filter((variable) => !cleared.includes(variable))
      .forEach((variable) => this.refreshDependentVariables(variable.name));
    if (cleared.length > 0) {
      this.refreshClearedVariables(cleared);
    }
  }

  /**
   * Refresh cleared variables in dashboard order, and their dependents only once the
   * fallback is chosen, so a cleared variable never resolves against a cleared parent.
   */
  private async refreshClearedVariables(cleared: Variable[]): Promise<void> {
    for (const variable of cleared) {
      await this.refreshVariableOptions(variable.id);
      // Another refresh (time range change, reload) may have aborted this one before the
      // fallback was chosen; wait for it so dependents see the parent's final value.
      await this.waitForPendingRefresh(variable.id);
      this.refreshDependentVariables(variable.name);
    }
  }

  private async waitForPendingRefresh(id: string): Promise<void> {
    let pending = this.refreshRequests.get(id);
    while (pending) {
      await pending;
      pending = this.refreshRequests.get(id);
    }
  }

  public refreshVariableOptions(id: string): Promise<void> {
    const request: Promise<void> = this.loadVariableOptions(id).finally(() => {
      if (this.refreshRequests.get(id) === request) {
        this.refreshRequests.delete(id);
      }
    });
    this.refreshRequests.set(id, request);
    return request;
  }

  private async loadVariableOptions(id: string): Promise<void> {
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
        const promQLResourceQuery = queryVariable.promQLResourceQuery;
        if (!this.dataPlugin) {
          throw new Error('VariableService not initialized with dataPlugin');
        }

        const timeRange = queryVariable.useTimeFilter
          ? this.dataPlugin.query.timefilter.timefilter.getTime()
          : undefined;

        let resolvedQueryType = promQLResourceQuery;
        if (this.interpolationService) {
          resolvedQueryType = interpolateResourceQuery(promQLResourceQuery, (value) =>
            this.interpolationService!.hasVariables(value)
              ? this.interpolationService!.interpolate(
                  value,
                  queryVariable.language,
                  queryVariable.name,
                  true
                )
              : value
          );
        }

        const values = await executePromQLResourceQuery(
          this.dataPlugin,
          queryVariable.dataset?.id,
          resolvedQueryType,
          timeRange
        );
        options = buildPromQLVariableOptions(values, queryVariable.regex);
        optionType = 'string';
      } else {
        const result = await this.fetchOptionsForVariableWithType(queryVariable, controller.signal);
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

      const sortedOptions = this.sortVariableOptions(options, queryVariable.sort);
      // Read `current` again: it may have been changed while the options were loading.
      const latestCurrent = this.getVariables().find((v) => v.id === id)?.current;
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

  public async refreshAllVariableOptions(): Promise<void> {
    const queryVariables = this.getVariables().filter((v) => v.type === VariableType.Query);
    for (const v of queryVariables) {
      await this.refreshVariableOptions(v.id);
    }
  }

  /**
   * Refresh only variables that have useTimeFilter enabled.
   * Called when time range changes.
   */
  public async refreshTimeFilteredVariableOptions(): Promise<void> {
    const queryVariables = this.getVariables().filter(
      (v) => v.type === VariableType.Query && (v as QueryVariable).useTimeFilter
    );
    for (const v of queryVariables) {
      await this.refreshVariableOptions(v.id);
    }
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

  private refreshDependentVariables(changedVarName: string): void {
    const variables = this.getVariables();
    const changedVarIndex = variables.findIndex((v) => v.name === changedVarName);
    if (changedVarIndex === -1) return;

    const pattern = new RegExp(`\\$\\{${changedVarName}\\}|\\$${changedVarName}\\b`);
    // Only refresh variables that come AFTER the changed variable
    // Variables before the changed variable cannot reference it due to order constraints
    for (let i = changedVarIndex + 1; i < variables.length; i++) {
      const v = variables[i];
      if (v.type === VariableType.Query) {
        const qv = v as QueryVariable;
        const referencesChangedVar =
          qv.sourceKind === 'prometheusResource'
            ? collectResourceQueryTextFields(qv.promQLResourceQuery).some((field) =>
                pattern.test(field)
              )
            : pattern.test(qv.query);
        if (referencesChangedVar) {
          this.refreshVariableOptions(qv.id);
        }
      }
    }
  }

  private shouldRefreshQueryOptions(updates: Partial<QueryVariable>): boolean {
    return [
      'query',
      'language',
      'dataset',
      'valueField',
      'labelField',
      'regex',
      'useTimeFilter',
      'promQLResourceQuery',
    ].some((key) => updates[key as keyof QueryVariable] !== undefined);
  }

  private async fetchOptionsForVariableWithType(
    variable: Exclude<QueryVariable, { sourceKind: 'prometheusResource' }>,
    signal?: AbortSignal
  ): Promise<VariableQueryResult> {
    if (!this.dataPlugin) {
      throw new Error('VariableService not initialized with dataPlugin');
    }
    let query = variable.query;
    if (this.interpolationService && this.interpolationService.hasVariables(query)) {
      // Enforce order constraint: only interpolate variables that appear before current variable
      query = this.interpolationService.interpolate(query, variable.language, variable.name);
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
   */
  private async saveVariables(variables: Variable[]): Promise<void> {
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

      this.variables$.next(normalizedVariables);
    } catch (error) {
      throw error;
    }
  }

  public destroy(): void {
    this.refreshControllers.forEach((c) => c.abort());
    this.refreshControllers.clear();
    this.refreshRequests.clear();
    this.runtimeState.clear();
    this.runtimeStateChange$.complete();
    this.variables$.complete();
    this.dashboardId = undefined;
    this.savedObjectsClient = undefined;
  }
}
