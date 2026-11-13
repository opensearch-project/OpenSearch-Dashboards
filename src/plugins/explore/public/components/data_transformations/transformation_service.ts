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
  NormalizedRow,
  FinalPipelineSeriesResult,
  TransformationInstance,
  MultiSeriesTransformationInstance,
  SeriesExecutionResult,
} from './types';
import { mergeSeries } from './merge_series';
import type { SeriesResult } from '../../application/in_context_vis_editor/multi_query_builder/types';
import {
  addTransformation,
  removeTransformation,
  updateTransformationConfig,
  toggleTransformationHide,
  inferSchemaFromRows,
  isCompleteFieldSchema,
} from './transformation_utils';

export const TRANSFORMATION_STATE_KEY = '_t';

type StepOutcome = Omit<SeriesExecutionResult, 'status'> & {
  status: TransformationStepResult['status'];
};

// Non-empty rows determine which fields exist. Empty results preserve the last known schema
// because they provide no evidence that fields were removed.
const reconcileSchemaWithRows = (
  rows: NormalizedRow[],
  currentSchema: FieldSchema[],
  typeOverrides: Record<string, string> = {}
): FieldSchema[] => {
  if (rows.length === 0) {
    return currentSchema;
  }

  const inferredSchema = inferSchemaFromRows(rows);
  const inferredByName = new Map(inferredSchema.map((field) => [field.name, field]));
  const reconciledSchema: FieldSchema[] = [];

  for (const field of currentSchema) {
    const inferredField = inferredByName.get(field.name);
    if (!inferredField) {
      continue;
    }
    reconciledSchema.push({
      ...field,
      type: typeOverrides[field.name] ?? field.type,
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

// The refId of the one series applyPipeline runs on.
const SINGLE_SERIES_REF_ID = 'A';

// Every series's fields, first-seen name wins: what a step's editor offers (unified field picker).
const unionSchema = (series: SeriesResult[]): FieldSchema[] => {
  const byName = new Map<string, FieldSchema>();
  series.forEach(({ fieldSchema }) =>
    fieldSchema.forEach((field) => {
      if (!byName.has(field.name)) byName.set(field.name, field);
    })
  );
  return Array.from(byName.values());
};

// Its applyTo query's; without applyTo, the only series (several need the user to pick one).
const resolveTargetSeries = (applyTo: string | undefined, series: SeriesResult[]) =>
  applyTo
    ? series.find(({ refId }) => refId === applyTo)
    : series.length === 1
      ? series[0]
      : undefined;

const toExecutionIssue = (err: unknown): TransformationIssue => ({
  code: 'execution_error',
  message: err instanceof Error ? err.message : String(err),
});

/**
 * A single-series step on one series: its applyTo query's, or the only series without applyTo.
 * With several series and no applyTo it waits for the user to pick a query (skipped).
 */
const runSingleSeriesStep = (
  instance: TransformationInstance,
  series: SeriesResult[]
): StepOutcome => {
  const { applyTo } = instance;

  const target = resolveTargetSeries(applyTo, series);
  // No query picked yet (several series): an unconfigured step, like a missing required field
  if (!target && !applyTo) {
    return {
      series,
      status: 'skipped',
      issues: [{ code: 'invalid_config', message: 'Pick the query this step applies to.' }],
    };
  }
  if (!target) {
    return {
      series,
      status: 'skipped',
      issues: [
        {
          code: 'missing_series',
          message: `Query ${applyTo} isn't in this step's input (removed, hidden, or merged by an earlier step).`,
        },
      ],
    };
  }
  const outcome = runOnSingleSeries(instance, target);
  return {
    ...outcome,
    // replace applyTo to transformed outcome
    series: series.map((oneSeries) =>
      oneSeries.refId === target.refId ? outcome.series[0] : oneSeries
    ),
  };
};

// One series through the step: its own result; a throw keeps the series as it was.
const runOnSingleSeries = (
  instance: TransformationInstance,
  oneSeries: SeriesResult
): StepOutcome => {
  try {
    const result = instance.transformationMethod(oneSeries.rows, instance.config);
    return {
      series: [
        {
          ...oneSeries,
          rows: result.rows,
          fieldSchema: reconcileSchemaWithRows(
            result.rows,
            oneSeries.fieldSchema,
            result.typeOverrides
          ),
        },
      ],
      status: result.status,
      issues: result.issues,
    };
  } catch (err) {
    return { series: [oneSeries], status: 'failed', issues: [toExecutionIssue(err)] };
  }
};

// A multi-series step on every series at once; a throw leaves the series as they were.
const runMultiSeriesStep = (
  instance: MultiSeriesTransformationInstance,
  series: SeriesResult[]
): StepOutcome => {
  try {
    const result = instance.seriesMethod(series, instance.config);
    return {
      series: result.series.map((oneSeries) => ({
        ...oneSeries,
        fieldSchema: reconcileSchemaWithRows(oneSeries.rows, oneSeries.fieldSchema),
      })),
      status: result.status,
      issues: result.issues,
    };
  } catch (err) {
    return { series, status: 'failed', issues: [toExecutionIssue(err)] };
  }
};

// The series the pipeline ended with, merged into the one series the vis reads.
const toPipelineResult = (
  series: SeriesResult[],
  steps: TransformationStepResult[]
): FinalPipelineSeriesResult => {
  // default merge
  const merged = mergeSeries(series);
  return {
    series,
    rows: merged.rows,
    finalSchema: merged.fieldSchema,
    seriesDisplayNames: merged.seriesDisplayNames,
    queryField: merged.queryField,
    steps,
  };
};

export class TransformationService implements ITransformationService {
  // Catalog of available transformations.
  private definitions = new Map<string, TransformationDefinition>();

  // Active pipeline of transformation instances selected by the user.
  public pipeline$ = new BehaviorSubject<TransformationPipeline>([]);
  // Per-instance fields projected from each step's input rows.
  public stageFields$ = new BehaviorSubject<Map<string, FieldSchema[]>>(new Map());
  // Per-instance outcome of the last applyPipeline run.
  public stepResults$ = new BehaviorSubject<Map<string, TransformationStepResult>>(new Map());
  // Per-instance refIds of the series entering the step (for the applyTo and query pickers).
  public stageRefIds$ = new BehaviorSubject<Map<string, string[]>>(new Map());
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

  // Limits a single-series step to one query
  updateInstanceApplyTo(id: string, refId: string | undefined): void {
    this.pipeline$.next(
      this.pipeline$
        .getValue()
        .map((instance) =>
          instance.instance_id === id ? { ...instance, applyTo: refId } : instance
        )
    );
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
        ...(typeof item.applyTo === 'string' && item.applyTo ? { applyTo: item.applyTo } : {}),
      });
    }
    if (restoredPipeline.length > 0) {
      this.pipeline$.next(restoredPipeline);
    }
  }

  serializePipeline(
    pipeline: TransformationPipeline = this.pipeline$.getValue()
  ): UrlTransformationState[] {
    return pipeline.map((instance) => ({
      definitionId: instance.definition_id,
      config: instance.config,
      hide: instance.hide,
      ...(instance.applyTo ? { applyTo: instance.applyTo } : {}),
    }));
  }

  /**
   * Apply the full pipeline to one query without changing its stored configuration.
   * Returns the final rows, their inferred schema, and execution diagnostics for each step.
   * stageFields$ projects each step's input rows into fields for its editor.
   */
  applyPipeline(
    inputRows: NormalizedRow[],
    originalSchema: Array<{ name?: string; type?: string }> = []
  ): {
    rows: NormalizedRow[];
    finalSchema: FieldSchema[];
    steps: TransformationStepResult[];
  } {
    // One query is one series; one series never gets a Query column.
    const { rows, finalSchema, steps } = this.applyPipelineToSeries([
      {
        refId: SINGLE_SERIES_REF_ID,
        rows: inputRows,
        fieldSchema: originalSchema.filter(isCompleteFieldSchema),
      },
    ]);
    return { rows, finalSchema, steps };
  }

  /**
   * Apply the full pipeline to multi queries without changing its configuration.
   * A single-series step runs on one series (its applyTo query's, else the first); the others pass
   * through. A multi-series step runs on all series. Series left at the end are merged into one series (implicit Merge series);
   * stageFields$ gets each step's input fields: a single-series step its target series' fields; a
   * multi-series step, or one whose applyTo series is gone, the union over its series.
   */
  applyPipelineToSeries(inputSeries: SeriesResult[]): FinalPipelineSeriesResult {
    const instances = this.pipeline$.getValue();
    const initialSeries = inputSeries.map((oneSeries) => ({
      ...oneSeries,
      fieldSchema: reconcileSchemaWithRows(
        oneSeries.rows,
        oneSeries.fieldSchema.filter(isCompleteFieldSchema)
      ),
    }));

    if (instances.length === 0) {
      this.stageFields$.next(new Map());
      this.stageRefIds$.next(new Map());
      this.stepResults$.next(new Map());
      return toPipelineResult(initialSeries, []);
    }

    const stageFields = new Map<string, FieldSchema[]>();
    const stageRefIds = new Map<string, string[]>();
    const steps: TransformationStepResult[] = [];
    let series = initialSeries;

    for (const instance of instances) {
      // A multi-series step (e.g. join) offers every series's fields; a single-series step its
      // target series' fields, none until a query is picked (or when its query is gone).
      stageFields.set(
        instance.instance_id,
        'seriesMethod' in instance
          ? unionSchema(series)
          : (resolveTargetSeries(instance.applyTo, series)?.fieldSchema ?? [])
      );
      stageRefIds.set(
        instance.instance_id,
        series.map(({ refId }) => refId)
      );

      if (instance.hide) {
        steps.push({
          instanceId: instance.instance_id,
          definitionId: instance.definition_id,
          status: 'skipped',
          issues: [],
        });
        continue;
      }

      // An instance is multi-series when it has seriesMethod (the union has no shared discriminant).
      const outcome =
        'seriesMethod' in instance
          ? runMultiSeriesStep(instance, series)
          : runSingleSeriesStep(instance, series);
      series = outcome.series;
      steps.push({
        instanceId: instance.instance_id,
        definitionId: instance.definition_id,
        status: outcome.status,
        issues: outcome.issues,
      });
    }

    this.stageFields$.next(stageFields);
    this.stageRefIds$.next(stageRefIds);
    this.stepResults$.next(new Map(steps.map((step) => [step.instanceId, step])));

    // With every step hidden, keep the input schema (as before: hidden steps change nothing).
    const hasActiveTransformations = instances.some((instance) => !instance.hide);
    return toPipelineResult(hasActiveTransformations ? series : initialSeries, steps);
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

  /** Stops persisting the pipeline to the URL (the pipeline itself stays). */
  stopUrlSync(): void {
    this.urlSyncSubscription?.unsubscribe();
    this.urlSyncSubscription = undefined;
    this.urlStateStorage = undefined;
  }

  /** Back to an empty pipeline for a new session; the registered definitions stay. */
  reset(): void {
    this.stopUrlSync();
    this.pipeline$.next([]);
    this.stageFields$.next(new Map());
    this.stageRefIds$.next(new Map());
    this.stepResults$.next(new Map());
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
      this.urlStateStorage.set(TRANSFORMATION_STATE_KEY, this.serializePipeline(pipeline), {
        replace: true,
      });
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
    this.stageRefIds$.complete();
    this.stepResults$.complete();
    this.definitions.clear();
  }
}
