/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { isEqual } from 'lodash';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import {
  TransformationPipeline,
  TransformationDefinition,
  ITransformationService,
  UrlTransformationState,
  TransformationIssue,
  TransformationStepResult,
  FieldSchema,
} from './types';
import {
  addTransformation,
  removeTransformation,
  updateTransformationConfig,
  toggleTransformationHide,
  inferSchemaFromRows,
} from './transformation_utils';
import { OpenSearchSearchHit } from '../../types/doc_views_types';
import { FIELD_TYPE_MAP } from '../visualizations/constants';
import { VisFieldType } from '../visualizations/types';

export const TRANSFORMATION_STATE_KEY = '_t';

// Rows determine which fields exist; the current schema preserves metadata for fields that remain.
const reconcileSchemaWithRows = (
  rows: OpenSearchSearchHit[],
  currentSchema: Array<{ name?: string; type?: string }>,
  typeOverrides: Record<string, string> = {}
): Array<{ name?: string; type?: string }> => {
  const inferredSchema = inferSchemaFromRows(rows);
  const inferredByName = new Map(inferredSchema.map((field) => [field.name, field]));
  const reconciledSchema: Array<{ name?: string; type?: string }> = [];

  for (const field of currentSchema) {
    if (!field.name) {
      continue;
    }
    const inferredField = inferredByName.get(field.name);
    if (!inferredField) {
      continue;
    }
    reconciledSchema.push({
      ...field,
      type: typeOverrides[field.name] ?? field.type ?? inferredField.type,
    });
    inferredByName.delete(field.name);
  }

  for (const field of inferredByName.values()) {
    reconciledSchema.push({
      ...field,
      type: typeOverrides[field.name] ?? field.type,
    });
  }

  return reconciledSchema;
};

// TODO: Preserve raw schema types in stageFields$ instead of reducing them to VisFieldType.
// Transformation editors need distinctions such as boolean versus string; VisFieldType is
// a visualization-level classification. Keep this projection until the editor contract is updated.
const getFieldSchemas = (schema: Array<{ name?: string; type?: string }>): FieldSchema[] =>
  schema.flatMap((field) =>
    field.name
      ? [
          {
            name: field.name,
            visFieldType: FIELD_TYPE_MAP[field.type ?? ''] ?? VisFieldType.Unknown,
          },
        ]
      : []
  );

export class TransformationService implements ITransformationService {
  // Catalog of available transformations.
  private definitions = new Map<string, TransformationDefinition>();

  // Active pipeline of transformation instances selected by the user.
  public pipeline$ = new BehaviorSubject<TransformationPipeline>([]);
  // Per-instance fields projected from each step's input rows.
  public stageFields$ = new BehaviorSubject<Map<string, FieldSchema[]>>(new Map());
  private debouncedPipeline$ = this.pipeline$.pipe(debounceTime(300));

  private urlStateStorage?: IOsdUrlStateStorage;
  private urlSyncSubscription?: Subscription;

  /**
   * transformation catalog management
   */
  registerDefinition<TConfig>(definition: TransformationDefinition<TConfig>): void {
    if (this.definitions.has(definition.id)) {
      // eslint-disable-next-line no-console
      console.warn(`TransformationService: overwriting existing definition "${definition.id}"`);
    }
    this.definitions.set(definition.id, definition as TransformationDefinition);
  }

  getDefinitions(): TransformationDefinition[] {
    return Array.from(this.definitions.values());
  }

  getDefinitionsByType(type: string): TransformationDefinition[] {
    return Array.from(this.definitions.values()).filter((d) => d.type === type);
  }

  getDefinition(id: string): TransformationDefinition | undefined {
    return this.definitions.get(id);
  }

  /**
   * Pipeline instances management
   */

  getPipeline$(): Observable<TransformationPipeline> {
    return this.debouncedPipeline$;
  }

  addInstance(id: string): void {
    const definition = this.definitions.get(id);
    if (!definition) {
      throw new Error(`TransformationService: unknown transformation id "${id}"`);
    }
    this.pipeline$.next(addTransformation(this.pipeline$.getValue(), definition.createInstance()));
  }

  removeInstance(id: string): void {
    this.pipeline$.next(removeTransformation(this.pipeline$.getValue(), id));
  }

  updateInstanceConfig(id: string, newConfig: Record<string, unknown>): void {
    this.pipeline$.next(updateTransformationConfig(this.pipeline$.getValue(), id, newConfig));
  }

  toggleInstanceHide(id: string): void {
    this.pipeline$.next(toggleTransformationHide(this.pipeline$.getValue(), id));
  }

  setPipeline(instances: TransformationPipeline): void {
    this.pipeline$.next(instances);
  }

  clearPipeline(): void {
    this.pipeline$.next([]);
    // Also clear URL state so it doesn't restore the old pipeline on next render
    if (this.urlStateStorage) {
      this.urlStateStorage.set(TRANSFORMATION_STATE_KEY, [], { replace: true });
    }
  }

  restoreFromState(states: UrlTransformationState[]): void {
    if (!states || !Array.isArray(states) || states.length === 0) return;

    const restoredPipeline: TransformationPipeline = [];
    for (const item of states) {
      const definition = this.definitions.get(item.definitionId);
      if (!definition) continue;
      const instance = definition.createInstance();
      restoredPipeline.push({
        ...instance,
        config: item.config,
        hide: item.hide,
      });
    }
    if (restoredPipeline.length > 0) {
      this.pipeline$.next(restoredPipeline);
    }
  }

  /**
   * Apply the full pipeline without changing its stored configuration.
   * Returns the final rows, their inferred schema, and execution diagnostics for each step.
   * stageFields$ projects each step's input rows into fields for its editor.
   */
  applyPipeline(
    rawRows: OpenSearchSearchHit[],
    originalSchema: Array<{ name?: string; type?: string }> = []
  ): {
    rows: OpenSearchSearchHit[];
    finalSchema: Array<{ name?: string; type?: string }>;
    steps: TransformationStepResult[];
  } {
    const instances = this.pipeline$.getValue();

    if (instances.length === 0) {
      this.stageFields$.next(new Map());
      return { rows: rawRows, finalSchema: originalSchema, steps: [] };
    }

    const stageFields = new Map<string, FieldSchema[]>();
    const steps: TransformationStepResult[] = [];
    let rows = [...rawRows];
    let currentSchema = reconcileSchemaWithRows(rows, originalSchema);

    for (const instance of instances) {
      stageFields.set(instance.instance_id, getFieldSchemas(currentSchema));

      if (instance.hide) {
        steps.push({
          instanceId: instance.instance_id,
          definitionId: instance.definition_id,
          status: 'skipped',
          issues: [],
        });
        continue;
      }

      try {
        const result = instance.transformationMethod(rows, instance.config);
        rows = result.rows;
        currentSchema = reconcileSchemaWithRows(rows, currentSchema, result.typeOverrides);

        steps.push({
          instanceId: instance.instance_id,
          definitionId: instance.definition_id,
          status: result.status,
          issues: result.issues,
        });
      } catch (err) {
        const executionIssue: TransformationIssue = {
          code: 'execution_error',
          message: err instanceof Error ? err.message : String(err),
        };
        // eslint-disable-next-line no-console
        console.error(
          `TransformationService: step "${instance.instance_id}" throws — skipping`,
          err
        );
        steps.push({
          instanceId: instance.instance_id,
          definitionId: instance.definition_id,
          status: 'failed',
          issues: [executionIssue],
        });
      }
    }

    this.stageFields$.next(stageFields);

    const hasActiveTransformations = instances.some((instance) => !instance.hide);
    const finalSchema = hasActiveTransformations ? currentSchema : originalSchema;

    return { rows, finalSchema, steps };
  }

  /**
   * Url storage sync
   * restore pipeline from URL and subscribe to changes
   */

  initUrlSync(urlStateStorage: IOsdUrlStateStorage): void {
    this.urlStateStorage = urlStateStorage;

    // 1.restore pipeline from URL (if exists)
    this.restoreFromUrl();

    // 2.subscribe to pipeline changes and persist to URL
    this.urlSyncSubscription = this.pipeline$
      .pipe(
        debounceTime(500),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe((pipeline) => {
        this.persistToUrl(pipeline);
      });
  }

  private restoreFromUrl(): void {
    if (!this.urlStateStorage) return;

    try {
      const states = this.urlStateStorage.get<UrlTransformationState[]>(TRANSFORMATION_STATE_KEY);
      if (!states || !Array.isArray(states)) return;
      if (states.length === 0) {
        this.pipeline$.next([]);
        return;
      }
      this.restoreFromState(states);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('TransformationService: failed to restore from URL', err);
    }
  }

  /**
   * Persist pipeline to URL state
   */
  private persistToUrl(pipeline: TransformationPipeline): void {
    if (!this.urlStateStorage) return;

    try {
      const states: UrlTransformationState[] = pipeline.map((instance) => ({
        definitionId: instance.definition_id,
        config: instance.config,
        hide: instance.hide,
      }));

      this.urlStateStorage.set(TRANSFORMATION_STATE_KEY, states, { replace: true });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('TransformationService: failed to persist to URL', err);
    }
  }

  destroy(): void {
    if (this.urlSyncSubscription) {
      this.urlSyncSubscription.unsubscribe();
    }
    this.pipeline$.complete();
    this.stageFields$.complete();
    this.definitions.clear();
  }
}

export const createNoOpTransformationService = (): ITransformationService => {
  const pipeline$ = new BehaviorSubject<TransformationPipeline>([]);
  const stageFields$ = new BehaviorSubject<Map<string, FieldSchema[]>>(new Map());

  return {
    registerDefinition: () => {},
    getDefinitions: () => [],
    getDefinitionsByType: () => [],
    getDefinition: () => undefined,
    pipeline$,
    stageFields$,
    getPipeline$: () => pipeline$,
    addInstance: () => {},
    removeInstance: () => {},
    updateInstanceConfig: () => {},
    toggleInstanceHide: () => {},
    setPipeline: () => {},
    clearPipeline: () => {},
    applyPipeline: (rawRows: OpenSearchSearchHit[], originalSchema = []) => ({
      rows: rawRows,
      finalSchema: originalSchema,
      steps: [],
    }),
    initUrlSync: () => {},
    destroy: () => {},
    restoreFromState: (states: UrlTransformationState[]) => {},
  };
};
