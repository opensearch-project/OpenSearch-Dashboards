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

import { i18n } from '@osd/i18n';
import { flatten, uniqBy } from 'lodash';
import { OPENSEARCH_DASHBOARDS_CONTEXT_NAME } from 'src/plugins/expressions/public';
import { TimeRange, Filter, opensearchQuery, Query } from '../../../data/public';
import { TimelineVisDependencies } from '../plugin';
import { getTimezone } from './get_timezone';
import { TimelineVisParams } from '../timeline_vis_fn';
import { getIndexPatterns } from './plugin_services';

interface Stats {
  cacheCount: number;
  invokeTime: number;
  queryCount: number;
  queryTime: number;
  sheetTime: number;
}

export interface Series {
  _global?: boolean;
  _hide?: boolean;
  _id?: number;
  _title?: string;
  color?: string;
  data: Array<Record<number, number>>;
  fit: string;
  label: string;
  split: string;
  stack?: boolean;
  type: string;
}

export interface Sheet {
  list: Series[];
  render?: {
    grid?: boolean;
  };
  type: string;
}

export interface TimelineSuccessResponse {
  sheet: Sheet[];
  stats: Stats;
  visType: string;
  type: OPENSEARCH_DASHBOARDS_CONTEXT_NAME;
}

const indexRegEx = /index=['"]?([\sA-z0-9_\-\*]*?)[^\sA-z0-9_\-\*]/g;

export function getTimelineRequestHandler({
  uiSettings,
  http,
  timefilter,
}: TimelineVisDependencies) {
  const timezone = getTimezone(uiSettings);

  return async function ({
    timeRange,
    filters,
    query,
    visParams,
  }: {
    timeRange: TimeRange;
    filters: Filter[];
    query: Query;
    visParams: TimelineVisParams;
  }): Promise<TimelineSuccessResponse> {
    const expression = visParams.expression;

    if (!expression) {
      throw new Error(
        i18n.translate('timeline.emptyExpressionErrorMessage', {
          defaultMessage: 'Timeline error: No expression provided',
        })
      );
    }

    const opensearchQueryConfigs = opensearchQuery.getOpenSearchQueryConfig(uiSettings);
    const { ignoreFilterIfFieldNotInIndex } = opensearchQueryConfigs;
    let filterByIndex: { [indexTitle: string]: unknown } = {};

    // If filters should be ignored for inapplicable indexes,
    // they must be built for each index in the expression
    if (ignoreFilterIfFieldNotInIndex) {
      // Get a unique list of index titles used in the expression
      const parsedIndexTitles: string[] = [];
      let match = indexRegEx.exec(expression);
      while (match) {
        const index = match[1].replace(/['"]/g, '').trim();
        if (index && parsedIndexTitles.indexOf(index) < 0) {
          parsedIndexTitles.push(index);
        }
        match = indexRegEx.exec(expression);
      }

      // Find index objects based on parsed titles
      const indexPatterns = getIndexPatterns();
      const parsedIndexPatterns = uniqBy(
        flatten(await Promise.all(parsedIndexTitles.map((title) => indexPatterns.find(title)))),
        'title'
      );

      // Determine which filters apply to which indexes
      filterByIndex = parsedIndexPatterns.reduce((acc, index) => {
        if (index.title) {
          return {
            [index.title]: opensearchQuery.buildOpenSearchQuery(
              index,
              query,
              filters,
              opensearchQueryConfigs
            ),
            ...acc,
          };
        }
        return acc;
      }, {} as typeof filterByIndex);
    }

    // Parse the time range client side to make sure it behaves like other charts
    const timeRangeBounds = timefilter.calculateBounds(timeRange);

    try {
      return await http.post('/api/timeline/run', {
        body: JSON.stringify({
          sheet: [expression],
          extended: {
            es: {
              filter: opensearchQuery.buildOpenSearchQuery(
                undefined,
                query,
                filters,
                opensearchQueryConfigs
              ),
              ignoreFilterIfFieldNotInIndex,
              filterByIndex,
            },
          },
          time: {
            from: timeRangeBounds.min,
            to: timeRangeBounds.max,
            interval: visParams.interval,
            timezone,
          },
        }),
      });
    } catch (e) {
      if (e && e.body) {
        const err = new Error(
          `${i18n.translate('timeline.requestHandlerErrorTitle', {
            defaultMessage: 'Timeline request error',
          })}: ${e.body.title} ${e.body.message}`
        );
        err.stack = e.stack;
        throw err;
      } else {
        throw e;
      }
    }
  };
}
