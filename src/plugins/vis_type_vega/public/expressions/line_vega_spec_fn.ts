/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  OpenSearchDashboardsDatatable,
  OpenSearchDashboardsDatatableColumn,
} from '../../../expressions/public';
import { VegaVisualizationDependencies } from '../plugin';
import { VislibDimensions, VisParams } from '../../../visualizations/public';

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

export const cleanString = (rawString: string): string => {
  return rawString.replaceAll('"', '');
};

export const formatDataTable = (
  datatable: OpenSearchDashboardsDatatable
): OpenSearchDashboardsDatatable => {
  datatable.columns.forEach((column) => {
    // clean quotation marks from names in columns
    column.name = cleanString(column.name);
  });
  return datatable;
};

export const createSpecFromDatatable = (
  datatable: OpenSearchDashboardsDatatable,
  visParams: VisParams,
  dimensions: VislibDimensions
): object => {
  // TODO: we can try to use VegaSpec type but it is currently very outdated, where many
  // of the fields and sub-fields don't have other optional params that we want for customizing.
  // For now, we make this more loosely-typed by just specifying it as a generic object.
  const spec = {} as any;

  const legendPosition = visParams.legendPosition;

  spec.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
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
  visParams?.valueAxes.forEach((yAxis: { id: { toString: () => string | number } }) => {
    // @ts-ignore
    valueAxis[yAxis.id.toString()] = yAxis;
  });

  spec.layer = [] as any[];

  if (datatable.rows.length > 0 && dimensions.x != null) {
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
        const currentSeriesParams = visParams.seriesParams[index - skip];
        const currentValueAxis =
          // @ts-ignore
          valueAxis[currentSeriesParams.valueAxis.toString()];
        let tooltip: Array<{ field: string; type: string; title: string }> = [];
        if (visParams.addTooltip) {
          tooltip = [
            { field: xAxisId, type: 'temporal', title: xAxisTitle },
            { field: column.id, type: 'quantitative', title: column.name },
          ];
        }
        spec.layer.push({
          mark: {
            // Possible types are: line, area, histogram. The eligibility checker will
            // prevent area and histogram (though area works in vega-lite)
            type: currentSeriesParams.type,
            // Possible types: linear, cardinal, step-after. All of these types work in vega-lite
            interpolate: currentSeriesParams.interpolate,
            // The possible values is any number, which matches what vega-lite supports
            strokeWidth: currentSeriesParams.lineWidth,
            // this corresponds to showing the dots in the visbuilder for each data point
            point: currentSeriesParams.showCircles,
          },
          encoding: {
            x: {
              axis: {
                title: xAxisTitle,
                grid: visParams.grid.categoryLines,
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
                grid: visParams.grid.valueAxis !== '',
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

  if (visParams.addTimeMarker) {
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

  if (visParams.thresholdLine.show as boolean) {
    spec.layer.push({
      mark: {
        type: 'rule',
        color: visParams.thresholdLine.color,
      },
      encoding: {
        y: {
          datum: visParams.thresholdLine.value,
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
    const spec = createSpecFromDatatable(
      formatDataTable(table),
      JSON.parse(args.visParams),
      JSON.parse(args.dimensions)
    );
    return JSON.stringify(spec);
  },
});
