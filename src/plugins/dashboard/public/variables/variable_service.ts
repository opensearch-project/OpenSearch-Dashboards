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
  VariableState,
  VariableWithState,
  VariableOption,
  NormalizedVariableOption,
} from './types';
import {
  buildVariableOptionsFromQueryResult,
  executeVariableQuery,
  applyRegexToVariableOptions,
  VariableQueryResult,
} from './variable_query_utils';
import { IVariableInterpolationService } from './variable_interpolation_service';

/**
 * Maximum number of options to display for a variable.
 * This prevents performance issues with large option lists in the UI.
 */
const MAX_DISPLAY_OPTIONS = 100;

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

  /**
   * @param dataPlugin - Data plugin for executing queries
   * @param dashboardId - Dashboard ID for auto-saving (optional)
   * @param savedObjectsClient - Client for saving to dashboard saved object
   */
  constructor(
    dataPlugin?: DataPublicPluginStart,
    dashboardId?: string,
    savedObjectsClient?: SavedObjectsClientContract
  ) {
    this.dataPlugin = dataPlugin;
    this.dashboardId = dashboardId;
    this.savedObjectsClient = savedObjectsClient;
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
        variables = parsed.variables || [];
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
  public async addVariable(variable: Omit<Variable, 'id' | 'current'>): Promise<void> {
    const id = this.generateId();
    const newVariable = this.buildVariable(id, variable);

    // Initialize runtime state
    const initialRuntimeState = this.deriveRuntimeState(newVariable);
    const current =
      initialRuntimeState.options.length > 0 ? [initialRuntimeState.options[0].value] : undefined;
    newVariable.current = current;

    const updatedVariables = [...this.getVariables(), newVariable];
    await this.saveVariables(updatedVariables);
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
      updatedVariable = this.buildVariable(id, { ...existing, ...updates } as Omit<
        Variable,
        'id' | 'current'
      >);
      newRuntimeState = {
        ...this.deriveRuntimeState(updatedVariable),
        loading: false,
        error: undefined,
      };
      updatedVariable.current =
        newRuntimeState.options.length > 0 ? [newRuntimeState.options[0].value] : undefined;
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
        updatedVariable.current = this.resolveCurrentValueForCustom(
          updatedVariable.current,
          newRuntimeState.options,
          updatedVariable.multi
        );
      }

      // When switching from multi to single, trim current to first value
      if (updates.multi === false && existing.multi === true && updatedVariable.current) {
        updatedVariable.current =
          updatedVariable.current.length > 0 ? [updatedVariable.current[0]] : undefined;
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
    await this.saveVariables(updatedVariables);

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
    const updatedVariables = this.getVariables().filter((v) => v.id !== id);
    this.refreshControllers.get(id)?.abort();
    await this.saveVariables(updatedVariables);

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
    updatedVariables[index] = { ...variable, current: value } as Variable;
    this.variables$.next(updatedVariables);

    this.refreshDependentVariables(variable.name);
  }

  public async refreshVariableOptions(id: string): Promise<void> {
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
      const result = await this.fetchOptionsForVariableWithType(queryVariable, controller.signal);
      const builtResult = buildVariableOptionsFromQueryResult(result, {
        valueField: queryVariable.valueField,
        labelField: queryVariable.labelField,
      });

      let options = builtResult.options;
      if (queryVariable.regex) {
        options = applyRegexToVariableOptions(options, queryVariable.regex);
      }

      // Limit to MAX_DISPLAY_OPTIONS before sorting to improve performance
      const limitedOptions = options.slice(0, MAX_DISPLAY_OPTIONS);
      const sortedOptions = this.sortVariableOptions(limitedOptions, queryVariable.sort);
      const preservedCurrent = this.resolveCurrentValueForQuery(
        queryVariable.current,
        this.getOptionValues(sortedOptions)
      );

      this.updateRuntimeState(id, {
        options: sortedOptions,
        optionType: builtResult.optionType,
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
  private deriveRuntimeState(variable: Variable | Omit<Variable, 'id' | 'current'>): VariableState {
    if (variable.type === VariableType.Custom) {
      return this.deriveCustomRuntimeState(variable as CustomVariable);
    }
    return { options: [] };
  }

  private deriveCustomRuntimeState(variable: CustomVariable): VariableState {
    const normalizedOptions = this.normalizeCustomOptions(variable.customOptions ?? []);
    // Limit to MAX_DISPLAY_OPTIONS before sorting to preserve existing behavior.
    const limitedOptions = normalizedOptions.slice(0, MAX_DISPLAY_OPTIONS);
    const sortedOptions = this.sortVariableOptions(limitedOptions, variable.sort);

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

  private buildVariable(id: string, input: Omit<Variable, 'id' | 'current'>): Variable {
    const base: Omit<Variable, 'type'> & { type: VariableType } = {
      id,
      name: input.name,
      label: input.label,
      type: input.type,
      current: undefined,
      multi: input.multi,
      includeAll: input.includeAll,
      hide: input.hide,
      description: input.description,
      sort: input.sort,
    };

    switch (input.type) {
      case VariableType.Query: {
        const v = input as Omit<QueryVariable, 'id' | 'current'>;
        return {
          ...base,
          type: VariableType.Query,
          query: v.query ?? '',
          language: v.language,
          dataset: v.dataset,
          valueField: v.valueField,
          labelField: v.labelField,
          regex: v.regex,
          useTimeFilter: v.useTimeFilter ?? false,
        } as QueryVariable;
      }
      case VariableType.Custom: {
        const v = input as Omit<CustomVariable, 'id' | 'current'>;
        return {
          ...base,
          type: VariableType.Custom,
          customOptions: this.normalizeCustomOptions(v.customOptions),
        } as CustomVariable;
      }
      default:
        return base as Variable;
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
        if (pattern.test(qv.query)) {
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
    ].some((key) => updates[key as keyof QueryVariable] !== undefined);
  }

  private async fetchOptionsForVariableWithType(
    variable: QueryVariable,
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
    this.runtimeState.clear();
    this.runtimeStateChange$.complete();
    this.variables$.complete();
    this.dashboardId = undefined;
    this.savedObjectsClient = undefined;
  }
}
