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

export type LineVegaSpecExpressionFunctionDefinition = ExpressionFunctionDefinition<
  'line_vega_spec',
  Input,
  Arguments,
  Output
>;

// TODO: move this to the visualization plugin that has VisParams once all of these parameters have been better defined
interface ValueAxis {
  id: string;
  labels: {
    filter: boolean;
    rotate: number;
    show: boolean;
    truncate: number;
  };
  name: string;
  position: string;
  scale: {
    mode: string;
    type: string;
  };
  show: true;
  style: any;
  title: {
    text: string;
  };
  type: string;
}

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

export const setupConfig = (visParams: VisParams) => {
  const legendPosition = visParams.legendPosition;
  return {
    view: {
      stroke: null,
    },
    concat: {
      spacing: 0,
    },
    legend: {
      orient: legendPosition,
    },
  };
};

export const buildLayerMark = (seriesParams: {
  type: string;
  interpolate: string;
  lineWidth: number;
  showCircles: boolean;
}) => {
  return {
    // Possible types are: line, area, histogram. The eligibility checker will
    // prevent area and histogram (though area works in vega-lite)
    type: seriesParams.type,
    // Possible types: linear, cardinal, step-after. All of these types work in vega-lite
    interpolate: seriesParams.interpolate,
    // The possible values is any number, which matches what vega-lite supports
    strokeWidth: seriesParams.lineWidth,
    // this corresponds to showing the dots in the visbuilder for each data point
    point: seriesParams.showCircles,
  };
};

export const buildXAxis = (
  xAxisTitle: string,
  xAxisId: string,
  startTime: number,
  endTime: number,
  visParams: VisParams
) => {
  return {
    axis: {
      title: xAxisTitle,
      grid: visParams.grid.categoryLines,
    },
    field: xAxisId,
    // Right now, the line charts can only set the x-axis value to be a date attribute, so
    // this should always be of type temporal
    type: 'temporal',
    scale: {
      domain: [startTime, endTime],
    },
  };
};

export const buildYAxis = (
  column: OpenSearchDashboardsDatatableColumn,
  valueAxis: ValueAxis,
  visParams: VisParams
) => {
  return {
    axis: {
      title: cleanString(valueAxis.title.text) || column.name,
      grid: visParams.grid.valueAxis,
      orient: valueAxis.position,
      labels: valueAxis.labels.show,
      labelAngle: valueAxis.labels.rotate,
    },
    field: column.id,
    type: 'quantitative',
  };
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

  spec.$schema = 'https://vega.github.io/schema/vega-lite/v5.json';
  spec.data = {
    values: datatable.rows,
  };
  spec.config = setupConfig(visParams);

  // Get the valueAxes data and generate a map to easily fetch the different valueAxes data
  const valueAxis = new Map();
  visParams?.valueAxes?.forEach((yAxis: ValueAxis) => {
    valueAxis.set(yAxis.id, yAxis);
  });

  spec.layer = [] as any[];

  if (datatable.rows.length > 0 && dimensions.x !== null) {
    const xAxisId = getXAxisId(dimensions, datatable.columns);
    const xAxisTitle = cleanString(dimensions.x.label);
    // get x-axis bounds for the chart
    const startTime = new Date(dimensions.x.params.bounds.min).valueOf();
    const endTime = new Date(dimensions.x.params.bounds.max).valueOf();
    let skip = 0;
    datatable.columns.forEach((column, index) => {
      // Check if it's not xAxis column data
      if (column.meta?.aggConfigParams?.interval !== undefined) {
        skip++;
      } else {
        const currentSeriesParams = visParams.seriesParams[index - skip];
        const currentValueAxis = valueAxis.get(currentSeriesParams.valueAxis.toString());
        let tooltip: Array<{ field: string; type: string; title: string }> = [];
        if (visParams.addTooltip) {
          tooltip = [
            { field: xAxisId, type: 'temporal', title: xAxisTitle },
            { field: column.id, type: 'quantitative', title: column.name },
          ];
        }
        spec.layer.push({
          mark: buildLayerMark(currentSeriesParams),
          encoding: {
            x: buildXAxis(xAxisTitle, xAxisId, startTime, endTime, visParams),
            y: buildYAxis(column, currentValueAxis, visParams),
            tooltip,
            color: {
              // This ensures all the different metrics have their own distinct and unique color
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
        // The time marker on vislib is red, so keeping this consistent
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
    const layer = {
      mark: {
        type: 'rule',
        color: visParams.thresholdLine.color,
        strokeDash: [1, 0],
      },
      encoding: {
        y: {
          datum: visParams.thresholdLine.value,
        },
      },
    };

    // Can only support making a threshold line with full or dashed style, but not dot-dashed
    // due to vega-lite limitations
    if (visParams.thresholdLine.style !== 'full') {
      layer.mark.strokeDash = [8, 8];
    }

    spec.layer.push(layer);
  }

  return spec;
};

export const createLineVegaSpecFn = (
  dependencies: VegaVisualizationDependencies
): LineVegaSpecExpressionFunctionDefinition => ({
  name: 'line_vega_spec',
  type: 'string',
  inputTypes: ['opensearch_dashboards_datatable'],
  help: i18n.translate('visTypeVega.function.help', {
    defaultMessage: 'Construct line vega spec',
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
