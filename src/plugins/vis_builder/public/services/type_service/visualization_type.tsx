/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { IconType } from '@elastic/eui';
import { IExpressionLoaderParams } from '../../../../expressions/public';
import { RenderState } from '../../application/utils/state_management';
import { VisualizationTypeOptions } from './types';

type IVisualizationType = VisualizationTypeOptions;

export class VisualizationType implements IVisualizationType {
  public readonly name: string;
  public readonly title: string;
  public readonly description: string;
  public readonly icon: IconType;
  public readonly stage: 'experimental' | 'production';
  public readonly ui: IVisualizationType['ui'];
  public readonly toExpression: (
    state: RenderState,
    searchContext: IExpressionLoaderParams['searchContext']
  ) => Promise<string | undefined>;

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
