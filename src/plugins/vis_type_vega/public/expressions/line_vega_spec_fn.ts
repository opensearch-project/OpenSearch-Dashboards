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
  OpenSearchDashboardsDatatableColumn,
} from '../../../expressions/public';
import { VegaVisualizationDependencies } from '../plugin';

type Input = OpenSearchDashboardsDatatable;
type Output = Promise<string>;

interface Arguments {
  visLayers: string | null;
  visParams: string;
  dimensions: string;
}

export type VegaSpecExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'line_vega_spec',
  Input,
  Arguments,
  Output
>;

// Get the first xaxis field as only 1 setup of X Axis will be supported and
// there won't be support for split series and split chart
const getXAxisId = (dimensions: any, columns: OpenSearchDashboardsDatatableColumn[]): string => {
  return columns.filter((column) => column.name === dimensions.x.label)[0].id;
};

const cleanString = (rawString: string): string => {
  return rawString.replaceAll('"', '');
};

const formatDataTable = (
  datatable: OpenSearchDashboardsDatatable
): OpenSearchDashboardsDatatable => {
  datatable.columns.forEach((column) => {
    // clean quotation marks from names in columns
    column.name = cleanString(column.name);
  });
  return datatable;
};

const createSpecFromDatatable = (
  datatable: OpenSearchDashboardsDatatable,
  visParams: string,
  dimensionsString: string
): object => {
  // TODO: we can try to use VegaSpec type but it is currently very outdated, where many
  // of the fields and sub-fields don't have other optional params that we want for customizing.
  // For now, we make this more loosely-typed by just specifying it as a generic object.
  const spec = {} as any;

  const parseParams = JSON.parse(visParams);
  const dimensions = JSON.parse(dimensionsString);
  const legendPosition = parseParams.legendPosition;

  // TODO: update this to v5 when available
  spec.$schema = 'https://vega.github.io/schema/vega-lite/v4.json';
  spec.data = {
    values: datatable.rows,
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
  parseParams?.valueAxes.forEach((yAxis: { id: { toString: () => string | number } }) => {
    // @ts-ignore
    valueAxis[yAxis.id.toString()] = yAxis;
  });

  spec.layer = [] as any[];

  if (datatable.rows.length > 0 && dimensions != null) {
    const xAxisId = getXAxisId(dimensions, datatable.columns);
    const xAxisTitle = cleanString(dimensions.x.label);
    const startTime = new Date(dimensions.x.params.bounds.min).valueOf();
    const endTime = new Date(dimensions.x.params.bounds.max).valueOf();
    let skip = 0;
    datatable.columns.forEach((column, index) => {
      // Check if its not xAxis column data
      if (column.meta?.aggConfigParams?.interval != null) {
        skip++;
      } else {
        const currentSeriesParams = parseParams.seriesParams[index - skip];
        const currentValueAxis =
          // @ts-ignore
          valueAxis[currentSeriesParams.valueAxis.toString()];
        let tooltip: Array<{ field: string; type: string; title: string }> = [];
        if (parseParams.addTooltip) {
          tooltip = [
            { field: xAxisId, type: 'temporal', title: xAxisTitle },
            { field: column.id, type: 'quantitative', title: column.name },
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
                title: xAxisTitle,
                grid: parseParams.grid.categoryLines,
              },
              field: xAxisId,
              type: 'temporal',
              scale: {
                domain: [startTime, endTime],
              },
            },
            y: {
              axis: {
                title: cleanString(currentValueAxis.title.text) || column.name,
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
              datum: column.name,
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
  name: 'line_vega_spec',
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
    const spec = createSpecFromDatatable(formatDataTable(table), args.visParams, args.dimensions);
    return JSON.stringify(spec);
  },
});
