/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep, isEqual } from 'lodash';
import ReactDOM from 'react-dom';
import { merge, Subscription } from 'rxjs';

import { PLUGIN_ID, WizardSavedObjectAttributes, WIZARD_SAVED_OBJECT } from '../../common';
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

// Apparently this needs to match the saved object type for the clone and replace panel actions to work
export const WIZARD_EMBEDDABLE = WIZARD_SAVED_OBJECT;

export interface WizardEmbeddableConfiguration {
  savedWizard: WizardSavedObjectAttributes;
  // TODO: add indexPatterns as part of configuration
  // indexPatterns?: IIndexPattern[];
  editPath: string;
  editUrl: string;
  editable: boolean;
}

export interface WizardOutput extends EmbeddableOutput {
  /**
   * Will contain the saved object attributes of the Wizard Saved Object that matches
   * `input.savedObjectId`. If the id is invalid, this may be undefined.
   */
  savedWizard?: WizardSavedObjectAttributes;
}

type ExpressionLoader = InstanceType<ExpressionsStart['ExpressionLoader']>;

export class WizardEmbeddable extends Embeddable<SavedObjectEmbeddableInput, WizardOutput> {
  public readonly type = WIZARD_EMBEDDABLE;
  private handler?: ExpressionLoader;
  private timeRange?: TimeRange;
  private query?: Query;
  private filters?: Filter[];
  private abortController?: AbortController;
  public expression: string = '';
  private autoRefreshFetchSubscription: Subscription;
  private subscriptions: Subscription[] = [];
  private node?: HTMLElement;
  private savedWizard?: WizardSavedObjectAttributes;
  private serializedState?: { visualization: string; style: string };

  constructor(
    timefilter: TimefilterContract,
    { savedWizard, editPath, editUrl, editable }: WizardEmbeddableConfiguration,
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
        defaultTitle: savedWizard.title,
        editPath,
        editApp: PLUGIN_ID,
        editUrl,
        editable,
        savedWizard,
      },
      parent
    );

    this.savedWizard = savedWizard;

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
      this.savedWizard || {};
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
    const visualizationState = {
      searchField: vizStateWithoutIndex.searchField,
      activeVisualization: vizStateWithoutIndex.activeVisualization,
      indexPattern: this.savedWizard?.searchSourceFields?.index,
    };
    const rootState = {
      visualization: visualizationState,
      style: JSON.parse(style),
    };
    const visualizationName = rootState.visualization?.activeVisualization?.name ?? '';
    const visualizationType = getTypeService().get(visualizationName);
    if (!visualizationType) {
      this.onContainerError(new Error(`Invalid visualization type ${visualizationName}`));
      return;
    }
    const { toExpression, ui } = visualizationType;
    const schemas = ui.containerConfig.data.schemas;
    const [valid, errorMsg] = validateSchemaState(schemas, rootState);

    if (!valid) {
      if (errorMsg) {
        this.onContainerError(new Error(errorMsg));
        return;
      }
    } else {
      // TODO: handle error in Expression creation
      const exp = await toExpression(rootState);
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
    return this.savedWizard?.description;
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
    div.className = `wizard visualize panel-content panel-content--fullWidth`;
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

    if (this.savedWizard?.description) {
      div.setAttribute('data-description', this.savedWizard.description);
    }

    div.setAttribute('data-test-subj', 'wizardLoader');

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
      this.expression = (await this.getExpression()) ?? '';
      dirty = true;
    }

    if (this.handler && dirty) {
      this.updateHandler();
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

  // TODO: we may eventually need to add support for visualizations that use triggers like filter or brush, but current wizard vis types don't support triggers
  // public supportedTriggers(): TriggerId[] {
  //   return this.visType.getSupportedTriggers?.() ?? [];
  // }
}
