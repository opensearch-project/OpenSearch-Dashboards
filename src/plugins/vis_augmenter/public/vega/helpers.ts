/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import moment from 'moment';
import { cloneDeep, isEmpty, get } from 'lodash';
import { YAxisConfig } from 'src/plugins/vis_type_vega/public';
import {
  OpenSearchDashboardsDatatable,
  OpenSearchDashboardsDatatableColumn,
} from '../../../expressions/public';
import {
  PointInTimeEvent,
  PointInTimeEventsVisLayer,
  isPointInTimeEventsVisLayer,
  VIS_LAYER_COLUMN_TYPE,
  EVENT_COLOR,
  EVENT_MARK_SIZE,
  EVENT_MARK_SIZE_ENLARGED,
  EVENT_MARK_SHAPE,
  EVENT_TIMELINE_HEIGHT,
  EVENT_TOOLTIP_CENTER_ON_MARK,
  HOVER_PARAM,
  VisLayer,
  VisLayers,
  VisLayerTypes,
  VisAugmenterEmbeddableConfig,
  VisFlyoutContext,
} from '../';
import { VisAnnotationType } from './constants';

// Given any visLayers, create a map to indicate which VisLayer types are present.
// Convert to an array since ES6 Maps cannot be stringified.
export const enableVisLayersInSpecConfig = (spec: object, visLayers: VisLayers): {} => {
  const config = get(spec, 'config', { kibana: {} });
  const visibleVisLayers = new Map<VisLayerTypes, boolean>();

  // Currently only support PointInTimeEventsVisLayers. Set the flag to true
  // if there are any
  const pointInTimeEventsVisLayers = visLayers.filter((visLayer: VisLayer) =>
    isPointInTimeEventsVisLayer(visLayer)
  ) as PointInTimeEventsVisLayer[];
  if (!isEmpty(pointInTimeEventsVisLayers)) {
    visibleVisLayers.set(VisLayerTypes.PointInTimeEvents, true);
  }
  return {
    ...config,
    kibana: {
      ...config.kibana,
      visibleVisLayers: [...visibleVisLayers],
    },
  };
};

/**
 * Adds the signals which vega will use to trigger required events on the point in time annotation marks
 */
export const addVisEventSignalsToSpecConfig = (spec: object) => {
  const config = get(spec, 'config', { kibana: {} });
  const signals = {
    ...(config.kibana.signals || {}),
    [`${VisAnnotationType.POINT_IN_TIME_ANNOTATION}`]: [
      {
        name: 'PointInTimeAnnotationVisEvent',
        on: [{ events: 'click', update: 'opensearchDashboardsVisEventTriggered(event, datum)' }],
      },
    ],
  };

  return {
    ...config,
    kibana: {
      ...config.kibana,
      signals,
      tooltips: {
        centerOnMark: EVENT_TOOLTIP_CENTER_ON_MARK,
      },
    },
  };
};

// Get the first xaxis field as only 1 setup of X Axis will be supported and
// there won't be support for split series and split chart
export const getXAxisId = (
  dimensions: any,
  columns: OpenSearchDashboardsDatatableColumn[]
): string => {
  return columns.filter((column) => column.name === dimensions.x.label)[0].id;
};

export const isVisLayerColumn = (column: OpenSearchDashboardsDatatableColumn): boolean => {
  return column.meta?.type === VIS_LAYER_COLUMN_TYPE;
};

/**
 * For temporal domain ranges, there is a bug when passing timestamps in vega lite
 * that is still present in the current libraries we are using when developing in a
 * dev env. See https://github.com/vega/vega-lite/issues/6060 for bug details.
 * So, we convert to a vega-lite Date Time object and pass that instead.
 * See https://vega.github.io/vega-lite/docs/datetime.html for details on Date Time.
 */
const convertToDateTimeObj = (timestamp: number): any => {
  const momentObj = moment(timestamp);
  return {
    year: Number(momentObj.format('YYYY')),
    month: momentObj.format('MMMM'),
    date: momentObj.date(),
    hours: momentObj.hours(),
    minutes: momentObj.minutes(),
    seconds: momentObj.seconds(),
    milliseconds: momentObj.milliseconds(),
  };
};

export const generateVisLayerFilterString = (visLayerColumnIds: string[]): string => {
  if (!isEmpty(visLayerColumnIds)) {
    const filterString = visLayerColumnIds.map(
      (visLayerColumnId) => `datum['${visLayerColumnId}'] > 0`
    );
    return filterString.join(' || ');
  } else {
    // if there is no VisLayers to display, then filter out everything by always returning false
    return 'false';
  }
};

export const generateVisLayerTooltipFields = (
  visLayerColumnIds: string[]
): Array<{ field: string }> => {
  return visLayerColumnIds.map((id) => {
    return {
      field: id,
    };
  });
};

/**
 * By default, the source datatable will not include rows with empty data.
 * For handling events that may belong in missing buckets that are not yet
 * created, we need to create them. For more details, see description in
 * https://github.com/opensearch-project/OpenSearch-Dashboards/pull/3145
 *
 * Note that this may add buckets with start/end times out of the chart bounds.
 * This is the current default behavior of histogram aggregations with intervals,
 * in order for the bucket keys to have "clean" timestamp keys (e.g., 1/1 @ 12AM).
 * For more details, see
 * https://opensearch.org/docs/latest/opensearch/bucket-agg/#histogram-date_histogram
 *
 * Also note this is only adding empty buckets at the beginning/end of a table. We are
 * not taking into account missing buckets within source datapoints. Because of this
 * limitation, it is possible that charted events may not be put into the most precise
 * bucket based on their raw event timestamps, if there is missing / sparse source data.
 */
export const addMissingRowsToTableBounds = (
  datatable: OpenSearchDashboardsDatatable,
  dimensions: any
): OpenSearchDashboardsDatatable => {
  const augmentedTable = cloneDeep(datatable);
  const intervalMillis = moment.duration(dimensions.x.params.interval).asMilliseconds();
  const xAxisId = getXAxisId(dimensions, augmentedTable.columns);
  const chartStartTime = new Date(dimensions.x.params.bounds.min).valueOf();
  const chartEndTime = new Date(dimensions.x.params.bounds.max).valueOf();

  if (!isEmpty(augmentedTable.rows)) {
    const dataStartTime = augmentedTable.rows[0][xAxisId] as number;
    const dataEndTime = augmentedTable.rows[augmentedTable.rows.length - 1][xAxisId] as number;

    let curStartTime = dataStartTime;
    while (curStartTime > chartStartTime) {
      curStartTime -= intervalMillis;
      augmentedTable.rows.unshift({
        [xAxisId]: curStartTime,
      });
    }

    let curEndTime = dataEndTime;
    while (curEndTime < chartEndTime) {
      curEndTime += intervalMillis;
      augmentedTable.rows.push({
        [xAxisId]: curEndTime,
      });
    }
  } else {
    // if there's no existing rows, create them all
    let curTime = chartStartTime;
    while (curTime <= chartEndTime) {
      augmentedTable.rows.push({
        [xAxisId]: curTime,
      });
      curTime += intervalMillis;
    }
  }
  return augmentedTable;
};

/**
 * Adding events into the correct x-axis key (the time bucket)
 * based on the table. As of now only results from
 * PointInTimeEventsVisLayers are supported
 */
export const addPointInTimeEventsLayersToTable = (
  datatable: OpenSearchDashboardsDatatable,
  dimensions: any,
  visLayers: PointInTimeEventsVisLayer[]
): OpenSearchDashboardsDatatable => {
  const augmentedTable = addMissingRowsToTableBounds(datatable, dimensions);
  const xAxisId = getXAxisId(dimensions, augmentedTable.columns);

  if (isEmpty(visLayers) || augmentedTable.rows.length === 0) return augmentedTable;

  // Create columns for every unique event type. This is so we can aggregate on the different event types
  // (e.g., 'Anomalies', 'Alerts')
  [
    ...new Set(visLayers.map((visLayer: PointInTimeEventsVisLayer) => visLayer.pluginEventType)),
  ].forEach((pluginEventType: string) => {
    augmentedTable.columns.push({
      id: pluginEventType,
      name: `${pluginEventType} count`,
      meta: {
        type: VIS_LAYER_COLUMN_TYPE,
      },
    });
  });

  visLayers.forEach((visLayer: PointInTimeEventsVisLayer) => {
    const visLayerColumnId = `${visLayer.pluginEventType}`;

    // Add placeholder values of 0 for every event value. This is so the tooltip
    // can render correctly without showing the 'undefined' string
    let row = 0;
    while (row < augmentedTable.rows.length) {
      augmentedTable.rows[row] = {
        ...augmentedTable.rows[row],
        [visLayerColumnId]: get(augmentedTable.rows[row], visLayerColumnId, 0) as number,
      };
      row++;
    }

    // if only one row / one datapoint, put all events into this bucket
    if (augmentedTable.rows.length === 1) {
      augmentedTable.rows[0] = {
        ...augmentedTable.rows[0],
        [visLayerColumnId]:
          (get(augmentedTable.rows[0], visLayerColumnId, 0) as number) + visLayer.events.length,
      };
      return;
    }

    // Bin the timestamps to the closest x-axis key, adding
    // an entry for this vis layer ID. Sorting the timestamps first
    // so that we will only search a particular row value once.
    // There could be some optimizations, such as binary search + dynamically
    // changing the bounds, but performance benefits would be very minimal
    // if any, given the upper bounds limit on n already due to chart constraints.
    let rowIndex = 0;
    const minVal = augmentedTable.rows[0][xAxisId] as number;
    const maxVal =
      (augmentedTable.rows[augmentedTable.rows.length - 1][xAxisId] as number) +
      moment.duration(dimensions.x.params.interval).asMilliseconds();
    const sortedTimestamps = visLayer.events
      .map((event: PointInTimeEvent) => event.timestamp)
      .filter((timestamp: number) => timestamp >= minVal && timestamp <= maxVal)
      .sort((n1: number, n2: number) => n1 - n2) as number[];

    sortedTimestamps.forEach((timestamp) => {
      while (rowIndex < augmentedTable.rows.length - 1) {
        const smallerVal = augmentedTable.rows[rowIndex][xAxisId] as number;
        const higherVal = augmentedTable.rows[rowIndex + 1][xAxisId] as number;
        let rowIndexToInsert: number;

        // timestamp is on the left bounds of the chart
        if (timestamp === smallerVal) {
          rowIndexToInsert = rowIndex;

          // timestamp is in between the right 2 buckets. determine which one it is closer to
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
        augmentedTable.rows[rowIndexToInsert][visLayerColumnId] =
          (get(augmentedTable.rows[rowIndexToInsert], visLayerColumnId, 0) as number) + 1;
        break;
      }
    });
  });
  return augmentedTable;
};

/**
 * Updating the vega lite spec to include layers and marks related to
 * PointInTimeEventsVisLayers. It is assumed the datatable has already been
 * augmented with columns and row data containing the vis layers.
 */
export const addPointInTimeEventsLayersToSpec = (
  datatable: OpenSearchDashboardsDatatable,
  dimensions: any,
  spec: object
): object => {
  const newSpec = cloneDeep(spec) as any;

  const xAxisId = getXAxisId(dimensions, datatable.columns);
  const xAxisTitle = dimensions.x.label.replaceAll('"', '');
  const bucketStartTime = convertToDateTimeObj(datatable.rows[0][xAxisId] as number);
  const bucketEndTime = convertToDateTimeObj(
    datatable.rows[datatable.rows.length - 1][xAxisId] as number
  );
  const visLayerColumns = datatable.columns.filter((column: OpenSearchDashboardsDatatableColumn) =>
    isVisLayerColumn(column)
  );
  const visLayerColumnIds = visLayerColumns.map((column) => column.id);

  // Hide x axes text on existing chart so they are only visible on the event chart
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
    mark: {
      type: 'rule',
      color: EVENT_COLOR,
      opacity: 1,
    },
    transform: [{ filter: generateVisLayerFilterString(visLayerColumnIds) }],
    encoding: {
      x: {
        field: xAxisId,
        type: 'temporal',
      },
      opacity: {
        value: 0,
        condition: { empty: false, param: HOVER_PARAM, value: 1 },
      },
    },
  });

  // Nesting layer into a vconcat field so we can append event chart.
  newSpec.vconcat = [] as any[];
  newSpec.vconcat.push({
    layer: newSpec.layer,
  });
  delete newSpec.layer;

  // Adding the event timeline chart
  newSpec.vconcat.push({
    height: EVENT_TIMELINE_HEIGHT,
    mark: {
      type: 'point',
      shape: EVENT_MARK_SHAPE,
      fill: EVENT_COLOR,
      stroke: EVENT_COLOR,
      strokeOpacity: 1,
      fillOpacity: 1,
      // This style is only used to locate this mark when trying to add signals in the compiled vega spec.
      // @see @method vega_parser._compileVegaLite
      style: [`${VisAnnotationType.POINT_IN_TIME_ANNOTATION}`],
      tooltip: true,
    },
    transform: [
      { filter: generateVisLayerFilterString(visLayerColumnIds) },
      { calculate: `'${VisAnnotationType.POINT_IN_TIME_ANNOTATION}'`, as: 'annotationType' },
    ],
    params: [{ name: HOVER_PARAM, select: { type: 'point', on: 'mouseover' } }],
    encoding: {
      x: {
        axis: {
          title: xAxisTitle,
          grid: false,
          ticks: true,
          orient: 'bottom',
          domain: true,
        },
        field: xAxisId,
        type: 'temporal',
        scale: {
          domain: [bucketStartTime, bucketEndTime],
        },
      },
      size: {
        condition: { empty: false, param: HOVER_PARAM, value: EVENT_MARK_SIZE_ENLARGED },
        value: EVENT_MARK_SIZE,
      },
      tooltip: generateVisLayerTooltipFields(visLayerColumnIds),
    },
  });

  return newSpec;
};

// This is the total y-axis padding such that if this is added to the "padding" value of the view, if there is no axis,
// it will align values on the x-axis
export const calculateYAxisPadding = (config: YAxisConfig): number => {
  // TODO: figure out where this value is coming from
  const defaultPadding = 3;
  return (
    get(config, 'minExtent', 0) +
    get(config, 'offset', 0) +
    get(config, 'translate', 0) +
    get(config, 'domainWidth', 0) +
    get(config, 'labelPadding', 0) +
    get(config, 'titlePadding', 0) +
    get(config, 'tickOffset', 0) +
    get(config, 'tickSize', 0) +
    defaultPadding
  );
};

// Parse the vis augmenter config to apply different visual changes to the event chart spec.
// This includes potentially removing the original vis data, hiding axes, moving the legend, etc.
// Primarily used within the view events flyout to render the charts in different ways, and to
// ensure the stacked event charts are aligned with the base vis chart.
export const augmentEventChartSpec = (
  config: VisAugmenterEmbeddableConfig,
  origSpec: object
): {} => {
  const inFlyout = get(config, 'inFlyout', false) as boolean;
  const flyoutContext = get(config, 'flyoutContext', VisFlyoutContext.BASE_VIS);

  const newVconcat = [] as Array<{}>;
  // @ts-ignore
  const newConfig = origSpec?.config;
  const visChart = get(origSpec, 'vconcat[0]', {});
  const eventChart = get(origSpec, 'vconcat[1]', {});

  if (inFlyout) {
    switch (flyoutContext) {
      case VisFlyoutContext.BASE_VIS:
        newConfig.legend = {
          ...newConfig.legend,
          orient: 'top',
          // need to set offset to 0 so we don't cut off the chart canvas within the embeddable
          offset: 0,
        };
        break;

      case VisFlyoutContext.EVENT_VIS:
        eventChart.encoding.x.axis = {
          domain: true,
          grid: false,
          ticks: false,
          labels: false,
          title: null,
        };
        eventChart.mark.fillOpacity = 0;
        break;

      case VisFlyoutContext.TIMELINE_VIS:
        eventChart.transform = [
          {
            filter: 'false',
          },
        ];
        break;
    }

    // if coming from view events page, need to standardize the y axis padding values so we can
    // align all of the charts correctly
    newConfig.axisY = {
      // We need minExtent and maxExtent to be the same. We cannot calculate these on-the-fly
      // so we need to force a static value. We choose 40 as a good middleground for sufficient
      // axis space without taking up too much actual chart space.
      minExtent: 40,
      maxExtent: 40,
      offset: 0,
      translate: 0,
      domainWidth: 1,
      labelPadding: 2,
      titlePadding: 2,
      tickOffset: 0,
      tickSize: 5,
    } as YAxisConfig;
  }

  if (flyoutContext === VisFlyoutContext.BASE_VIS) {
    newVconcat.push(visChart);
  }
  newVconcat.push(eventChart);

  return {
    ...cloneDeep(origSpec),
    config: newConfig,
    vconcat: newVconcat,
  };
};
