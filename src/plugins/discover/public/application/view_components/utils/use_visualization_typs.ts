/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IconType } from '@elastic/eui';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { createLineConfig } from '../../components/visualizations/vislib/line/line_vis_type';

export interface VisualizationType<T = any> {
  readonly name: string;
  readonly title: string;
  readonly description?: string;
  readonly icon: IconType;
  readonly stage?: 'production';
  readonly ui: {};
  readonly toExpression: (
    searchContext: IExpressionLoaderParams['searchContext']
  ) => Promise<string | undefined>;
  readonly hierarchicalData?: boolean | ((vis: { params: T }) => boolean);
}

// TODO: Implement this function to return the visualization type based on the query
export const useVisualizationType = (): VisualizationType => {
  return createLineConfig();
};
