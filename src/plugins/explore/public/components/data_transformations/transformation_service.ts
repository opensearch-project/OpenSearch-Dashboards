/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { isEqual } from 'lodash';
import { IOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import {
  TransformationInstance,
  TransformationPipeline,
  TransformationDefinition,
  ITransformationService,
  UrlTransformationState,
} from './types';
import {
  addTransformation,
  removeTransformation,
  updateTransformationConfig,
  toggleTransformationHide,
  deriveSchemaFromRows,
} from './transformation_utils';
import { OpenSearchSearchHit } from '../../types/doc_views_types';

export const TRANSFORMATION_STATE_KEY = '_t';

export class TransformationService implements ITransformationService {
  // catelog of available transformations
  private definitions = new Map<string, TransformationDefinition>();

  // Active pipeline — list of transformation instances user choice
  public pipeline$ = new BehaviorSubject<TransformationPipeline>([]);

  private urlStateStorage?: IOsdUrlStateStorage;
  private urlSyncSubscription?: Subscription;

  /**
   * transformation catalog management
   */
  registerDefinition(definition: TransformationDefinition): void {
    this.definitions.set(definition.id, definition);
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
    return this.pipeline$.pipe(debounceTime(300));
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
        instance_id: item.instanceId,
        config: item.config,
        hide: item.hide,
      });
    }
    if (restoredPipeline.length > 0) {
      this.pipeline$.next(restoredPipeline);
    }
  }

  /**
   * Apply the full pipeline in a single pass, collecting per-stage schemas.
   * Returns:
   * rows: final transformed rows
   * stageSchemas: stageSchemas[i] = schema available as input to step i
   */
  applyPipeline(
    rawRows: OpenSearchSearchHit[],
    originalSchema: Array<{ name?: string; type?: string }> = []
  ): { rows: OpenSearchSearchHit[]; stageSchemas: Array<Array<{ name?: string; type?: string }>> } {
    const instances = this.pipeline$.getValue();
    const stageSchemas: Array<Array<{ name?: string; type?: string }>> = [];

    if (instances.length === 0) return { rows: rawRows, stageSchemas: [originalSchema] };

    let rows = [...rawRows];
    let currentSchema: Array<{ name?: string; type?: string }> = [...originalSchema];

    for (const instance of instances) {
      stageSchemas.push(currentSchema);

      if (instance.hide) continue;

      try {
        rows = instance.transformationMethod(rows, instance.config);
        // deriveSchemaFromRows handles field add/remove
        currentSchema = deriveSchemaFromRows(rows, currentSchema);
        // transformSchema handles type override
        if (instance.transformSchema) {
          currentSchema = instance.transformSchema(currentSchema, instance.config);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `TransformationService: step "${instance.instance_id}" threw — skipping`,
          err
        );
      }
    }

    // Push final schema, return output of last step
    stageSchemas.push(currentSchema);

    return { rows, stageSchemas };
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
        instanceId: instance.instance_id,
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
    this.definitions.clear();
  }
}

export const createNoOpTransformationService = (): ITransformationService => ({
  registerDefinition: () => {},
  getDefinitions: () => [],
  getDefinitionsByType: () => [],
  getDefinition: () => undefined,
  pipeline$: new BehaviorSubject<TransformationPipeline>([]),
  getPipeline$: () => new BehaviorSubject<TransformationPipeline>([]).asObservable(),
  addInstance: () => {},
  removeInstance: () => {},
  updateInstanceConfig: () => {},
  toggleInstanceHide: () => {},
  setPipeline: () => {},
  clearPipeline: () => {},
  applyPipeline: (rawRows: any[]) => ({ rows: rawRows ?? [], stageSchemas: [] }),
  initUrlSync: () => {},
  destroy: () => {},
});
