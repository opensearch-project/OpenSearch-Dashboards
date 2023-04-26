/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsDatatable } from '../../expressions/public';
import { VIS_LAYER_COLUMN_TYPE, VisLayerTypes, HOVER_PARAM } from './';
import { VisInteraction, VisInteractionEventHandlerName } from './vega/constants';

const TEST_X_AXIS_ID = 'test-x-axis-id';
const TEST_VALUE_AXIS_ID = 'test-value-axis-id';
const TEST_X_AXIS_TITLE = 'time';
const TEST_VALUE_AXIS_TITLE = 'avg value';
const TEST_PLUGIN = 'test-plugin';
const TEST_PLUGIN_RESOURCE_TYPE = 'test-resource-type';
const TEST_PLUGIN_RESOURCE_ID = 'test-resource-id';
const TEST_PLUGIN_RESOURCE_ID_2 = 'test-resource-id-2';
const TEST_PLUGIN_RESOURCE_NAME = 'test-resource-name';
const TEST_PLUGIN_RESOURCE_NAME_2 = 'test-resource-name-2';
const TEST_PLUGIN_RESOURCE_PATH = `${TEST_PLUGIN}/${TEST_PLUGIN_RESOURCE_TYPE}/${TEST_PLUGIN_RESOURCE_ID}`;
const TEST_PLUGIN_RESOURCE_PATH_2 = `${TEST_PLUGIN}/${TEST_PLUGIN_RESOURCE_TYPE}/${TEST_PLUGIN_RESOURCE_ID_2}`;

const TEST_VALUES_SINGLE_ROW_NO_VIS_LAYERS = [{ [TEST_X_AXIS_ID]: 0, [TEST_VALUE_AXIS_ID]: 5 }];

const TEST_VALUES_SINGLE_ROW_SINGLE_VIS_LAYER = [
  { [TEST_X_AXIS_ID]: 0, [TEST_VALUE_AXIS_ID]: 5, [TEST_PLUGIN_RESOURCE_ID]: 3 },
];

const TEST_VALUES_ONLY_VIS_LAYERS = [
  { [TEST_X_AXIS_ID]: 0 },
  { [TEST_X_AXIS_ID]: 5, [TEST_PLUGIN_RESOURCE_ID]: 2 },
  { [TEST_X_AXIS_ID]: 10 },
  { [TEST_X_AXIS_ID]: 15 },
  { [TEST_X_AXIS_ID]: 20 },
  { [TEST_X_AXIS_ID]: 25 },
  { [TEST_X_AXIS_ID]: 30 },
  { [TEST_X_AXIS_ID]: 35, [TEST_PLUGIN_RESOURCE_ID]: 1 },
  { [TEST_X_AXIS_ID]: 40 },
  { [TEST_X_AXIS_ID]: 45 },
  { [TEST_X_AXIS_ID]: 50 },
];

const TEST_VALUES_NO_VIS_LAYERS = [
  { [TEST_X_AXIS_ID]: 0, [TEST_VALUE_AXIS_ID]: 5 },
  { [TEST_X_AXIS_ID]: 5, [TEST_VALUE_AXIS_ID]: 10 },
  { [TEST_X_AXIS_ID]: 10, [TEST_VALUE_AXIS_ID]: 6 },
  { [TEST_X_AXIS_ID]: 15, [TEST_VALUE_AXIS_ID]: 4 },
  { [TEST_X_AXIS_ID]: 20, [TEST_VALUE_AXIS_ID]: 5 },
  { [TEST_X_AXIS_ID]: 25 },
  { [TEST_X_AXIS_ID]: 30 },
  { [TEST_X_AXIS_ID]: 35 },
  { [TEST_X_AXIS_ID]: 40 },
  { [TEST_X_AXIS_ID]: 45, [TEST_VALUE_AXIS_ID]: 3 },
  { [TEST_X_AXIS_ID]: 50, [TEST_VALUE_AXIS_ID]: 5 },
];

const TEST_VALUES_SINGLE_VIS_LAYER = [
  { [TEST_X_AXIS_ID]: 0, [TEST_VALUE_AXIS_ID]: 5 },
  { [TEST_X_AXIS_ID]: 5, [TEST_VALUE_AXIS_ID]: 10, [TEST_PLUGIN_RESOURCE_ID]: 2 },
  { [TEST_X_AXIS_ID]: 10, [TEST_VALUE_AXIS_ID]: 6 },
  { [TEST_X_AXIS_ID]: 15, [TEST_VALUE_AXIS_ID]: 4 },
  { [TEST_X_AXIS_ID]: 20, [TEST_VALUE_AXIS_ID]: 5 },
  { [TEST_X_AXIS_ID]: 25 },
  { [TEST_X_AXIS_ID]: 30 },
  { [TEST_X_AXIS_ID]: 35, [TEST_PLUGIN_RESOURCE_ID]: 1 },
  { [TEST_X_AXIS_ID]: 40 },
  { [TEST_X_AXIS_ID]: 45, [TEST_VALUE_AXIS_ID]: 3 },
  { [TEST_X_AXIS_ID]: 50, [TEST_VALUE_AXIS_ID]: 5 },
];

const TEST_VALUES_SINGLE_VIS_LAYER_ON_BOUNDS = [
  { [TEST_X_AXIS_ID]: 0, [TEST_VALUE_AXIS_ID]: 5, [TEST_PLUGIN_RESOURCE_ID]: 2 },
  { [TEST_X_AXIS_ID]: 5, [TEST_VALUE_AXIS_ID]: 10 },
  { [TEST_X_AXIS_ID]: 10, [TEST_VALUE_AXIS_ID]: 6 },
  { [TEST_X_AXIS_ID]: 15, [TEST_VALUE_AXIS_ID]: 4 },
  { [TEST_X_AXIS_ID]: 20, [TEST_VALUE_AXIS_ID]: 5 },
  { [TEST_X_AXIS_ID]: 25 },
  { [TEST_X_AXIS_ID]: 30 },
  { [TEST_X_AXIS_ID]: 35 },
  { [TEST_X_AXIS_ID]: 40 },
  { [TEST_X_AXIS_ID]: 45, [TEST_VALUE_AXIS_ID]: 3 },
  { [TEST_X_AXIS_ID]: 50, [TEST_VALUE_AXIS_ID]: 5, [TEST_PLUGIN_RESOURCE_ID]: 1 },
];

const TEST_VALUES_MULTIPLE_VIS_LAYERS = [
  { [TEST_X_AXIS_ID]: 0, [TEST_VALUE_AXIS_ID]: 5 },
  {
    [TEST_X_AXIS_ID]: 5,
    [TEST_VALUE_AXIS_ID]: 10,
    [TEST_PLUGIN_RESOURCE_ID]: 2,
    [TEST_PLUGIN_RESOURCE_ID_2]: 1,
  },
  { [TEST_X_AXIS_ID]: 10, [TEST_VALUE_AXIS_ID]: 6 },
  { [TEST_X_AXIS_ID]: 15, [TEST_VALUE_AXIS_ID]: 4, [TEST_PLUGIN_RESOURCE_ID_2]: 1 },
  { [TEST_X_AXIS_ID]: 20, [TEST_VALUE_AXIS_ID]: 5 },
  { [TEST_X_AXIS_ID]: 25 },
  { [TEST_X_AXIS_ID]: 30 },
  { [TEST_X_AXIS_ID]: 35, [TEST_PLUGIN_RESOURCE_ID]: 1 },
  { [TEST_X_AXIS_ID]: 40 },
  { [TEST_X_AXIS_ID]: 45, [TEST_VALUE_AXIS_ID]: 3 },
  { [TEST_X_AXIS_ID]: 50, [TEST_VALUE_AXIS_ID]: 5, [TEST_PLUGIN_RESOURCE_ID_2]: 2 },
];

export const TEST_COLUMNS_NO_VIS_LAYERS = [
  {
    id: TEST_X_AXIS_ID,
    name: TEST_X_AXIS_TITLE,
  },
  {
    id: TEST_VALUE_AXIS_ID,
    name: TEST_VALUE_AXIS_TITLE,
  },
];

export const TEST_COLUMNS_SINGLE_VIS_LAYER = [
  ...TEST_COLUMNS_NO_VIS_LAYERS,
  {
    id: TEST_PLUGIN_RESOURCE_ID,
    name: TEST_PLUGIN_RESOURCE_NAME,
    meta: {
      type: VIS_LAYER_COLUMN_TYPE,
    },
  },
];

export const TEST_COLUMNS_MULTIPLE_VIS_LAYERS = [
  ...TEST_COLUMNS_SINGLE_VIS_LAYER,
  {
    id: TEST_PLUGIN_RESOURCE_ID_2,
    name: TEST_PLUGIN_RESOURCE_NAME_2,
    meta: {
      type: VIS_LAYER_COLUMN_TYPE,
    },
  },
];

export const TEST_DATATABLE_SINGLE_ROW_NO_VIS_LAYERS = {
  type: 'opensearch_dashboards_datatable',
  columns: TEST_COLUMNS_NO_VIS_LAYERS,
  rows: TEST_VALUES_SINGLE_ROW_NO_VIS_LAYERS,
} as OpenSearchDashboardsDatatable;

export const TEST_DATATABLE_SINGLE_ROW_SINGLE_VIS_LAYER = {
  type: 'opensearch_dashboards_datatable',
  columns: TEST_COLUMNS_SINGLE_VIS_LAYER,
  rows: TEST_VALUES_SINGLE_ROW_SINGLE_VIS_LAYER,
} as OpenSearchDashboardsDatatable;

export const TEST_DATATABLE_ONLY_VIS_LAYERS = {
  type: 'opensearch_dashboards_datatable',
  columns: TEST_COLUMNS_SINGLE_VIS_LAYER,
  rows: TEST_VALUES_ONLY_VIS_LAYERS,
} as OpenSearchDashboardsDatatable;

export const TEST_DATATABLE_NO_VIS_LAYERS = {
  type: 'opensearch_dashboards_datatable',
  columns: TEST_COLUMNS_NO_VIS_LAYERS,
  rows: TEST_VALUES_NO_VIS_LAYERS,
} as OpenSearchDashboardsDatatable;

export const TEST_DATATABLE_SINGLE_VIS_LAYER_EMPTY = {
  ...TEST_DATATABLE_NO_VIS_LAYERS,
  columns: TEST_COLUMNS_SINGLE_VIS_LAYER,
} as OpenSearchDashboardsDatatable;

export const TEST_DATATABLE_SINGLE_VIS_LAYER = {
  type: 'opensearch_dashboards_datatable',
  columns: TEST_COLUMNS_SINGLE_VIS_LAYER,
  rows: TEST_VALUES_SINGLE_VIS_LAYER,
} as OpenSearchDashboardsDatatable;

export const TEST_DATATABLE_SINGLE_VIS_LAYER_ON_BOUNDS = {
  type: 'opensearch_dashboards_datatable',
  columns: TEST_COLUMNS_SINGLE_VIS_LAYER,
  rows: TEST_VALUES_SINGLE_VIS_LAYER_ON_BOUNDS,
} as OpenSearchDashboardsDatatable;

export const TEST_DATATABLE_MULTIPLE_VIS_LAYERS = {
  type: 'opensearch_dashboards_datatable',
  columns: TEST_COLUMNS_MULTIPLE_VIS_LAYERS,
  rows: TEST_VALUES_MULTIPLE_VIS_LAYERS,
} as OpenSearchDashboardsDatatable;

const TEST_BASE_CONFIG = {
  view: { stroke: null },
  concat: { spacing: 0 },
  legend: { orient: 'right' },
  kibana: { hideWarnings: true },
};

const TEST_BASE_VIS_LAYER = {
  mark: { type: 'line', interpolate: 'linear', strokeWidth: 2, point: true },
  encoding: {
    x: {
      axis: { title: TEST_X_AXIS_TITLE, grid: false },
      field: TEST_X_AXIS_ID,
      type: 'temporal',
    },
    y: {
      axis: {
        title: TEST_VALUE_AXIS_TITLE,
        grid: '',
        orient: 'left',
        labels: true,
        labelAngle: 0,
      },
      field: TEST_VALUE_AXIS_ID,
      type: 'quantitative',
    },
    tooltip: [
      { field: TEST_X_AXIS_ID, type: 'temporal', title: TEST_VALUE_AXIS_TITLE },
      { field: TEST_VALUE_AXIS_ID, type: 'quantitative', title: TEST_VALUE_AXIS_TITLE },
    ],
    color: { datum: TEST_VALUE_AXIS_TITLE },
  },
};

export const TEST_SPEC_NO_VIS_LAYERS = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: TEST_VALUES_NO_VIS_LAYERS,
  },
  config: TEST_BASE_CONFIG,
  layer: [TEST_BASE_VIS_LAYER],
};

export const TEST_SPEC_SINGLE_VIS_LAYER = {
  ...TEST_SPEC_NO_VIS_LAYERS,
  data: {
    ...TEST_SPEC_NO_VIS_LAYERS.data,
    values: TEST_VALUES_SINGLE_VIS_LAYER,
  },
};

export const TEST_SPEC_MULTIPLE_VIS_LAYERS = {
  ...TEST_SPEC_NO_VIS_LAYERS,
  data: {
    ...TEST_SPEC_NO_VIS_LAYERS.data,
    values: TEST_VALUES_MULTIPLE_VIS_LAYERS,
  },
};

export const TEST_DIMENSIONS = {
  x: {
    params: {
      interval: 5,
      bounds: {
        min: 0,
        max: 50,
      },
    },
    label: TEST_X_AXIS_TITLE,
  },
};

export const TEST_DIMENSIONS_SINGLE_ROW = {
  x: {
    params: {
      interval: 5,
      bounds: {
        min: 0,
        max: 0,
      },
    },
    label: TEST_X_AXIS_TITLE,
  },
};

export const TEST_DIMENSIONS_INVALID_BOUNDS = {
  x: {
    params: {
      interval: 5,
      bounds: {
        min: 50,
        max: 0,
      },
    },
    label: TEST_X_AXIS_TITLE,
  },
};

export const TEST_VIS_LAYERS_SINGLE = [
  {
    originPlugin: TEST_PLUGIN,
    type: VisLayerTypes.PointInTimeEvents,
    pluginResource: {
      type: TEST_PLUGIN_RESOURCE_TYPE,
      id: TEST_PLUGIN_RESOURCE_ID,
      name: TEST_PLUGIN_RESOURCE_NAME,
      urlPath: TEST_PLUGIN_RESOURCE_PATH,
    },
    events: [
      {
        timestamp: 4,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
      {
        timestamp: 6,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
      {
        timestamp: 35,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
    ],
  },
];

export const TEST_VIS_LAYERS_SINGLE_INVALID_BOUNDS = [
  {
    originPlugin: TEST_PLUGIN,
    type: VisLayerTypes.PointInTimeEvents,
    pluginResource: {
      type: TEST_PLUGIN_RESOURCE_TYPE,
      id: TEST_PLUGIN_RESOURCE_ID,
      name: TEST_PLUGIN_RESOURCE_NAME,
      urlPath: TEST_PLUGIN_RESOURCE_PATH,
    },
    events: [
      {
        timestamp: -5,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
      {
        timestamp: -100,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
      {
        timestamp: 75,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
    ],
  },
];

export const TEST_VIS_LAYERS_SINGLE_EMPTY_EVENTS = [
  {
    originPlugin: TEST_PLUGIN,
    type: VisLayerTypes.PointInTimeEvents,
    pluginResource: {
      type: TEST_PLUGIN_RESOURCE_TYPE,
      id: TEST_PLUGIN_RESOURCE_ID,
      name: TEST_PLUGIN_RESOURCE_NAME,
      urlPath: TEST_PLUGIN_RESOURCE_PATH,
    },
  },
];

export const TEST_VIS_LAYERS_SINGLE_ON_BOUNDS = [
  {
    originPlugin: TEST_PLUGIN,
    type: VisLayerTypes.PointInTimeEvents,
    pluginResource: {
      type: TEST_PLUGIN_RESOURCE_TYPE,
      id: TEST_PLUGIN_RESOURCE_ID,
      name: TEST_PLUGIN_RESOURCE_NAME,
      urlPath: TEST_PLUGIN_RESOURCE_PATH,
    },
    events: [
      {
        timestamp: 0,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
      {
        timestamp: 2,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
      {
        timestamp: 55,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID,
        },
      },
    ],
  },
];

export const TEST_VIS_LAYERS_MULTIPLE = [
  ...TEST_VIS_LAYERS_SINGLE,
  {
    originPlugin: TEST_PLUGIN,
    type: VisLayerTypes.PointInTimeEvents,
    pluginResource: {
      type: TEST_PLUGIN_RESOURCE_TYPE,
      id: TEST_PLUGIN_RESOURCE_ID_2,
      name: TEST_PLUGIN_RESOURCE_NAME_2,
      urlPath: TEST_PLUGIN_RESOURCE_PATH_2,
    },
    events: [
      {
        timestamp: 5,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID_2,
        },
      },
      {
        timestamp: 15,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID_2,
        },
      },
      {
        timestamp: 49,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID_2,
        },
      },
      {
        timestamp: 50,
        metadata: {
          pluginResourceId: TEST_PLUGIN_RESOURCE_ID_2,
        },
      },
    ],
  },
];

const TEST_RULE_LAYER_SINGLE_VIS_LAYER = {
  mark: { type: 'rule', color: 'red', opacity: 1 },
  transform: [{ filter: `datum['${TEST_PLUGIN_RESOURCE_ID}'] > 0` }],
  encoding: {
    x: { field: TEST_X_AXIS_ID, type: 'temporal' },
    opacity: { value: 0, condition: { empty: false, param: HOVER_PARAM, value: 1 } },
  },
};

const TEST_RULE_LAYER_MULTIPLE_VIS_LAYERS = {
  ...TEST_RULE_LAYER_SINGLE_VIS_LAYER,
  transform: [
    {
      filter: `datum['${TEST_PLUGIN_RESOURCE_ID}'] > 0 || datum['${TEST_PLUGIN_RESOURCE_ID_2}'] > 0`,
    },
  ],
};

const TEST_EVENTS_LAYER_SINGLE_VIS_LAYER = {
  height: 25,
  mark: {
    type: 'point',
    shape: 'triangle-up',
    color: 'red',
    filled: true,
    opacity: 1,
  },
  transform: [
    { filter: `datum['${TEST_PLUGIN_RESOURCE_ID}'] > 0` },
    { calculate: `'${VisInteraction.POINT_IN_TIME_ANNOTATION}'`, as: 'annotationType' },
  ],
  params: [{ name: HOVER_PARAM, select: { type: 'point', on: 'mouseover' } }],
  encoding: {
    x: {
      axis: {
        title: TEST_X_AXIS_TITLE,
        grid: false,
        ticks: true,
        orient: 'bottom',
        domain: true,
      },
      field: TEST_X_AXIS_ID,
      type: 'temporal',
      scale: {
        domain: [
          {
            year: 2022,
            month: 'December',
            date: 1,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          },
          {
            year: 2023,
            month: 'March',
            date: 2,
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: 0,
          },
        ],
      },
    },
    size: { condition: { empty: false, param: HOVER_PARAM, value: 140 }, value: 100 },
  },
};

const TEST_EVENTS_LAYER_MULTIPLE_VIS_LAYERS = {
  ...TEST_EVENTS_LAYER_SINGLE_VIS_LAYER,
  transform: [
    {
      filter: `datum['${TEST_PLUGIN_RESOURCE_ID}'] > 0 || datum['${TEST_PLUGIN_RESOURCE_ID_2}'] > 0`,
    },
    { calculate: `'${VisInteraction.POINT_IN_TIME_ANNOTATION}'`, as: 'annotationType' },
  ],
};

export const TEST_RESULT_SPEC_SINGLE_VIS_LAYER = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: TEST_VALUES_SINGLE_VIS_LAYER,
  },
  config: TEST_BASE_CONFIG,
  vconcat: [
    {
      layer: [
        {
          ...TEST_BASE_VIS_LAYER,
          encoding: {
            ...TEST_BASE_VIS_LAYER.encoding,
            x: {
              ...TEST_BASE_VIS_LAYER.encoding.x,
              axis: {
                title: null,
                grid: false,
                labels: false,
              },
            },
          },
        },
        TEST_RULE_LAYER_SINGLE_VIS_LAYER,
      ],
    },
    TEST_EVENTS_LAYER_SINGLE_VIS_LAYER,
  ],
};

export const TEST_RESULT_SPEC_SINGLE_VIS_LAYER_EMPTY = {
  ...TEST_RESULT_SPEC_SINGLE_VIS_LAYER,
  data: {
    values: TEST_VALUES_NO_VIS_LAYERS,
  },
};

export const TEST_RESULT_SPEC_MULTIPLE_VIS_LAYERS = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    values: TEST_VALUES_MULTIPLE_VIS_LAYERS,
  },
  config: TEST_BASE_CONFIG,
  vconcat: [
    {
      layer: [
        {
          ...TEST_BASE_VIS_LAYER,
          encoding: {
            ...TEST_BASE_VIS_LAYER.encoding,
            x: {
              ...TEST_BASE_VIS_LAYER.encoding.x,
              axis: {
                title: null,
                grid: false,
                labels: false,
              },
            },
          },
        },
        TEST_RULE_LAYER_MULTIPLE_VIS_LAYERS,
      ],
    },
    TEST_EVENTS_LAYER_MULTIPLE_VIS_LAYERS,
  ],
};

export const TEST_RESULT_SPEC_WITH_VIS_INTERACTION_CONFIG = {
  ...TEST_SPEC_NO_VIS_LAYERS,
  config: {
    ...TEST_SPEC_NO_VIS_LAYERS.config,
    kibana: {
      ...(TEST_SPEC_NO_VIS_LAYERS.config.kibana || {}),
      visInteractions: [
        {
          event: 'click',
          handlerName: VisInteractionEventHandlerName.POINT_IN_TIME_CLICK_EVENT_HANDLER,
        },
        {
          event: 'mouseover',
          handlerName: VisInteractionEventHandlerName.POINT_IN_TIME_HOVER_IN_EVENT_HANDLER,
        },
      ],
    },
  },
};
