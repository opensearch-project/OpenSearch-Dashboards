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

const createSpecFromDatatable = (
  datatable: OpenSearchDashboardsDatatable,
  visParams: string,
  dimensionsString: string
): object => {
  // TODO: we can try to use VegaSpec type but it is currently very outdated, where many
  // of the fields and sub-fields don't have other optional params that we want for customizing.
  // For now, we make this more loosely-typed by just specifying it as a generic object.
  const spec = {} as any;
  const xAxis = datatable.columns[0];

  const parseParams = JSON.parse(visParams);
  const dimensions = JSON.parse(dimensionsString);
  const legendPosition = parseParams.legendPosition;

  // Get time range for the data in case there is only data for a small range so it will show the full time range
  const startTime = {};
  const xAxisId = xAxis.id.toString();
  // @ts-ignore
  startTime[xAxisId] = new Date(dimensions.x.params.bounds.min).valueOf();
  const endTime = {};
  // @ts-ignore
  endTime[xAxisId] = new Date(dimensions.x.params.bounds.max).valueOf();
  const updatedTable = datatable.rows.concat([startTime, endTime]);

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
    legend: {
      orient: legendPosition,
    },
  };

  // Get the valueAxes data and generate a map to easily fetch the different valueAxes data
  const valueAxis = {};
  parseParams.valueAxes.forEach((yAxis: { id: { toString: () => string | number } }) => {
    // @ts-ignore
    valueAxis[yAxis.id.toString()] = yAxis;
  });

  spec.layer = [] as any[];

  if (datatable.rows.length > 0) {
    let skip = 0;
    datatable.columns.forEach((column, index) => {
      const currentSeriesParams = parseParams.seriesParams[index - skip];
      // Check if its not xAxis column data
      if (column.meta?.aggConfigParams?.interval != null) {
        skip++;
      } else {
        const currentValueAxis =
          // @ts-ignore
          valueAxis[currentSeriesParams.valueAxis.toString()];
        let tooltip: Array<{ field: string; type: string; title: string }> = [];
        if (parseParams.addTooltip) {
          tooltip = [
            { field: xAxis.id, type: 'temporal', title: xAxis.name.replaceAll('"', '') },
            { field: column.id, type: 'quantitative', title: column.name.replaceAll('"', '') },
          ];
        }
        spec.layer.push({
          mark: {
            type: currentSeriesParams.type,
            interpolate: currentSeriesParams.interpolate,
            strokeWidth: currentSeriesParams.lineWidth,
            point: currentSeriesParams.showCircles,
          },
          encoding: {
            x: {
              axis: {
                title: xAxis.name.replaceAll('"', ''),
                grid: parseParams.grid.categoryLines,
              },
              field: xAxis.id,
              type: 'temporal',
            },
            y: {
              axis: {
                title:
                  currentValueAxis.title.text.replaceAll('"', '') ||
                  column.name.replaceAll('"', ''),
                grid: parseParams.grid.valueAxis !== '',
                orient: currentValueAxis.position,
                labels: currentValueAxis.labels.show,
                labelAngle: currentValueAxis.labels.rotate,
              },
              field: column.id,
              type: 'quantitative',
            },
            tooltip,
            color: {
              datum: column.name.replaceAll('"', ''),
            },
          },
        });
      }
    });
  }

  if (parseParams.addTimeMarker) {
    spec.transform = [
      {
        calculate: 'now()',
        as: 'now_field',
      },
    ];

    spec.layer.push({
      mark: 'rule',
      encoding: {
        x: {
          type: 'temporal',
          field: 'now_field',
        },
        color: {
          value: 'red',
        },
        size: {
          value: 1,
        },
      },
    });
  }

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
    return JSON.stringify(spec);
  },
});
