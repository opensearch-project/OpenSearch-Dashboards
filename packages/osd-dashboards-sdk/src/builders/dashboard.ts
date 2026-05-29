/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DashboardDefinition } from '../types';
import { Panel } from './panel';
import { DataSource } from './data_source';
import { Variable } from './variable';
import { Serializer } from '../output/serializer';

/**
 * Fluent builder for dashboard definitions.
 */
export class Dashboard {
  private readonly _name: string;
  private _title: string = '';
  private _description: string = '';
  private _labels: Record<string, string> = {};
  private _annotations: Record<string, string> = {};
  private _timeRange?: { from: string; to: string };
  private _refreshInterval?: string;
  private _panels: Panel[] = [];
  private _dataSources: DataSource[] = [];
  private _variables: Variable[] = [];

  private constructor(name: string) {
    this._name = name;
  }

  /**
   * Create a new dashboard builder with the given resource name.
   */
  static create(name: string): Dashboard {
    return new Dashboard(name);
  }

  /**
   * Set the dashboard title.
   */
  title(title: string): Dashboard {
    this._title = title;
    return this;
  }

  /**
   * Set the dashboard description.
   */
  description(description: string): Dashboard {
    this._description = description;
    return this;
  }

  /**
   * Set metadata labels.
   */
  labels(labels: Record<string, string>): Dashboard {
    this._labels = { ...this._labels, ...labels };
    return this;
  }

  /**
   * Add a single annotation.
   */
  annotation(key: string, value: string): Dashboard {
    this._annotations[key] = value;
    return this;
  }

  /**
   * Set the time range.
   */
  timeRange(from: string, to: string): Dashboard {
    this._timeRange = { from, to };
    return this;
  }

  /**
   * Set the refresh interval.
   */
  refreshInterval(interval: string): Dashboard {
    this._refreshInterval = interval;
    return this;
  }

  /**
   * Add a panel to the dashboard.
   */
  addPanel(panel: Panel): Dashboard {
    this._panels.push(panel);
    return this;
  }

  /**
   * Add a data source to the dashboard.
   */
  addDataSource(dataSource: DataSource): Dashboard {
    this._dataSources.push(dataSource);
    return this;
  }

  /**
   * Add a template variable to the dashboard.
   */
  addVariable(variable: Variable): Dashboard {
    this._variables.push(variable);
    return this;
  }

  /**
   * Build and return the DashboardDefinition.
   */
  build(): DashboardDefinition {
    const definition: DashboardDefinition = {
      apiVersion: 'dashboards.opensearch.org/v1alpha1',
      kind: 'Dashboard',
      metadata: {
        name: this._name,
        labels: { ...this._labels },
        annotations: { ...this._annotations },
      },
      spec: {
        title: this._title,
        description: this._description,
        panels: this._panels.map((p) => p.build()),
        dataSources: this._dataSources.map((ds) => ds.build()),
        variables: this._variables.map((v) => v.build()),
      },
    };

    if (this._timeRange) {
      definition.spec.timeRange = { ...this._timeRange };
    }

    if (this._refreshInterval) {
      definition.spec.refreshInterval = this._refreshInterval;
    }

    return definition;
  }

  /**
   * Build and serialize to JSON.
   * If filepath is provided, writes to file and returns the JSON string.
   * Otherwise, returns the JSON string.
   */
  toJSON(filepath?: string): string {
    const definition = this.build();
    return Serializer.toJSON(definition, filepath);
  }

  /**
   * Build and serialize to YAML.
   * If filepath is provided, writes to file and returns the YAML string.
   * Otherwise, returns the YAML string.
   */
  toYAML(filepath?: string): string {
    const definition = this.build();
    return Serializer.toYAML(definition, filepath);
  }
}
