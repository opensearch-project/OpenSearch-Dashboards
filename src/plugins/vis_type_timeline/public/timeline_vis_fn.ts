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
  ExpressionFunctionDefinition,
  OpenSearchDashboardsContext,
  Render,
} from 'src/plugins/expressions/public';
import {
  getTimelineRequestHandler,
  TimelineSuccessResponse,
} from './helpers/timeline_request_handler';
import { TIMELINE_VIS_NAME } from './timeline_vis_type';
import { TimelineVisDependencies } from './plugin';
import { Filter, Query, TimeRange } from '../../data/common';

type Input = OpenSearchDashboardsContext | null;
type Output = Promise<Render<TimelineRenderValue>>;
interface Arguments {
  expression: string;
  interval: string;
}

export interface TimelineRenderValue {
  visData: TimelineSuccessResponse;
  visType: 'timelion';
  visParams: TimelineVisParams;
}

export type TimelineVisParams = Arguments;

export type TimelineExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'timeline_vis',
  Input,
  Arguments,
  Output
>;

export const getTimelineVisualizationConfig = (
  dependencies: TimelineVisDependencies
): TimelineExpressionFunctionDefinition => ({
  name: 'timeline_vis',
  type: 'render',
  inputTypes: ['opensearch_dashboards_context', 'null'],
  help: i18n.translate('timeline.function.help', {
    defaultMessage: 'Timeline visualization',
  }),
  args: {
    expression: {
      types: ['string'],
      aliases: ['_'],
      default: '".opensearch(*)"',
      help: '',
    },
    interval: {
      types: ['string'],
      default: 'auto',
      help: '',
    },
  },
  async fn(input, args) {
    const timelineRequestHandler = getTimelineRequestHandler(dependencies);

    const visParams = { expression: args.expression, interval: args.interval };

    const response = await timelineRequestHandler({
      timeRange: get(input, 'timeRange') as TimeRange,
      query: get(input, 'query') as Query,
      filters: get(input, 'filters') as Filter[],
      visParams,
    });

    response.visType = TIMELINE_VIS_NAME;

    return {
      type: 'render',
      as: 'timeline_vis',
      value: {
        visParams,
        visType: TIMELINE_VIS_NAME,
        visData: response,
      },
    };
  },
});
