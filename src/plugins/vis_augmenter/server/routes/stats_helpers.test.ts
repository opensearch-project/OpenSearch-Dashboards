/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectsFindResult } from '../../../../../src/core/server';
import { AugmentVisSavedObjectAttributes } from '../../common';
import { getAugmentVisSavedObjects, getStats } from './stats_helpers';

const ORIGIN_PLUGIN_1 = 'origin-plugin-1';
const ORIGIN_PLUGIN_2 = 'origin-plugin-2';
const PLUGIN_RESOURCE_TYPE_1 = 'plugin-resource-type-1';
const PLUGIN_RESOURCE_TYPE_2 = 'plugin-resource-type-2';
const PLUGIN_RESOURCE_ID_1 = 'plugin-resource-id-1';
const PLUGIN_RESOURCE_ID_2 = 'plugin-resource-id-2';
const PLUGIN_RESOURCE_ID_3 = 'plugin-resource-id-3';
const VIS_REF_NAME = 'visualization_0';
const VIS_ID_1 = 'vis-id-1';
const VIS_ID_2 = 'vis-id-2';
const PER_PAGE = 4;

const SINGLE_SAVED_OBJ = [
  {
    attributes: {
      originPlugin: ORIGIN_PLUGIN_1,
      pluginResource: {
        type: PLUGIN_RESOURCE_TYPE_1,
        id: PLUGIN_RESOURCE_ID_1,
      },
      visName: VIS_REF_NAME,
    },
    references: [
      {
        name: VIS_REF_NAME,
        id: VIS_ID_1,
      },
    ],
  },
] as Array<SavedObjectsFindResult<AugmentVisSavedObjectAttributes>>;

const MULTIPLE_SAVED_OBJS = [
  {
    attributes: {
      originPlugin: ORIGIN_PLUGIN_1,
      pluginResource: {
        type: PLUGIN_RESOURCE_TYPE_1,
        id: PLUGIN_RESOURCE_ID_1,
      },
      visName: VIS_REF_NAME,
    },
    references: [
      {
        name: VIS_REF_NAME,
        id: VIS_ID_1,
      },
    ],
  },
  {
    attributes: {
      originPlugin: ORIGIN_PLUGIN_2,
      pluginResource: {
        type: PLUGIN_RESOURCE_TYPE_2,
        id: PLUGIN_RESOURCE_ID_2,
      },
      visName: VIS_REF_NAME,
    },
    references: [
      {
        name: VIS_REF_NAME,
        id: VIS_ID_1,
      },
    ],
  },
  {
    attributes: {
      originPlugin: ORIGIN_PLUGIN_2,
      pluginResource: {
        type: PLUGIN_RESOURCE_TYPE_2,
        id: PLUGIN_RESOURCE_ID_2,
      },
      visName: VIS_REF_NAME,
    },
    references: [
      {
        name: VIS_REF_NAME,
        id: VIS_ID_2,
      },
    ],
  },
  {
    attributes: {
      originPlugin: ORIGIN_PLUGIN_2,
      pluginResource: {
        type: PLUGIN_RESOURCE_TYPE_2,
        id: PLUGIN_RESOURCE_ID_3,
      },
      visName: VIS_REF_NAME,
    },
    references: [
      {
        name: VIS_REF_NAME,
        id: VIS_ID_1,
      },
    ],
  },
] as Array<SavedObjectsFindResult<AugmentVisSavedObjectAttributes>>;

describe('getAugmentVisSavedObjs()', function () {
  const mockClient = {
    find: jest.fn(),
  };
  it('should return empty arr if no objs found', async function () {
    mockClient.find.mockResolvedValueOnce({
      total: 0,
      page: 1,
      per_page: PER_PAGE,
      saved_objects: [],
    });

    // @ts-ignore
    const response = await getAugmentVisSavedObjects(mockClient, PER_PAGE);
    expect(response.total).toEqual(0);
    expect(response.saved_objects).toHaveLength(0);
  });

  it('should return all augment-vis saved objects', async function () {
    mockClient.find.mockResolvedValueOnce({
      total: 4,
      page: 1,
      per_page: PER_PAGE,
      saved_objects: MULTIPLE_SAVED_OBJS,
    });

    // @ts-ignore
    const response = await getAugmentVisSavedObjects(mockClient, PER_PAGE);
    expect(response.total).toEqual(4);
    expect(response.saved_objects).toHaveLength(4);
    expect(response.saved_objects[0].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_1);
    expect(response.saved_objects[1].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_2);
    expect(response.saved_objects[2].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_2);
    expect(response.saved_objects[3].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_2);
  });

  it('should correctly perform pagination', async function () {
    mockClient.find
      .mockResolvedValueOnce({
        total: 5,
        page: 1,
        per_page: PER_PAGE,
        saved_objects: MULTIPLE_SAVED_OBJS,
      })
      .mockResolvedValueOnce({
        total: 5,
        page: 2,
        per_page: PER_PAGE,
        saved_objects: SINGLE_SAVED_OBJ,
      });

    // @ts-ignore
    const response = await getAugmentVisSavedObjects(mockClient, PER_PAGE);
    expect(response.total).toEqual(5);
    expect(response.saved_objects).toHaveLength(5);
    expect(response.saved_objects[0].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_1);
    expect(response.saved_objects[1].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_2);
    expect(response.saved_objects[2].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_2);
    expect(response.saved_objects[3].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_2);
    expect(response.saved_objects[4].attributes.originPlugin).toEqual(ORIGIN_PLUGIN_1);
  });
});

describe('getStats()', function () {
  it('should return total of 0 and empty mappings on empty response', function () {
    const response = getStats({
      total: 0,
      page: 1,
      per_page: PER_PAGE,
      saved_objects: [],
    });
    expect(response.total_objs).toEqual(0);
    expect(response.obj_breakdown.origin_plugin).toEqual({});
    expect(response.obj_breakdown.plugin_resource_type).toEqual({});
    expect(response.obj_breakdown.plugin_resource_id).toEqual({});
    expect(response.obj_breakdown.visualization_id).toEqual({});
  });

  it('should return correct count and mappings on single-obj response', function () {
    const response = getStats({
      total: 1,
      page: 1,
      per_page: PER_PAGE,
      saved_objects: SINGLE_SAVED_OBJ,
    });
    expect(response.total_objs).toEqual(1);
    expect(response.obj_breakdown.origin_plugin).toEqual({
      [ORIGIN_PLUGIN_1]: 1,
    });
    expect(response.obj_breakdown.plugin_resource_type).toEqual({
      [PLUGIN_RESOURCE_TYPE_1]: 1,
    });
    expect(response.obj_breakdown.plugin_resource_id).toEqual({
      [PLUGIN_RESOURCE_ID_1]: 1,
    });
    expect(response.obj_breakdown.visualization_id).toEqual({
      [VIS_ID_1]: 1,
    });
  });

  it('should return correct count and mappings on multiple-obj response', function () {
    const response = getStats({
      total: MULTIPLE_SAVED_OBJS.length,
      page: 1,
      per_page: PER_PAGE,
      saved_objects: MULTIPLE_SAVED_OBJS,
    });
    expect(response.total_objs).toEqual(4);
    expect(response.obj_breakdown.origin_plugin).toEqual({
      [ORIGIN_PLUGIN_1]: 1,
      [ORIGIN_PLUGIN_2]: 3,
    });
    expect(response.obj_breakdown.plugin_resource_type).toEqual({
      [PLUGIN_RESOURCE_TYPE_1]: 1,
      [PLUGIN_RESOURCE_TYPE_2]: 3,
    });
    expect(response.obj_breakdown.plugin_resource_id).toEqual({
      [PLUGIN_RESOURCE_ID_1]: 1,
      [PLUGIN_RESOURCE_ID_2]: 2,
      [PLUGIN_RESOURCE_ID_3]: 1,
    });
    expect(response.obj_breakdown.visualization_id).toEqual({
      [VIS_ID_1]: 3,
      [VIS_ID_2]: 1,
    });
  });
});
