/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import _, { get, isEmpty } from 'lodash';
import { Subscription } from 'rxjs';
import * as Rx from 'rxjs';
import { i18n } from '@osd/i18n';
import { VISUALIZE_EMBEDDABLE_TYPE } from './constants';
import {
  IIndexPattern,
  TimeRange,
  Query,
  opensearchFilters,
  Filter,
  TimefilterContract,
} from '../../../../plugins/data/public';
import {
  EmbeddableInput,
  EmbeddableOutput,
  Embeddable,
  IContainer,
  Adapters,
  SavedObjectEmbeddableInput,
  ReferenceOrValueEmbeddable,
} from '../../../../plugins/embeddable/public';
import {
  IExpressionLoaderParams,
  ExpressionsStart,
  ExpressionRenderError,
} from '../../../expressions/public';
import { buildPipeline } from '../legacy/build_pipeline';
import { Vis, SerializedVis } from '../vis';
import { getExpressions, getNotifications, getUiActions } from '../services';
import { VIS_EVENT_TO_TRIGGER } from './events';
import { VisualizeEmbeddableFactoryDeps } from './visualize_embeddable_factory';
import { TriggerId } from '../../../ui_actions/public';
import { SavedObjectAttributes } from '../../../../core/types';
import { AttributeService, DASHBOARD_CONTAINER_TYPE } from '../../../dashboard/public';
import { SavedVisualizationsLoader } from '../saved_visualizations';
import {
  SavedAugmentVisLoader,
  ExprVisLayers,
  VisLayers,
  isEligibleForVisLayers,
  getAugmentVisSavedObjs,
  buildPipelineFromAugmentVisSavedObjs,
  getAnyErrors,
  AugmentVisContext,
  VisLayer,
  VisAugmenterEmbeddableConfig,
  PLUGIN_RESOURCE_DELETE_TRIGGER,
} from '../../../vis_augmenter/public';
import { VisSavedObject } from '../types';

const getKeys = <T extends {}>(o: T): Array<keyof T> => Object.keys(o) as Array<keyof T>;

export interface VisualizeEmbeddableConfiguration {
  vis: Vis;
  indexPatterns?: IIndexPattern[];
  editPath: string;
  editUrl: string;
  editable: boolean;
  deps: VisualizeEmbeddableFactoryDeps;
}

export interface VisualizeInput extends EmbeddableInput {
  vis?: {
    colors?: { [key: string]: string };
  };
  savedVis?: SerializedVis;
  table?: unknown;
  // TODO: This config, along with other VisAugmenter-related fields (visLayers, savedAugmentVisLoader)
  // can be decoupled from embeddables plugin entirely. It is only used for changing the underlying
  // visualization. Instead, we can use ReactExpressionRenderer for handling the rendering.
  // For details, see https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4483
  visAugmenterConfig?: VisAugmenterEmbeddableConfig;
}

export interface VisualizeOutput extends EmbeddableOutput {
  editPath: string;
  editApp: string;
  editUrl: string;
  indexPatterns?: IIndexPattern[];
  visTypeName: string;
}

export type VisualizeSavedObjectAttributes = SavedObjectAttributes & {
  title: string;
  vis?: Vis;
  savedVis?: VisSavedObject;
};
export type VisualizeByValueInput = { attributes: VisualizeSavedObjectAttributes } & VisualizeInput;
export type VisualizeByReferenceInput = SavedObjectEmbeddableInput & VisualizeInput;

type ExpressionLoader = InstanceType<ExpressionsStart['ExpressionLoader']>;

export class VisualizeEmbeddable
  extends Embeddable<VisualizeInput, VisualizeOutput>
  implements ReferenceOrValueEmbeddable<VisualizeByValueInput, VisualizeByReferenceInput> {
  private handler?: ExpressionLoader;
  private timefilter: TimefilterContract;
  private timeRange?: TimeRange;
  private query?: Query;
  private filters?: Filter[];
  private visCustomizations?: Pick<VisualizeInput, 'vis' | 'table'>;
  private subscriptions: Subscription[] = [];
  private expression: string = '';
  public vis: Vis;
  private domNode: any;
  public readonly type = VISUALIZE_EMBEDDABLE_TYPE;
  private autoRefreshFetchSubscription: Subscription;
  private abortController?: AbortController;
  private readonly deps: VisualizeEmbeddableFactoryDeps;
  private readonly inspectorAdapters?: Adapters;
  private attributeService?: AttributeService<
    VisualizeSavedObjectAttributes,
    VisualizeByValueInput,
    VisualizeByReferenceInput
  >;
  private savedVisualizationsLoader?: SavedVisualizationsLoader;
  private savedAugmentVisLoader?: SavedAugmentVisLoader;
  public visLayers?: VisLayer[];
  private visAugmenterConfig?: VisAugmenterEmbeddableConfig;

  constructor(
    timefilter: TimefilterContract,
    { vis, editPath, editUrl, indexPatterns, editable, deps }: VisualizeEmbeddableConfiguration,
    initialInput: VisualizeInput,
    attributeService?: AttributeService<
      VisualizeSavedObjectAttributes,
      VisualizeByValueInput,
      VisualizeByReferenceInput
    >,
    savedVisualizationsLoader?: SavedVisualizationsLoader,
    savedAugmentVisLoader?: SavedAugmentVisLoader,
    parent?: IContainer
  ) {
    super(
      initialInput,
      {
        defaultTitle: vis.title,
        editPath,
        editApp: 'visualize',
        editUrl,
        indexPatterns,
        editable,
        visTypeName: vis.type.name,
      },
      parent
    );
    this.deps = deps;
    this.timefilter = timefilter;
    this.vis = vis;
    this.vis.uiState.on('change', this.uiStateChangeHandler);
    this.vis.uiState.on('reload', this.reload);
    this.attributeService = attributeService;
    this.savedVisualizationsLoader = savedVisualizationsLoader;
    this.savedAugmentVisLoader = savedAugmentVisLoader;
    this.visAugmenterConfig = initialInput.visAugmenterConfig;
    this.autoRefreshFetchSubscription = timefilter
      .getAutoRefreshFetch$()
      .subscribe(this.updateHandler.bind(this));

    this.subscriptions.push(
      Rx.merge(this.getOutput$(), this.getInput$()).subscribe(() => {
        this.handleChanges();
      })
    );

    const inspectorAdapters = this.vis.type.inspectorAdapters;

    if (inspectorAdapters) {
      this.inspectorAdapters =
        typeof inspectorAdapters === 'function' ? inspectorAdapters() : inspectorAdapters;
    }
  }
  public getDescription() {
    return this.vis.description;
  }

  public getInspectorAdapters = () => {
    if (!this.handler || (this.inspectorAdapters && !Object.keys(this.inspectorAdapters).length)) {
      return undefined;
    }
    return this.handler.inspect();
  };

  public openInspector = () => {
    if (!this.handler) return;

    const adapters = this.handler.inspect();
    if (!adapters) return;

    return this.deps.start().plugins.inspector.open(adapters, {
      title: this.getTitle(),
    });
  };

  /**
   * Transfers all changes in the containerState.customization into
   * the uiState of this visualization.
   */
  public transferCustomizationsToUiState() {
    // Check for changes that need to be forwarded to the uiState
    // Since the vis has an own listener on the uiState we don't need to
    // pass anything from here to the handler.update method
    const visCustomizations = { vis: this.input.vis, table: this.input.table };
    if (visCustomizations.vis || visCustomizations.table) {
      if (!_.isEqual(visCustomizations, this.visCustomizations)) {
        this.visCustomizations = visCustomizations;
        // Turn this off or the uiStateChangeHandler will fire for every modification.
        this.vis.uiState.off('change', this.uiStateChangeHandler);
        this.vis.uiState.clearAllKeys();
        if (visCustomizations.vis) {
          this.vis.uiState.set('vis', visCustomizations.vis);
          getKeys(visCustomizations).forEach((key) => {
            this.vis.uiState.set(key, visCustomizations[key]);
          });
        }
        if (visCustomizations.table) {
          this.vis.uiState.set('table', visCustomizations.table);
        }
        this.vis.uiState.on('change', this.uiStateChangeHandler);
      }
    } else if (this.parent) {
      this.vis.uiState.clearAllKeys();
    }
  }

  public async handleChanges() {
    this.transferCustomizationsToUiState();

    let dirty = false;

    // Check if timerange has changed
    if (!_.isEqual(this.input.timeRange, this.timeRange)) {
      this.timeRange = _.cloneDeep(this.input.timeRange);
      dirty = true;
    }

    // Check if filters has changed
    if (!opensearchFilters.onlyDisabledFiltersChanged(this.input.filters, this.filters)) {
      this.filters = this.input.filters;
      dirty = true;
    }

    // Check if query has changed
    if (!_.isEqual(this.input.query, this.query)) {
      this.query = this.input.query;
      dirty = true;
    }

    if (this.vis.description && this.domNode) {
      this.domNode.setAttribute('data-description', this.vis.description);
    }

    if (this.handler && dirty) {
      this.updateHandler();
    }
  }

  // this is a hack to make editor still work, will be removed once we clean up editor
  // @ts-ignore
  hasInspector = () => Boolean(this.getInspectorAdapters());

  onContainerLoading = () => {
    this.renderComplete.dispatchInProgress();
    this.updateOutput({ loading: true, error: undefined });
  };

  onContainerRender = () => {
    this.renderComplete.dispatchComplete();
    this.updateOutput({ loading: false, error: undefined });
  };

  onContainerError = (error: ExpressionRenderError) => {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.renderComplete.dispatchError();
    this.updateOutput({ loading: false, error });
  };

  /**
   *
   * @param {Element} domNode
   */
  public async render(domNode: HTMLElement) {
    this.timeRange = _.cloneDeep(this.input.timeRange);

    this.transferCustomizationsToUiState();

    const div = document.createElement('div');
    div.className = `visualize panel-content panel-content--fullWidth`;
    domNode.appendChild(div);

    this.domNode = div;
    super.render(this.domNode);

    const expressions = getExpressions();
    this.handler = new expressions.ExpressionLoader(this.domNode, undefined, {
      onRenderError: (element: HTMLElement, error: ExpressionRenderError) => {
        this.onContainerError(error);
      },
    });

    this.subscriptions.push(
      this.handler.events$.subscribe(async (event) => {
        // maps hack, remove once esaggs function is cleaned up and ready to accept variables
        if (event.name === 'bounds') {
          const agg = this.vis.data.aggs!.aggs.find((a: any) => {
            return get(a, 'type.dslName') === 'geohash_grid';
          });
          if (
            (agg && agg.params.precision !== event.data.precision) ||
            (agg && !_.isEqual(agg.params.boundingBox, event.data.boundingBox))
          ) {
            agg.params.boundingBox = event.data.boundingBox;
            agg.params.precision = event.data.precision;
            this.reload();
          }
          return;
        }

        if (!this.input.disableTriggers) {
          const triggerId = get(VIS_EVENT_TO_TRIGGER, event.name, VIS_EVENT_TO_TRIGGER.filter);
          let context;

          if (triggerId === VIS_EVENT_TO_TRIGGER.applyFilter) {
            context = {
              embeddable: this,
              timeFieldName: this.vis.data.indexPattern?.timeFieldName!,
              ...event.data,
            };
          } else if (triggerId === VIS_EVENT_TO_TRIGGER.externalAction) {
            context = {
              savedObjectId: this.vis.id,
            } as AugmentVisContext;
          } else {
            context = {
              embeddable: this,
              data: { timeFieldName: this.vis.data.indexPattern?.timeFieldName!, ...event.data },
            };
          }

          getUiActions().getTrigger(triggerId).exec(context);
        }
      })
    );

    if (this.vis.description) {
      div.setAttribute('data-description', this.vis.description);
    }

    div.setAttribute('data-test-subj', 'visualizationLoader');
    div.setAttribute('data-shared-item', '');

    this.subscriptions.push(this.handler.loading$.subscribe(this.onContainerLoading));
    this.subscriptions.push(this.handler.render$.subscribe(this.onContainerRender));

    this.updateHandler();
  }

  public destroy() {
    super.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.vis.uiState.off('change', this.uiStateChangeHandler);
    this.vis.uiState.off('reload', this.reload);

    if (this.handler) {
      this.handler.destroy();
      this.handler.getElement().remove();
    }
    this.autoRefreshFetchSubscription.unsubscribe();
  }

  public reload = () => {
    this.handleVisUpdate();
  };

  private async updateHandler() {
    const expressionParams: IExpressionLoaderParams = {
      searchContext: {
        timeRange: this.timeRange,
        query: this.input.query,
        filters: this.input.filters,
      },
      uiState: this.vis.uiState,
      inspectorAdapters: this.inspectorAdapters,
    };
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const abortController = this.abortController;

    // By waiting for this to complete, this.visLayers will be populated.
    // Note we only fetch when in the context of a dashboard or in the view
    // events flyout - we do not show events or have event functionality when
    // in the vis edit view.
    const shouldFetchVisLayers =
      this.parent?.type === DASHBOARD_CONTAINER_TYPE || this.visAugmenterConfig?.inFlyout;
    if (shouldFetchVisLayers) {
      await this.populateVisLayers();
    }

    this.expression = await buildPipeline(this.vis, {
      timefilter: this.timefilter,
      timeRange: this.timeRange,
      abortSignal: this.abortController!.signal,
      visLayers: this.visLayers,
      visAugmenterConfig: this.visAugmenterConfig,
    });

    if (this.handler && !abortController.signal.aborted) {
      this.handler.update(this.expression, expressionParams);
    }
  }

  private handleVisUpdate = async () => {
    this.updateHandler();
  };

  private uiStateChangeHandler = () => {
    this.updateInput({
      ...this.vis.uiState.toJSON(),
    });
  };

  public supportedTriggers(): TriggerId[] {
    return this.vis.type.getSupportedTriggers?.() ?? [];
  }

  inputIsRefType = (input: VisualizeInput): input is VisualizeByReferenceInput => {
    if (!this.attributeService) {
      throw new Error('AttributeService must be defined for getInputAsRefType');
    }
    return this.attributeService.inputIsRefType(input as VisualizeByReferenceInput);
  };

  getInputAsValueType = async (): Promise<VisualizeByValueInput> => {
    const input = {
      savedVis: this.vis.serialize(),
    };
    if (this.getTitle()) {
      input.savedVis.title = this.getTitle();
    }
    delete input.savedVis.id;
    return new Promise<VisualizeByValueInput>((resolve) => {
      resolve({ ...(input as VisualizeByValueInput) });
    });
  };

  getInputAsRefType = async (): Promise<VisualizeByReferenceInput> => {
    const savedVis = await this.savedVisualizationsLoader?.get({});
    if (!savedVis) {
      throw new Error('Error creating a saved vis object');
    }
    if (!this.attributeService) {
      throw new Error('AttributeService must be defined for getInputAsRefType');
    }
    const saveModalTitle = this.getTitle()
      ? this.getTitle()
      : i18n.translate('visualizations.embeddable.placeholderTitle', {
          defaultMessage: 'Placeholder Title',
        });
    // @ts-ignore
    const attributes: VisualizeSavedObjectAttributes = {
      savedVis,
      vis: this.vis,
      title: this.vis.title,
    };
    return this.attributeService.getInputAsRefType(
      {
        id: this.id,
        attributes,
      },
      { showSaveModal: true, saveModalTitle }
    );
  };

  /**
   * Fetches any VisLayers, and filters out to only include ones in the list of
   * input resource IDs, if specified. Assigns them to this.visLayers.
   * Note this fn is public so we can fetch vislayers on demand when needed,
   * e.g., generating other vis embeddables in the view events flyout.
   */
  public async populateVisLayers(): Promise<void> {
    this.visLayers = await this.fetchVisLayers();
  }

  /**
   * Collects any VisLayers from plugin expressions functions
   * by fetching all AugmentVisSavedObjects that meets below criteria:
   * - includes a reference to the vis saved object id
   * - includes any of the plugin resource IDs, if specified
   */
  fetchVisLayers = async (): Promise<VisLayers> => {
    try {
      const expressionParams: IExpressionLoaderParams = {
        searchContext: {
          timeRange: this.timeRange,
          query: this.input.query,
          filters: this.input.filters,
        },
        uiState: this.vis.uiState,
        inspectorAdapters: this.inspectorAdapters,
      };
      const aborted = get(this.abortController, 'signal.aborted', false) as boolean;
      const augmentVisSavedObjs = await getAugmentVisSavedObjs(
        this.vis.id,
        this.savedAugmentVisLoader,
        undefined,
        this.visAugmenterConfig?.visLayerResourceIds
      );

      if (!isEmpty(augmentVisSavedObjs) && !aborted && isEligibleForVisLayers(this.vis)) {
        const visLayersPipeline = buildPipelineFromAugmentVisSavedObjs(augmentVisSavedObjs);
        // The initial input for the pipeline will just be an empty arr of VisLayers. As plugin
        // expression functions are ran, they will incrementally append their generated VisLayers to it.
        const visLayersPipelineInput = {
          type: 'vis_layers',
          layers: [] as VisLayers,
        };
        // We cannot use this.handler in this case, since it does not support the run() cmd
        // we need here. So, we consume the expressions service to run this directly instead.
        const exprVisLayers = (await getExpressions().run(
          visLayersPipeline,
          visLayersPipelineInput,
          expressionParams as Record<string, unknown>
        )) as ExprVisLayers;
        const visLayers = exprVisLayers.layers;

        /**
         * There may be some stale saved objs if any plugin resources have been deleted since last time
         * data was fetched from them via the expression functions. Execute this trigger so any listening
         * action can perform cleanup.
         *
         * TODO: this should be automatically handled by the saved objects plugin. Tracking issue:
         * https://github.com/opensearch-project/OpenSearch-Dashboards/issues/4499
         */
        getUiActions().getTrigger(PLUGIN_RESOURCE_DELETE_TRIGGER).exec({
          savedObjs: augmentVisSavedObjs,
          visLayers,
        });

        const err = getAnyErrors(visLayers, this.vis.title);
        // This is only true when one or more VisLayers has an error
        if (err !== undefined) {
          const { toasts } = getNotifications();
          toasts.addError(err, {
            title: i18n.translate('visualizations.renderVisTitle', {
              defaultMessage: 'Error loading data on the {visTitle} chart',
              values: { visTitle: this.vis.title },
            }),
            toastMessage: ' ',
            id: this.id,
          });
        }
        return visLayers;
      }
    } catch {
      return [] as VisLayers;
    }
    return [] as VisLayers;
  };
}
