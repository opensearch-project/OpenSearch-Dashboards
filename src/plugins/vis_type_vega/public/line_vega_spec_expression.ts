/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { cloneDeep, get, isEmpty } from 'lodash';
import { i18n } from '@osd/i18n';
import {
  ExpressionFunctionDefinition,
  OpenSearchDashboardsDatatable,
  OpenSearchDashboardsDatatableColumn,
} from '../../expressions/public';
import { VegaVisualizationDependencies } from './plugin';
import { VisParams } from '../../visualizations/public';
// TODO: these should resolve after rebasing
import {
  VisLayer,
  VisLayers,
  PointInTimeEvent,
  PointInTimeEventsVisLayer,
  isPointInTimeEventsVisLayer,
} from '../../vis_augmenter/public';

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

const getXAxisColumn = (
  dimensions: any,
  columns: OpenSearchDashboardsDatatableColumn[]
): OpenSearchDashboardsDatatableColumn => {
  return columns.filter((column) => column.name === dimensions.x.label)[0];
};

const getYAxisColumns = (
  dimensions: any,
  columns: OpenSearchDashboardsDatatableColumn[]
): OpenSearchDashboardsDatatableColumn[] => {
  const yAxisNames = dimensions.y.map((y: any) => y.label);
  return columns.filter((column) => column.name in yAxisNames);
};

const getVisLayerColumns = (
  dimensions: any,
  columns: OpenSearchDashboardsDatatableColumn[],
  visLayers: VisLayer[]
): OpenSearchDashboardsDatatableColumn[] => {
  const visLayerNames = visLayers.map((visLayer) => visLayer.name);
  return columns.filter((column) => column.name in visLayerNames);
};

const generateFilterString = (visLayerNames: string[]): string => {
  const filterString = visLayerNames.map((visLayerName) => `datum['${visLayerName}'] > 0`);
  return filterString.join(' || ');
};

const generateVisLayerTooltipSpec = (
  visLayerColumns: OpenSearchDashboardsDatatableColumn[]
): Array<{ field: string; type: string; title: string }> => {
  return visLayerColumns.map((visLayerColumn) => {
    return {
      field: visLayerColumn.id,
      type: 'quantitative',
      title: visLayerColumn.name,
    };
  });
};

const createSpecFromDatatable = (
  datatable: OpenSearchDashboardsDatatable,
  visParams: VisParams,
  dimensions: any
): object => {
  // TODO: we can try to use VegaSpec type but it is currently very outdated, where many
  // of the fields and sub-fields don't have other optional params that we want for customizing.
  // For now, we make this more loosely-typed by just specifying it as a generic object.
  const spec = {} as any;
  const xAxis = datatable.columns[0];

  const legendPosition = visParams.legendPosition;

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
  visParams.valueAxes.forEach((yAxis: { id: { toString: () => string | number } }) => {
    // @ts-ignore
    valueAxis[yAxis.id.toString()] = yAxis;
  });

  spec.layer = [] as any[];

  if (datatable.rows.length > 0) {
    let skip = 0;
    datatable.columns.forEach((column, index) => {
      const currentSeriesParams = visParams.seriesParams[index - skip];
      // Check if its not xAxis column data
      if (column.meta?.aggConfigParams?.interval != null) {
        skip++;
      } else {
        const currentValueAxis =
          // @ts-ignore
          valueAxis[currentSeriesParams.valueAxis.toString()];
        let tooltip: Array<{ field: string; type: string; title: string }> = [];
        if (visParams.addTooltip) {
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
                grid: visParams.grid.categoryLines,
              },
              field: xAxis.id,
              type: 'temporal',
            },
            y: {
              axis: {
                title:
                  currentValueAxis.title.text.replaceAll('"', '') ||
                  column.name.replaceAll('"', ''),
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
              datum: column.name.replaceAll('"', ''),
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

/**
 * Adding annotations into the correct x-axis key (the time bucket)
 * based on the table. As of now only annotations are supported
 */
const addPointInTimeEventsLayersToTable = (
  datatable: OpenSearchDashboardsDatatable,
  // TODO: visParams may not be needed
  visParams: VisParams,
  dimensions: any,
  visLayers: PointInTimeEventsVisLayer[]
): OpenSearchDashboardsDatatable => {
  const augmentedTable = cloneDeep(datatable);

  const xAxisColumn = getXAxisColumn(dimensions, datatable.columns);
  const yAxisColumns = getYAxisColumns(dimensions, datatable.columns);

  // using every() as a clean way to exit the loop if some condition is met, like an
  // empty or single-row table.
  // ref: https://stackoverflow.com/questions/51747397/how-to-break-foreach-loop-in-typescript
  visLayers.every((visLayer) => {
    const visLayerId = visLayer.id + '-events-layer';
    augmentedTable.columns.push({
      id: visLayerId,
      name: visLayer.name,
    });

    // special case: no rows
    if (augmentedTable.rows.length === 0) {
      return false;
    }

    // special case: only one row - put all timestamps for this annotation
    // in the one bucket and iterate to the next one
    if (augmentedTable.rows.length === 1) {
      augmentedTable.rows[0] = {
        ...augmentedTable.rows[0],
        visLayerId: visLayer.events.length,
      };
      return false;
    }

    // Bin the timestamps to the closest x-axis key, adding
    // an entry for this vis layer ID. Sorting the timestamps first
    // so that we will only search a particular row value once, giving us
    // time complexity of O(n), where n is number of rows.
    // Binary search time complexity would be O(n log n) which only benefits if
    // n < 10, which will not typically be the case.
    // There could be some binary search optimizations like dynamically changing the bounds, but
    // performance benefits would be very minimal if any, given the upper bounds limit
    // on n already due to chart constraints.
    let rowIndex = 0;
    const sortedTimestamps = visLayer.events
      .map((event: PointInTimeEvent) => event.timestamp)
      .sort((n1: number, n2: number) => n1 - n2) as number[];

    if (sortedTimestamps.length > 0) {
      sortedTimestamps.forEach((timestamp) => {
        while (rowIndex < augmentedTable.rows.length - 1) {
          const smallerVal = augmentedTable.rows[rowIndex][xAxisColumn.id] as number;
          const higherVal = augmentedTable.rows[rowIndex + 1][xAxisColumn.id] as number;
          let rowIndexToInsert;

          // timestamp is on the left bounds of the chart
          if (timestamp <= smallerVal) {
            rowIndexToInsert = rowIndex;

            // timestamp is in between the right 2 buckets. now need to determine which one it is closer to
          } else if (timestamp <= higherVal) {
            const smallerValDiff = Math.abs(timestamp - smallerVal);
            const higherValDiff = Math.abs(timestamp - higherVal);
            rowIndexToInsert = smallerValDiff <= higherValDiff ? rowIndex : rowIndex + 1;
          }

          // timestamp is on the right bounds of the chart
          else if (rowIndex + 1 === augmentedTable.rows.length - 1) {
            rowIndexToInsert = rowIndex + 1;
            // timestamp is still too small; traverse to next bucket
          } else {
            rowIndex += 1;
            continue;
          }

          // inserting the value. increment if the mapping/property already exists
          augmentedTable.rows[rowIndexToInsert][visLayerId] =
            (get(augmentedTable.rows[rowIndexToInsert], visLayerId, 0) as number) + 1;
          break;
        }
      });
    } else {
      // if no data found, remove the column to prevent vega-lite errors
      // TODO: make sure this is done on the original dataset too, not just
      // these vis-layer-related ones
      augmentedTable.columns.pop();
    }
    // iterate to the next VisLayer
    return true;
  });

  return augmentedTable;
};

const addPointInTimeEventsLayersToSpec = (
  datatable: OpenSearchDashboardsDatatable,
  spec: object,
  dimensions: any,
  visLayers: VisLayer[]
): object => {
  const newSpec = cloneDeep(spec) as any;

  const xAxisColumn = getXAxisColumn(dimensions, datatable.columns);
  const yAxisColumns = getYAxisColumns(dimensions, datatable.columns);
  const visLayerColumns = getVisLayerColumns(dimensions, datatable.columns, visLayers);
  const visLayerIds = visLayerColumns.map((visLayerColumn) => visLayerColumn.id);
  const visLayerNames = visLayerColumns.map((visLayerColumn) => visLayerColumn.name);
  const hoverParamName = 'hover';

  // Hide x axes on existing chart so they are only visible on the annotation chart
  newSpec.layer.forEach((dataSeries: any) => {
    if (get(dataSeries, 'encoding.x.axis', null) !== null) {
      dataSeries.encoding.x.axis = {
        ...dataSeries.encoding.x.axis,
        labels: false,
        title: null,
      };
    }
  });

  // Add a rule to the existing layer for showing lines on the chart if a dot is hovered on
  newSpec.layer.push({
    mark: 'rule',
    transform: [{ filter: generateFilterString(visLayerNames) }],
    encoding: {
      x: {
        field: xAxisColumn.id,
        type: 'temporal',
      },
      opacity: {
        value: 0,
        condition: { empty: false, param: hoverParamName, value: 1 },
      },
    },
  });

  // Nesting layer into a vconcat field so we can append annotation chart.
  newSpec.vconcat = [] as any[];
  newSpec.vconcat.push({
    layer: newSpec.layer,
  });
  delete newSpec.layer;

  // Adding the annotation timeline chart
  newSpec.vconcat.push({
    mark: 'circle',
    transform: [{ filter: generateFilterString(visLayerNames) }],
    params: [{ name: hoverParamName, select: { type: 'point', on: 'mouseover' } }],
    encoding: {
      x: {
        axis: { domain: true, grid: false, ticks: true, title: xAxisColumn.name },
        field: xAxisColumn.id,
        type: 'temporal',
      },
      size: {
        // TODO: standardize these sizes?
        condition: { empty: false, param: hoverParamName, value: 125 },
        value: 75,
      },
      tooltip: generateVisLayerTooltipSpec(visLayerColumns),
    },
  });

  return newSpec;
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
    let table = cloneDeep(input);

    const visParams = JSON.parse(args.visParams) as VisParams;
    const dimensions = JSON.parse(args.dimensions) as any;
    const allVisLayers = (args.visLayers
      ? (JSON.parse(args.visLayers) as VisLayers)
      : []) as VisLayers;

    // currently only supporting point-in-time events vis layers.
    const pointInTimeEventsVisLayers = allVisLayers.filter((visLayer: VisLayer) =>
      isPointInTimeEventsVisLayer(visLayer)
    ) as PointInTimeEventsVisLayer[];

    if (!isEmpty(pointInTimeEventsVisLayers)) {
      table = addPointInTimeEventsLayersToTable(
        table,
        visParams,
        dimensions,
        pointInTimeEventsVisLayers
      );
    }

    // creating initial vega spec from table
    let spec = createSpecFromDatatable(table, visParams, dimensions);

    // if we have point-in-time events vis layers, update the spec
    if (!isEmpty(pointInTimeEventsVisLayers)) {
      spec = addPointInTimeEventsLayersToSpec(table, spec, dimensions, pointInTimeEventsVisLayers);
    }

    return JSON.stringify(spec);
  },
});
