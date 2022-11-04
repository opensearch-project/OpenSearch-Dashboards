/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { ReactElement } from 'react';
import { IconType } from '@elastic/eui';
import { RenderState } from '../../application/utils/state_management';
import { Schemas } from '../../../../vis_default_editor/public';
import { IExpressionLoaderParams } from '../../../../expressions/public';

export interface DataTabConfig {
  schemas: Schemas;
}

export interface StyleTabConfig<T = any> {
  defaults: T;
  render: () => ReactElement;
}

export interface VisualizationTypeOptions<T = any> {
  readonly name: string;
  readonly title: string;
  readonly description?: string;
  readonly icon: IconType;
  readonly stage?: 'experimental' | 'production';
  readonly ui: {
    containerConfig: {
      data: DataTabConfig;
      style: StyleTabConfig<T>;
    };
  };
  readonly toExpression: (
    state: RenderState,
    searchContext: IExpressionLoaderParams['searchContext']
  ) => Promise<string | undefined>;
}
