/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { isEqual } from 'lodash';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import uuid from 'uuid';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { DataPublicPluginStart } from '../../../data/public';
import {
  Variable,
  VariableType,
  QueryVariable,
  CustomVariable,
  VariableState,
  VariableWithState,
} from './types';
import { executeQueryForOptions } from './variable_query_utils';
import { IVariableInterpolationService } from './variable_interpolation_service';

export type UpdateInputCallback = (input: {
  variables?: Variable[];
  lastReloadRequestTime?: number;
}) => void;
export type GetInputCallback = () => { variables?: Variable[] };
export type GetInput$Callback = () => Observable<{ variables?: Variable[] }>;

/**
 * VariableService — manages dashboard variables through DashboardContainer.
 */
export class VariableService {
  private dataPlugin?: DataPublicPluginStart;
  private updateInput?: UpdateInputCallback;
  private getInput?: GetInputCallback;
  private getInput$?: GetInput$Callback;
  private refreshControllers: Map<string, AbortController> = new Map();
  private interpolationService?: IVariableInterpolationService;
  private runtimeState: Map<string, VariableState> = new Map();
  private runtimeStateChange$ = new BehaviorSubject<number>(0);

  constructor(dataPlugin?: DataPublicPluginStart) {
    this.dataPlugin = dataPlugin;
  }

  public setInterpolationService(service: IVariableInterpolationService): void {
    this.interpolationService = service;
  }

  public connect(
    updateInput: UpdateInputCallback,
    getInput: GetInputCallback,
    getInput$: GetInput$Callback
  ): void {
    this.updateInput = updateInput;
    this.getInput = getInput;
    this.getInput$ = getInput$;
    this.getVariables().forEach((v) => this.ensureRuntimeState(v));
  }

  /**
   * Observable of variables merged with their runtime state.
   */
  public getVariables$(): Observable<VariableWithState[]> {
    if (!this.getInput$) {
      throw new Error('VariableService not connected to DashboardContainer');
    }
    return combineLatest([this.getInput$(), this.runtimeStateChange$]).pipe(
      map(([input]) => this.mergeWithState(input.variables || [])),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr))
    );
  }

  public getValues$(): Observable<Record<string, string[]>> {
    return this.getVariables$().pipe(
      map((variables) => {
        const values: Record<string, string[]> = {};
        variables.forEach((v) => {
          values[v.name] = v.current ?? [];
        });
        return values;
      }),
      distinctUntilChanged((prev, curr) => isEqual(prev, curr))
    );
  }

  /** Get persisted variables (without runtime state) */
  public getVariables(): Variable[] {
    if (!this.getInput) {
      return [];
    }
    return this.getInput().variables || [];
  }

  /** Get variables merged with runtime state */
  public getVariablesWithState(): VariableWithState[] {
    return this.mergeWithState(this.getVariables());
  }

  public getCurrentValues(): Record<string, string[]> {
    const variables = this.getVariables();
    const values: Record<string, string[]> = {};
    variables.forEach((v) => {
      values[v.name] = v.current ?? [];
    });
    return values;
  }

  public async addVariable(variable: Omit<Variable, 'id' | 'current'>): Promise<void> {
    if (!this.updateInput || !this.getInput) {
      throw new Error('VariableService not connected to DashboardContainer');
    }

    const id = this.generateId();
    const newVariable = this.buildVariable(id, variable);

    // Initialize runtime state
    const options = this.deriveOptions(newVariable);
    const current = options.length > 0 ? [options[0]] : undefined;
    newVariable.current = current;
    this.runtimeState.set(id, { options });

    const updatedVariables = [...this.getVariables(), newVariable];
    this.updateInput({ variables: updatedVariables });

    if (newVariable.type === VariableType.Query) {
      await this.refreshVariableOptions(id);
    }
  }

  public async updateVariable(id: string, updates: Partial<Variable>): Promise<void> {
    if (!this.updateInput) {
      throw new Error('VariableService not connected to DashboardContainer');
    }

    const currentVariables = this.getVariables();
    const index = currentVariables.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Variable with id ${id} not found`);
    }

    const existing = currentVariables[index];
    let updatedVariable: Variable;

    if (updates.type && updates.type !== existing.type) {
      // Type changed — rebuild from scratch
      updatedVariable = this.buildVariable(id, { ...existing, ...updates } as Omit<
        Variable,
        'id' | 'current'
      >);
      const options = this.deriveOptions(updatedVariable);
      updatedVariable.current = options.length > 0 ? [options[0]] : undefined;
      this.runtimeState.set(id, { options });
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
        this.runtimeState.set(id, { ...this.getRuntimeState(id), options });
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
    }

    const updatedVariables = [...currentVariables];
    updatedVariables[index] = updatedVariable;
    this.updateInput({ variables: updatedVariables });

    if ((updates as any).query !== undefined && updatedVariable.type === VariableType.Query) {
      await this.refreshVariableOptions(id);
    }
  }

  public removeVariable(id: string): void {
    if (!this.updateInput) {
      throw new Error('VariableService not connected to DashboardContainer');
    }
    const updatedVariables = this.getVariables().filter((v) => v.id !== id);
    this.refreshControllers.get(id)?.abort();
    this.refreshControllers.delete(id);
    this.runtimeState.delete(id);
    this.updateInput({ variables: updatedVariables });
  }

  public reorderVariables(sourceIndex: number, destinationIndex: number): void {
    if (!this.updateInput) {
      throw new Error('VariableService not connected to DashboardContainer');
    }
    const vars = [...this.getVariables()];
    const [moved] = vars.splice(sourceIndex, 1);
    vars.splice(destinationIndex, 0, moved);
    this.updateInput({ variables: vars });
  }

  public updateVariableValue(id: string, value: string[]): void {
    if (!this.updateInput) {
      throw new Error('VariableService not connected to DashboardContainer');
    }
    const currentVariables = this.getVariables();
    const index = currentVariables.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Variable with id ${id} not found`);
    }

    const variable = currentVariables[index];
    const updatedVariables = [...currentVariables];
    updatedVariables[index] = { ...variable, current: value } as Variable;
    this.updateInput({ variables: updatedVariables });

    this.refreshDependentVariables(variable.name);
  }

  public async refreshVariableOptions(id: string): Promise<void> {
    if (!this.updateInput) {
      throw new Error('VariableService not connected to DashboardContainer');
    }

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
      const options = await this.fetchOptionsForVariable(queryVariable, controller.signal);
      const preservedCurrent = this.resolveCurrentValue(
        queryVariable.current,
        options,
        queryVariable.multi
      );

      this.runtimeState.set(id, { options, loading: false, error: undefined });
      this.runtimeStateChange$.next(this.runtimeStateChange$.value + 1);

      // Update current in persisted state if it changed
      const currentVariables = this.getVariables();
      const updatedVariables = currentVariables.map((v) =>
        v.id === id ? { ...v, current: preservedCurrent } : v
      );
      this.updateInput({ variables: updatedVariables });
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

  private ensureRuntimeState(variable: Variable): void {
    if (!this.runtimeState.has(variable.id)) {
      this.runtimeState.set(variable.id, { options: this.deriveOptions(variable) });
    }
  }

  /** Derive options from the variable definition (Custom only; Query returns []) */
  private deriveOptions(variable: Variable | Omit<Variable, 'id' | 'current'>): string[] {
    if (variable.type === VariableType.Custom) {
      const customVar = variable as CustomVariable;
      return customVar.customOptions ?? [];
    }
    return [];
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
      this.ensureRuntimeState(v);
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

  public destroy(): void {
    this.refreshControllers.forEach((c) => c.abort());
    this.refreshControllers.clear();
    this.runtimeState.clear();
    this.runtimeStateChange$.complete();
    this.updateInput = undefined;
    this.getInput = undefined;
    this.getInput$ = undefined;
  }
}
