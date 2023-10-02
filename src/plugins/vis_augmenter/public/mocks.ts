/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { get } from 'lodash';
import { VisualizeEmbeddable, Vis } from '../../visualizations/public';
import { ErrorEmbeddable } from '../../embeddable/public';
// eslint-disable-next-line @osd/eslint/no-restricted-paths
import { timefilterServiceMock } from '../../data/public/query/timefilter/timefilter_service.mock';
import { EventVisEmbeddableItem } from './view_events_flyout';
import {
  VisLayer,
  VisLayerTypes,
  VisLayerErrorTypes,
  PointInTimeEventsVisLayer,
  PluginResource,
  PointInTimeEvent,
} from './types';
import { AggConfigs, AggTypesRegistryStart, IndexPattern } from '../../data/common';
import { mockAggTypesRegistry } from '../../data/common/search/aggs/test_helpers';

export const VALID_CONFIG_STATES = [
  {
    enabled: true,
    type: 'max',
    params: {},
    schema: 'metric',
  },
  {
    enabled: true,
    type: 'date_histogram',
    params: {},
    schema: 'segment',
  },
];

export const STUB_INDEX_PATTERN_WITH_FIELDS = {
  id: '1234',
  title: 'logstash-*',
  fields: [
    {
      name: 'response',
      type: 'number',
      esTypes: ['integer'],
      aggregatable: true,
      filterable: true,
      searchable: true,
    },
  ],
} as IndexPattern;

export const TYPES_REGISTRY: AggTypesRegistryStart = mockAggTypesRegistry();

export const VALID_AGGS = new AggConfigs(STUB_INDEX_PATTERN_WITH_FIELDS, VALID_CONFIG_STATES, {
  typesRegistry: TYPES_REGISTRY,
});

export const VALID_VIS = ({
  type: {},
  uiState: {
    on: jest.fn(),
  },
  params: {
    type: 'line',
    seriesParams: [
      {
        type: 'line',
      },
    ],
    categoryAxes: [
      {
        position: 'bottom',
      },
    ],
  },
  data: {
    aggs: VALID_AGGS,
  },
} as unknown) as Vis;

const SAVED_OBJ_ID = 'test-saved-obj-id';
const VIS_TITLE = 'test-vis-title';
const ORIGIN_PLUGIN = 'test-plugin';
const PLUGIN_RESOURCE = {
  type: 'test-type',
  id: 'test-resource-id',
  name: 'test-resource-name',
  urlPath: 'test-url-path',
} as PluginResource;
const EVENT_COUNT = 3;
const ERROR_MESSAGE = 'test-error-message';
const EVENT_TYPE = 'test-event-type';

export const createPluginResource = (
  type: string = PLUGIN_RESOURCE.type,
  id: string = PLUGIN_RESOURCE.id,
  name: string = PLUGIN_RESOURCE.name,
  urlPath: string = PLUGIN_RESOURCE.urlPath
): PluginResource => {
  return {
    type,
    id,
    name,
    urlPath,
  };
};

export const createMockErrorEmbeddable = (): ErrorEmbeddable => {
  return new ErrorEmbeddable('Oh no something has gone wrong', { id: ' 404' });
};

export const createMockVisEmbeddable = (
  savedObjectId: string = SAVED_OBJ_ID,
  title: string = VIS_TITLE,
  validVis: boolean = true
): VisualizeEmbeddable => {
  const mockTimeFilterService = timefilterServiceMock.createStartContract();
  const mockTimeFilter = mockTimeFilterService.timefilter;
  const mockVis = validVis
    ? VALID_VIS
    : (({
        type: {},
        data: {},
        uiState: {
          on: jest.fn(),
        },
        params: {
          type: 'line',
          seriesParams: [],
        },
      } as unknown) as Vis);
  const mockDeps = {
    start: jest.fn(),
  };
  const mockConfiguration = {
    vis: mockVis,
    editPath: 'test-edit-path',
    editUrl: 'test-edit-url',
    editable: true,
    deps: mockDeps,
  };
  const mockVisualizeInput = { id: 'test-id', savedObjectId };

  const mockVisEmbeddable = new VisualizeEmbeddable(
    mockTimeFilter,
    mockConfiguration,
    mockVisualizeInput
  );
  mockVisEmbeddable.getTitle = () => title;
  mockVisEmbeddable.visLayers = [createPointInTimeEventsVisLayer()];
  return mockVisEmbeddable;
};

export const createPointInTimeEventsVisLayer = (
  originPlugin: string = ORIGIN_PLUGIN,
  pluginResource: PluginResource = PLUGIN_RESOURCE,
  eventCount: number = EVENT_COUNT,
  error: boolean = false,
  errorMessage: string = ERROR_MESSAGE
): PointInTimeEventsVisLayer => {
  const events = [] as PointInTimeEvent[];
  for (let i = 0; i < eventCount; i++) {
    events.push({
      timestamp: i,
      metadata: {
        pluginResourceId: pluginResource.id,
      },
    } as PointInTimeEvent);
  }
  return {
    originPlugin,
    type: VisLayerTypes.PointInTimeEvents,
    pluginResource,
    events,
    pluginEventType: EVENT_TYPE,
    error: error
      ? {
          type: VisLayerErrorTypes.FETCH_FAILURE,
          message: errorMessage,
        }
      : undefined,
  };
};

export const createMockEventVisEmbeddableItem = (
  savedObjectId: string = SAVED_OBJ_ID,
  title: string = VIS_TITLE,
  originPlugin: string = ORIGIN_PLUGIN,
  pluginResource: PluginResource = PLUGIN_RESOURCE,
  eventCount: number = EVENT_COUNT
): EventVisEmbeddableItem => {
  const visLayer = createPointInTimeEventsVisLayer(originPlugin, pluginResource, eventCount);
  const embeddable = createMockVisEmbeddable(savedObjectId, title);
  return {
    visLayer,
    embeddable,
  };
};

export const createVisLayer = (
  type: any,
  error: boolean = false,
  errorMessage: string = 'some-error-message',
  resource?: {
    type?: string;
    id?: string;
    name?: string;
    urlPath?: string;
  }
): VisLayer => {
  return {
    type,
    originPlugin: 'test-plugin',
    pluginResource: {
      type: get(resource, 'type', 'test-resource-type'),
      id: get(resource, 'id', 'test-resource-id'),
      name: get(resource, 'name', 'test-resource-name'),
      urlPath: get(resource, 'urlPath', 'test-resource-url-path'),
    },
    error: error
      ? {
          type: VisLayerErrorTypes.FETCH_FAILURE,
          message: errorMessage,
        }
      : undefined,
  };
};
