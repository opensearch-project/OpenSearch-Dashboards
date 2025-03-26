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

import { IndexPattern } from '../opensearch_dashboards_services';
import { METRIC_EMBEDDABLE_TYPE } from './constants';

import { DiscoverServices } from '../build_services';

import { SavedMetric } from '../saved_metric_viz';
import { MetricEmbeddableComponent } from './metric_embeddable_component';

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

export class MetricEmbeddable
  extends Embeddable<MetricInput, MetricOutput>
  implements IMetricEmbeddable {
  private readonly savedMetric: SavedMetric;
  private inspectorAdaptors: Adapters;
  private metricProps?: MetricProps;
  private panelTitle: string = '';
  private autoRefreshFetchSubscription?: Subscription;
  private subscription?: Subscription;
  public readonly type = METRIC_EMBEDDABLE_TYPE;
  private services: DiscoverServices;
  private abortController?: AbortController;

  private node?: HTMLElement;

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

    this.subscription = Rx.merge(this.getOutput$(), this.getInput$()).subscribe(() => {
      this.panelTitle = this.output.title || '';
    });
  }

  public getInspectorAdapters() {
    return this.inspectorAdaptors;
  }

  public getSavedMetric() {
    return this.savedMetric;
  }

  /**
   *
   * @param {Element} domNode
   */
  public render(node: HTMLElement) {
    if (!this.metricProps) {
      throw new Error('Metric scope not defined');
    }
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    this.node = node;
  }

  public destroy() {
    super.destroy();
    if (this.metricProps) {
      delete this.metricProps;
    }
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
    if (this.node) {
      ReactDOM.unmountComponentAtNode(this.node);
    }
    if (this.autoRefreshFetchSubscription) {
      this.autoRefreshFetchSubscription.unsubscribe();
    }
    if (this.abortController) this.abortController.abort();
  }

  public reload() {
    if (this.node && this.metricProps) {
      this.renderComponent(this.node, this.metricProps);
    }
  }

  private initializeMetricProps() {
    const metricProps: MetricProps = {
      title: this.savedMetric.title,
      services: this.services,
      expression: this.savedMetric.expression,
    };

    this.metricProps = metricProps;
  }

  private renderComponent(node: HTMLElement, metricProps: MetricProps) {
    if (!this.metricProps) {
      return;
    }
    const props = {
      metricProps,
    };

    const MemorizedMetricEmbeddableComponent = React.memo(MetricEmbeddableComponent);
    ReactDOM.render(<MemorizedMetricEmbeddableComponent {...props} />, node);
  }
}
