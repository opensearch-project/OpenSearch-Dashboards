/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import uuid from 'uuid';
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
} from './types';
import { executeQueryForOptions, filterOptionsByRegex } from './variable_query_utils';
import { IVariableInterpolationService } from './variable_interpolation_service';

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
   * Add a new variable.
   */
  public async addVariable(variable: Omit<Variable, 'id' | 'current'>): Promise<void> {
    const id = this.generateId();
    const newVariable = this.buildVariable(id, variable);

    // Initialize runtime state
    const options = this.deriveOptions(newVariable);
    const current = options.length > 0 ? [options[0]] : undefined;
    newVariable.current = current;

    const updatedVariables = [...this.getVariables(), newVariable];
    await this.saveVariables(updatedVariables);
    this.updateRuntimeState(id, { options });

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
      // Type changed — rebuild from scratch
      updatedVariable = this.buildVariable(id, { ...existing, ...updates } as Omit<
        Variable,
        'id' | 'current'
      >);
      const options = this.deriveOptions(updatedVariable);
      updatedVariable.current = options.length > 0 ? [options[0]] : undefined;
      newRuntimeState = { options };
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
        const options = this.deriveOptions(updatedVariable);
        newRuntimeState = { ...this.getRuntimeState(id), options };
        updatedVariable.current = this.resolveCurrentValue(
          updatedVariable.current,
          options,
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
        const currentState = newRuntimeState || this.getRuntimeState(id);
        const sorted = this.sortOptions(currentState.options, updates.sort);
        newRuntimeState = { ...currentState, options: sorted };
      }
    }

    const updatedVariables = [...currentVariables];
    updatedVariables[index] = updatedVariable;
    await this.saveVariables(updatedVariables);

    // Update runtime state only after successful save
    if (newRuntimeState) {
      this.updateRuntimeState(id, newRuntimeState);
    }

    if ((updates as any).query !== undefined && updatedVariable.type === VariableType.Query) {
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
      let options = await this.fetchOptionsForVariable(queryVariable, controller.signal);
      options = filterOptionsByRegex(options, queryVariable.regex);
      const sortedOptions = this.sortOptions(options, queryVariable.sort);
      const preservedCurrent = this.resolveCurrentValue(
        queryVariable.current,
        sortedOptions,
        queryVariable.multi
      );

      this.updateRuntimeState(id, { options: sortedOptions, loading: false, error: undefined });

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

  private getRuntimeState(id: string): VariableState {
    return this.runtimeState.get(id) ?? { options: [] };
  }

  /** Derive options from the variable definition (Custom only; Query returns []) */
  private deriveOptions(variable: Variable | Omit<Variable, 'id' | 'current'>): string[] {
    if (variable.type === VariableType.Custom) {
      const customVar = variable as CustomVariable;
      return this.sortOptions(customVar.customOptions ?? [], (variable as any).sort);
    }
    return [];
  }

  /** Sort options based on the variable's sort setting */
  private sortOptions(options: string[], sort?: VariableSortOrder): string[] {
    if (!sort || sort === VariableSortOrder.Disabled) return options;

    const sorted = [...options];
    switch (sort) {
      case VariableSortOrder.AlphabeticalAsc:
        return sorted.sort((a, b) => a.localeCompare(b));
      case VariableSortOrder.AlphabeticalDesc:
        return sorted.sort((a, b) => b.localeCompare(a));
      case VariableSortOrder.NumericalAsc:
        return sorted.sort((a, b) => parseFloat(a) - parseFloat(b));
      case VariableSortOrder.NumericalDesc:
        return sorted.sort((a, b) => parseFloat(b) - parseFloat(a));
      default:
        return sorted;
    }
  }

  private resolveCurrentValue(
    currentVal: string[] | undefined,
    options: string[],
    multi?: boolean
  ): string[] | undefined {
    if (currentVal && currentVal.length > 0 && options.length > 0) {
      if (multi) {
        const selected = currentVal.filter((v) => options.includes(v));
        return selected.length > 0 ? selected : [options[0]];
      }
      return options.includes(currentVal[0]) ? [currentVal[0]] : [options[0]];
    }
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
          regex: v.regex,
        } as QueryVariable;
      }
      case VariableType.Custom: {
        const v = input as Omit<CustomVariable, 'id' | 'current'>;
        return {
          ...base,
          type: VariableType.Custom,
          customOptions: v.customOptions,
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
        this.runtimeState.set(v.id, { options: this.deriveOptions(v) });
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
    const pattern = new RegExp(`\\$\\{${changedVarName}\\}|\\$${changedVarName}\\b`);
    for (const v of variables) {
      if (v.type === VariableType.Query) {
        const qv = v as QueryVariable;
        if (pattern.test(qv.query)) {
          this.refreshVariableOptions(qv.id);
        }
      }
    }
  }

  private async fetchOptionsForVariable(
    variable: QueryVariable,
    signal?: AbortSignal
  ): Promise<string[]> {
    if (!this.dataPlugin) {
      throw new Error('VariableService not initialized with dataPlugin');
    }
    let query = variable.query;
    if (this.interpolationService && this.interpolationService.hasVariables(query)) {
      query = this.interpolationService.interpolate(query, variable.language);
    }
    return executeQueryForOptions(
      this.dataPlugin,
      { query, language: variable.language, dataset: variable.dataset },
      signal
    );
  }

  private generateId(): string {
    return uuid.v4();
  }

  /**
   * Save variables - updates internal state and persists configuration to dashboard.
   * @param variables - Updated variables array
   */
  private async saveVariables(variables: Variable[]): Promise<void> {
    // Dashboard must be saved before adding/updating variables
    if (!this.dashboardId || !this.savedObjectsClient) {
      throw new Error('Dashboard must be saved before adding variables');
    }

    try {
      const variablesJSON = variables.length > 0 ? JSON.stringify({ variables }) : undefined;
      await this.savedObjectsClient.update('dashboard', this.dashboardId, {
        variablesJSON,
      });

      this.variables$.next(variables);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[VariableService] Failed to save variables to dashboard:', error);
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
