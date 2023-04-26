/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep, isEqual } from 'lodash';
import ReactDOM from 'react-dom';
import { merge, Subscription } from 'rxjs';

import { PLUGIN_ID, VISBUILDER_SAVED_OBJECT } from '../../common';
import {
  Embeddable,
  EmbeddableOutput,
  ErrorEmbeddable,
  IContainer,
  SavedObjectEmbeddableInput,
} from '../../../embeddable/public';
import {
  ExpressionRenderError,
  ExpressionsStart,
  IExpressionLoaderParams,
} from '../../../expressions/public';
import {
  Filter,
  IIndexPattern,
  opensearchFilters,
  Query,
  TimefilterContract,
  TimeRange,
} from '../../../data/public';
import { validateSchemaState } from '../application/utils/validations/validate_schema_state';
import {
  getExpressionLoader,
  getIndexPatterns,
  getTypeService,
  getUIActions,
} from '../plugin_services';
import { PersistedState } from '../../../visualizations/public';
import { VisBuilderSavedVis } from '../saved_visualizations/transforms';
import { handleVisEvent } from '../application/utils/handle_vis_event';
import { VisBuilderEmbeddableFactoryDeps } from './vis_builder_embeddable_factory';

// Apparently this needs to match the saved object type for the clone and replace panel actions to work
export const VISBUILDER_EMBEDDABLE = VISBUILDER_SAVED_OBJECT;

export interface VisBuilderEmbeddableConfiguration {
  savedVis: VisBuilderSavedVis;
  indexPatterns?: IIndexPattern[];
  editPath: string;
  editUrl: string;
  editable: boolean;
  deps: VisBuilderEmbeddableFactoryDeps;
}

export interface VisBuilderInput extends SavedObjectEmbeddableInput {
  uiState?: any;
}

export interface VisBuilderOutput extends EmbeddableOutput {
  /**
   * Will contain the saved object attributes of the VisBuilder Saved Object that matches
   * `input.savedObjectId`. If the id is invalid, this may be undefined.
   */
  savedVis?: VisBuilderSavedVis;
  indexPatterns?: IIndexPattern[];
}

type ExpressionLoader = InstanceType<ExpressionsStart['ExpressionLoader']>;

export class VisBuilderEmbeddable extends Embeddable<VisBuilderInput, VisBuilderOutput> {
  public readonly type = VISBUILDER_EMBEDDABLE;
  private handler?: ExpressionLoader;
  private timeRange?: TimeRange;
  private query?: Query;
  private filters?: Filter[];
  private abortController?: AbortController;
  public expression: string = '';
  private autoRefreshFetchSubscription: Subscription;
  private subscriptions: Subscription[] = [];
  private node?: HTMLElement;
  private savedVis?: VisBuilderSavedVis;
  private serializedState?: string;
  private uiState: PersistedState;
  private readonly deps: VisBuilderEmbeddableFactoryDeps;

  constructor(
    timefilter: TimefilterContract,
    {
      savedVis,
      editPath,
      editUrl,
      editable,
      deps,
      indexPatterns,
    }: VisBuilderEmbeddableConfiguration,
    initialInput: SavedObjectEmbeddableInput,
    {
      parent,
    }: {
      parent?: IContainer;
    }
  ) {
    super(
      initialInput,
      {
        defaultTitle: savedVis.title,
        editPath,
        editApp: PLUGIN_ID,
        editUrl,
        editable,
        savedVis,
        indexPatterns,
      },
      parent
    );

    this.deps = deps;
    this.savedVis = savedVis;
    this.uiState = new PersistedState(savedVis.state.ui);
    this.uiState.on('change', this.uiStateChangeHandler);
    this.uiState.on('reload', this.reload);

    this.autoRefreshFetchSubscription = timefilter
      .getAutoRefreshFetch$()
      .subscribe(this.updateHandler.bind(this));

    this.subscriptions.push(
      merge(this.getOutput$(), this.getInput$()).subscribe(() => {
        this.handleChanges();
      })
    );
  }

  private getSerializedState = () => JSON.stringify(this.savedVis?.state);

  private getExpression = async () => {
    try {
      // Check if saved visualization exists
      const renderState = this.savedVis?.state;
      if (!renderState) throw new Error('No saved visualization');

      const visTypeString = renderState.visualization?.activeVisualization?.name || '';
      const visualizationType = getTypeService().get(visTypeString);

      if (!visualizationType) throw new Error(`Invalid visualization type ${visTypeString}`);

      const { toExpression, ui } = visualizationType;
      const schemas = ui.containerConfig.data.schemas;
      const { valid, errorMsg } = validateSchemaState(schemas, renderState.visualization);

      if (!valid && errorMsg) throw new Error(errorMsg);

      const exp = await toExpression(renderState, {
        filters: this.filters,
        query: this.query,
        timeRange: this.timeRange,
      });
      return exp;
    } catch (error) {
      this.onContainerError(error as Error);
      return;
    }
  };

  // Needed to enable inspection panel option
  public getInspectorAdapters = () => {
    if (!this.handler) {
      return undefined;
    }
    return this.handler.inspect();
  };

  // Needed to add informational tooltip
  public getDescription() {
    return this.savedVis?.description;
  }

  public render(node: HTMLElement) {
    if (this.output.error) {
      // TODO: Can we find a more elegant way to throw, propagate, and render errors?
      const errorEmbeddable = new ErrorEmbeddable(
        this.output.error as Error,
        this.input,
        this.parent
      );
      return errorEmbeddable.render(node);
    }
    this.timeRange = cloneDeep(this.input.timeRange);

    const div = document.createElement('div');
    div.className = `visBuilder visualize panel-content panel-content--fullWidth`;
    node.appendChild(div);

    this.node = div;
    super.render(this.node);

    // TODO: Investigate migrating to using `./wizard_component` for React rendering instead
    const ExpressionLoader = getExpressionLoader();
    this.handler = new ExpressionLoader(this.node, undefined, {
      onRenderError: (_element: HTMLElement, error: ExpressionRenderError) => {
        this.onContainerError(error);
      },
    });

    this.subscriptions.push(
      this.handler.events$.subscribe(async (event) => {
        if (!this.input.disableTriggers) {
          const indexPattern = await getIndexPatterns().get(
            this.savedVis?.state.visualization.indexPattern ?? ''
          );

          handleVisEvent(event, getUIActions(), indexPattern.timeFieldName);
        }
      })
    );

    if (this.savedVis?.description) {
      div.setAttribute('data-description', this.savedVis.description);
    }

    div.setAttribute('data-test-subj', 'visBuilderLoader');

    this.subscriptions.push(this.handler.loading$.subscribe(this.onContainerLoading));
    this.subscriptions.push(this.handler.render$.subscribe(this.onContainerRender));

    this.updateHandler();
  }

  public async reload() {
    this.updateHandler();
  }

  public destroy() {
    super.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());
    this.uiState.off('change', this.uiStateChangeHandler);
    this.uiState.off('reload', this.reload);
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }

    if (this.handler) {
      this.handler.destroy();
      this.handler.getElement().remove();
    }
    this.autoRefreshFetchSubscription.unsubscribe();
  }

  private async updateHandler() {
    const expressionParams: IExpressionLoaderParams = {
      searchContext: {
        timeRange: this.timeRange,
        query: this.input.query,
        filters: this.input.filters,
      },
      uiState: this.uiState,
    };
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const abortController = this.abortController;

    if (this.handler && !abortController.signal.aborted) {
      this.handler.update(this.expression, expressionParams);
    }
  }

  public async handleChanges() {
    // TODO: refactor (here and in visualize) to remove lodash dependency - immer probably a better choice
    this.transferInputToUiState();

    let dirty = false;

    // Check if timerange has changed
    if (!isEqual(this.input.timeRange, this.timeRange)) {
      this.timeRange = cloneDeep(this.input.timeRange);
      dirty = true;
    }

    // Check if filters has changed
    if (!opensearchFilters.onlyDisabledFiltersChanged(this.input.filters, this.filters)) {
      this.filters = this.input.filters;
      dirty = true;
    }

    // Check if query has changed
    if (!isEqual(this.input.query, this.query)) {
      this.query = this.input.query;
      dirty = true;
    }

    // Check if rootState has changed
    if (this.getSerializedState() !== this.serializedState) {
      this.serializedState = this.getSerializedState();
      dirty = true;
    }

    if (dirty) {
      this.expression = (await this.getExpression()) ?? '';

      if (this.handler) {
        this.updateHandler();
      }
    }
  }

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

  private uiStateChangeHandler = () => {
    this.updateInput({
      uiState: this.uiState.toJSON(),
    });
  };

  private transferInputToUiState = () => {
    if (JSON.stringify(this.input.uiState) !== this.uiState.toString())
      this.uiState.set(this.input.uiState);
  };

  // TODO: we may eventually need to add support for visualizations that use triggers like filter or brush, but current VisBuilder vis types don't support triggers
  // public supportedTriggers(): TriggerId[] {
  //   return this.visType.getSupportedTriggers?.() ?? [];
  // }
}
