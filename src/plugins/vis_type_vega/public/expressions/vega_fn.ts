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

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { get } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  ExecutionContext,
  ExpressionFunctionDefinition,
  OpenSearchDashboardsContext,
  Render,
} from '../../../expressions/public';
import { VegaVisualizationDependencies } from '../plugin';
import { createVegaRequestHandler } from '../vega_request_handler';
import { VegaInspectorAdapters } from '../vega_inspector';
import { TimeRange, Query } from '../../../data/public';
import { VisRenderValue } from '../../../visualizations/public';
import { VegaParser } from '../data_model/vega_parser';

type Input = OpenSearchDashboardsContext | null;
type Output = Promise<Render<RenderValue>>;

interface Arguments {
  spec: string;
}

export interface VisParams {
  spec: string;
}

export type VegaExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'vega',
  Input,
  Arguments,
  Output,
  ExecutionContext<unknown, VegaInspectorAdapters>
>;

interface RenderValue extends VisRenderValue {
  visData: VegaParser;
  visType: 'vega';
  visConfig: VisParams;
}

export const createVegaFn = (
  dependencies: VegaVisualizationDependencies
): VegaExpressionFunctionDefinition => ({
  name: 'vega',
  type: 'render',
  inputTypes: ['opensearch_dashboards_context', 'null'],
  help: i18n.translate('visTypeVega.function.help', {
    defaultMessage: 'Vega visualization',
  }),
  args: {
    spec: {
      types: ['string'],
      default: '',
      help: '',
    },
  },
  async fn(input, args, context) {
    const vegaRequestHandler = createVegaRequestHandler(dependencies, context);

    const response = await vegaRequestHandler({
      timeRange: get(input, 'timeRange') as TimeRange,
      query: get(input, 'query') as Query,
      filters: get(input, 'filters') as any,
      visParams: { spec: args.spec },
    });

    return {
      type: 'render',
      as: 'visualization',
      value: {
        visData: response,
        visType: 'vega',
        visConfig: {
          spec: args.spec,
        },
      },
    };
  },
});
