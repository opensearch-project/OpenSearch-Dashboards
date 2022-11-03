/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep, isEqual } from 'lodash';
import ReactDOM from 'react-dom';
import { merge, Subscription } from 'rxjs';

import { PLUGIN_ID, VisBuilderSavedObjectAttributes, VISBUILDER_SAVED_OBJECT } from '../../common';
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
  opensearchFilters,
  Query,
  TimefilterContract,
  TimeRange,
} from '../../../data/public';
import { validateSchemaState } from '../application/utils/validate_schema_state';
import { getExpressionLoader, getTypeService } from '../plugin_services';
import { PersistedState } from '../../../visualizations/public';
import { RenderState, VisualizationState } from '../application/utils/state_management';

// Apparently this needs to match the saved object type for the clone and replace panel actions to work
export const VISBUILDER_EMBEDDABLE = VISBUILDER_SAVED_OBJECT;

export interface VisBuilderEmbeddableConfiguration {
  savedVisBuilder: VisBuilderSavedObjectAttributes;
  // TODO: add indexPatterns as part of configuration
  // indexPatterns?: IIndexPattern[];
  editPath: string;
  editUrl: string;
  editable: boolean;
}

export interface VisBuilderOutput extends EmbeddableOutput {
  /**
   * Will contain the saved object attributes of the VisBuilder Saved Object that matches
   * `input.savedObjectId`. If the id is invalid, this may be undefined.
   */
  savedVisBuilder?: VisBuilderSavedObjectAttributes;
}

type ExpressionLoader = InstanceType<ExpressionsStart['ExpressionLoader']>;

export class VisBuilderEmbeddable extends Embeddable<SavedObjectEmbeddableInput, VisBuilderOutput> {
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
  private savedVisBuilder?: VisBuilderSavedObjectAttributes;
  private serializedState?: { visualization: string; style: string };
  private uiState?: PersistedState;

  constructor(
    timefilter: TimefilterContract,
    { savedVisBuilder, editPath, editUrl, editable }: VisBuilderEmbeddableConfiguration,
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
        defaultTitle: savedVisBuilder.title,
        editPath,
        editApp: PLUGIN_ID,
        editUrl,
        editable,
        savedVisBuilder,
      },
      parent
    );

    this.savedVisBuilder = savedVisBuilder;
    this.uiState = new PersistedState();

    this.autoRefreshFetchSubscription = timefilter
      .getAutoRefreshFetch$()
      .subscribe(this.updateHandler.bind(this));

    this.subscriptions.push(
      merge(this.getOutput$(), this.getInput$()).subscribe(() => {
        this.handleChanges();
      })
    );
  }

  private getSerializedState = () => {
    const { visualizationState: visualization = '{}', styleState: style = '{}' } =
      this.savedVisBuilder || {};
    return {
      visualization,
      style,
    };
  };

  private getExpression = async () => {
    if (!this.serializedState) {
      return;
    }
    const { visualization, style } = this.serializedState;

    const vizStateWithoutIndex = JSON.parse(visualization);
    const visualizationState: VisualizationState = {
      searchField: vizStateWithoutIndex.searchField,
      activeVisualization: vizStateWithoutIndex.activeVisualization,
      indexPattern: this.savedVisBuilder?.searchSourceFields?.index,
    };
    const renderState: RenderState = {
      visualization: visualizationState,
      style: JSON.parse(style),
    };
    const visualizationName = renderState.visualization?.activeVisualization?.name ?? '';
    const visualizationType = getTypeService().get(visualizationName);
    if (!visualizationType) {
      this.onContainerError(new Error(`Invalid visualization type ${visualizationName}`));
      return;
    }
    const { toExpression, ui } = visualizationType;
    const schemas = ui.containerConfig.data.schemas;
    const [valid, errorMsg] = validateSchemaState(schemas, visualizationState);

    if (!valid) {
      if (errorMsg) {
        this.onContainerError(new Error(errorMsg));
        return;
      }
    } else {
      // TODO: handle error in Expression creation
      const exp = await toExpression(renderState, {
        filters: this.filters,
        query: this.query,
        timeRange: this.timeRange,
      });
      return exp;
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
    return this.savedVisBuilder?.description;
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

    if (this.savedVisBuilder?.description) {
      div.setAttribute('data-description', this.savedVisBuilder.description);
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
    if (!isEqual(this.getSerializedState(), this.serializedState)) {
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

  // TODO: we may eventually need to add support for visualizations that use triggers like filter or brush, but current VisBuilder vis types don't support triggers
  // public supportedTriggers(): TriggerId[] {
  //   return this.visType.getSupportedTriggers?.() ?? [];
  // }
}
