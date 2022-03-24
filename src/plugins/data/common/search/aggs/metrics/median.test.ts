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

import { AggConfigs, IAggConfigs } from '../agg_configs';
import { mockAggTypesRegistry } from '../test_helpers';
import { METRIC_TYPES } from './metric_agg_types';

describe('AggTypeMetricMedianProvider class', () => {
  let aggConfigs: IAggConfigs;

  beforeEach(() => {
    const typesRegistry = mockAggTypesRegistry();
    const field = {
      name: 'bytes',
    };
    const indexPattern = {
      id: '1234',
      title: 'logstash-*',
      fields: {
        getByName: () => field,
        filter: () => [field],
      },
    } as any;

    aggConfigs = new AggConfigs(
      indexPattern,
      [
        {
          id: METRIC_TYPES.MEDIAN,
          type: METRIC_TYPES.MEDIAN,
          schema: 'metric',
          params: {
            field: 'bytes',
          },
        },
      ],
      {
        typesRegistry,
      }
    );
  });

  it('requests the percentiles aggregation in the OpenSearch query DSL', () => {
    const dsl: Record<string, any> = aggConfigs.toDsl();

    expect(dsl.median.percentiles.field).toEqual('bytes');
    expect(dsl.median.percentiles.percents).toEqual([50]);
  });

  it('converts the response', () => {
    const agg = aggConfigs.getResponseAggs()[0];

    expect(
      agg.getValue({
        [agg.id]: {
          values: {
            '50.0': 10,
          },
        },
      })
    ).toEqual(10);
  });

  it('supports scripted fields', () => {
    const typesRegistry = mockAggTypesRegistry();
    const field = {
      name: 'bytes',
      scripted: true,
      language: 'painless',
      script: 'return 456',
    };
    const indexPattern = {
      id: '1234',
      title: 'logstash-*',
      fields: {
        getByName: () => field,
        filter: () => [field],
      },
    } as any;

    aggConfigs = new AggConfigs(
      indexPattern,
      [
        {
          id: METRIC_TYPES.MEDIAN,
          type: METRIC_TYPES.MEDIAN,
          schema: 'metric',
          params: {
            field: 'bytes',
          },
        },
      ],
      {
        typesRegistry,
      }
    );

    expect(aggConfigs.toDsl()).toMatchSnapshot();
  });
});
