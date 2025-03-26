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

import * as Rx from 'rxjs';
import { Subscription } from 'rxjs';
import React from 'react';
import ReactDOM from 'react-dom';
import { i18n } from '@osd/i18n';
import { UiActionsStart } from '../../../ui_actions/public';
import { RequestAdapter, Adapters } from '../../../inspector/public';
import { Container, Embeddable } from '../../../embeddable/public';
import { IMetricEmbeddable, MetricInput, MetricOutput } from './types';

import { getExpressions, getServices, IndexPattern } from '../opensearch_dashboards_services';
import { METRIC_EMBEDDABLE_TYPE } from './constants';

import { DiscoverServices } from '../build_services';

import { SavedMetric } from '../saved_metric_viz';
import { MetricEmbeddableComponent } from './metric_embeddable_component';

import {
  ExpressionRenderError,
  ExpressionsStart,
  IExpressionLoaderParams,
} from '../../../expressions/public';

export interface MetricProps {
  services: DiscoverServices;
  title?: string;
  expression: string;
}

interface MetricEmbeddableConfig {
  savedMetric: SavedMetric;
  indexPatterns?: IndexPattern[];
  editable: boolean;
  services: DiscoverServices;
}

type ExpressionLoader = InstanceType<ExpressionsStart['ExpressionLoader']>;

export class MetricEmbeddable
  extends Embeddable<MetricInput, MetricOutput>
  implements IMetricEmbeddable {
  private handler?: ExpressionLoader;
  private readonly savedMetric: SavedMetric;
  private inspectorAdaptors: Adapters;
  private metricProps?: MetricProps;
  private panelTitle: string = '';
  private autoRefreshFetchSubscription?: Subscription;
  private subscriptions: Subscription[] = [];
  private expression: string = '';
  public readonly type = METRIC_EMBEDDABLE_TYPE;
  private services: DiscoverServices;
  private abortController?: AbortController;

  private domNode: any;

  constructor(
    { savedMetric, indexPatterns, editable, services }: MetricEmbeddableConfig,
    initialInput: MetricInput,
    private readonly executeTriggerActions: UiActionsStart['executeTriggerActions'],
    parent?: Container
  ) {
    super(
      initialInput,
      {
        defaultTitle: savedMetric.title,
        editApp: 'discover',
        editable,
      },
      parent
    );

    this.services = services;
    this.savedMetric = savedMetric;
    this.inspectorAdaptors = {
      requests: new RequestAdapter(),
    };
    this.initializeMetricProps();

    this.subscriptions.push(
      Rx.merge(this.getOutput$(), this.getInput$()).subscribe(() => {
        //this.handleChanges();
      })
    );
  }

  public getInspectorAdapters() {
    return this.inspectorAdaptors;
  }

  public getSavedMetric() {
    return this.savedMetric;
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

  /**
   *
   * @param {Element} domNode
   */
  public render(domNode: HTMLElement) {
    if (!this.metricProps) {
      throw new Error('Metric scope not defined');
    }
    const containerDiv = document.createElement('div');
    containerDiv.className = `metric panel-content panel-content--fullWidth`;
    containerDiv.setAttribute('style', 'width: 100%;');
    domNode.appendChild(containerDiv);

    this.domNode = containerDiv;

    ReactDOM.render(
      <MetricEmbeddableComponent metricProps={this.metricProps} services={this.services} />,
      this.domNode
    );
  }

  public destroy() {
    super.destroy();
    this.subscriptions.forEach((s) => s.unsubscribe());

    if (this.handler) {
      this.handler.destroy();
      this.handler.getElement().remove();
    }
  }

  public reload() {}

  private initializeMetricProps() {
    const metricProps: MetricProps = {
      title: this.savedMetric.title,
      services: this.services,
      expression: this.savedMetric.expression,
    };

    this.metricProps = metricProps;
  }
}
