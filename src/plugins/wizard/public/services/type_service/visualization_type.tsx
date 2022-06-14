/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { VisualizationTypeOptions } from './types';

type IVisualizationType = VisualizationTypeOptions;

export class VisualizationType implements IVisualizationType {
  public readonly name;
  public readonly title;
  public readonly description;
  public readonly icon;
  public readonly stage;
  public readonly ui;
  public readonly toExpression;

  constructor(options: VisualizationTypeOptions) {
    this.name = options.name;
    this.title = options.title;
    this.description = options.description ?? '';
    this.icon = options.icon;
    this.stage = options.stage ?? 'production';
    this.ui = options.ui;
    this.toExpression = options.toExpression;
  }
}
