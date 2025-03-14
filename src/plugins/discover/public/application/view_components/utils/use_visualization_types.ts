/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { IconType } from '@elastic/eui';
import { IExpressionLoaderParams } from '../../../../../expressions/public';
import { createLineConfig } from '../../components/visualizations/vislib/line/line_vis_type';
import { DiscoverViewServices } from '../../../build_services';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { OpenSearchSearchHit } from '../../../application/doc_views/doc_views_types';

export interface VisualizationType<T = any> {
  readonly name: string;
  readonly title: string;
  readonly description?: string;
  readonly icon: IconType;
  readonly stage?: 'production';
  readonly ui: {};
  readonly toExpression: (
    services: DiscoverViewServices,
    searchContext: IExpressionLoaderParams['searchContext'],
    rows: OpenSearchSearchHit[],
    indexPattern: IndexPattern
  ) => Promise<string | undefined>;
  readonly hierarchicalData?: boolean | ((vis: { params: T }) => boolean);
}

// TODO: Implement this function to return the visualization type based on the query
export const useVisualizationType = (): VisualizationType => {
  return createLineConfig();
};
