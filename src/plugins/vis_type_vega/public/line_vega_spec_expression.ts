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

import { cloneDeep } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  OpenSearchDashboardsDatatable,
} from '../../expressions/public';
import { VegaVisualizationDependencies } from './plugin';

type Input = OpenSearchDashboardsDatatable;
type Output = Promise<string>;

interface Arguments {
  visLayers: string | null;
  visParams: string;
  dimensions: string;
}

export type VegaSpecExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'vega_spec',
  Input,
  Arguments,
  Output
>;

/*
TODO: Support legend orientation location, make the legend better to look the same
 */
const createSpecFromDatatable = (
  datatable: OpenSearchDashboardsDatatable,
  visParams: string,
  dimensionsString: string
): object => {
  // TODO: we can try to use VegaSpec type but it is currently very outdated, where many
  // of the fields and sub-fields don't have other optional params that we want for customizing.
  // For now, we make this more loosely-typed by just specifying it as a generic object.
  const spec = {} as any;

  // console.log(JSON.parse(visParams));

  const xAxis = datatable.columns[0];

  const parseParams = JSON.parse(visParams);
  const dimensions = JSON.parse(dimensionsString);

  // Get time range for the data in case there is only data for a small range so it will show the full time range
  const startTime = {};
  const xAxisId = xAxis.id.toString();
  // @ts-ignore
  startTime[xAxisId] = new Date(dimensions.x.params.bounds.min).valueOf();
  const endTime = {};
  // @ts-ignore
  endTime[xAxisId] = new Date(dimensions.x.params.bounds.max).valueOf();
  const updatedTable = datatable.rows.concat([startTime, endTime]);

  // const legendPosition = parseParams.legendPosition;

  // TODO: update this to v5 when available
  spec.$schema = 'https://vega.github.io/schema/vega-lite/v4.json';
  spec.data = {
    values: updatedTable,
  };
  spec.config = {
    view: {
      stroke: null,
    },
    concat: {
      spacing: 0,
    },
    // the circle timeline representing annotations
    circle: {
      color: 'blue',
    },
    // the vertical line when user hovers over an annotation circle
    rule: {
      color: 'red',
    },
  };

  // assuming the first column in the datatable represents the x-axis / the time-related field.
  // need to confirm if that's always the case or not
  spec.layer = [] as any[];

  let yTitle: string;
  // The value axes are the different axes added by the visBuilder
  if (parseParams.valueAxes != null && parseParams.valueAxes[0].title != null) {
    yTitle = parseParams.valueAxes[0].title.text;
  }

  datatable.columns.forEach((column, index) => {
    if (index !== 0) {
      spec.layer.push({
        mark: 'line',
        encoding: {
          x: {
            axis: {
              title: xAxis.name,
              grid: false,
            },
            field: xAxis.id,
            type: 'temporal',
          },
          y: {
            axis: {
              title: yTitle || column.name,
              grid: false,
            },
            field: column.id,
            type: 'quantitative',
          },
          color: {
            datum: column.name,
          },
        },
      });
    }
  });

  if (parseParams.thresholdLine.show as boolean) {
    spec.layer.push({
      mark: {
        type: 'rule',
        color: parseParams.thresholdLine.color,
      },
      encoding: {
        y: {
          datum: parseParams.thresholdLine.value,
        },
      },
    });
  }

  return spec;
};

export const createVegaSpecFn = (
  dependencies: VegaVisualizationDependencies
): VegaSpecExpressionFunctionDefinition => ({
  name: 'vega_spec',
  type: 'string',
  inputTypes: ['opensearch_dashboards_datatable'],
  help: i18n.translate('visTypeVega.function.help', {
    defaultMessage: 'Construct vega spec',
  }),
  args: {
    visLayers: {
      types: ['string', 'null'],
      default: '',
      help: '',
    },
    visParams: {
      types: ['string'],
      default: '""',
      help: '',
    },
    dimensions: {
      types: ['string'],
      default: '""',
      help: '',
    },
  },
  async fn(input, args, context) {
    const table = cloneDeep(input);

    // creating initial vega spec from table
    const spec = createSpecFromDatatable(table, args.visParams, args.dimensions);
    console.log("spec for vega")

    console.log(JSON.stringify(spec));

    return JSON.stringify(spec);
  },
});
