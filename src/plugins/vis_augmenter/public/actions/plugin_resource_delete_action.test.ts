/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createPointInTimeEventsVisLayer } from '../mocks';
import { generateAugmentVisSavedObject } from '../saved_augment_vis';
import { PluginResourceDeleteAction } from './plugin_resource_delete_action';

jest.mock('src/plugins/vis_augmenter/public/services.ts', () => {
  return {
    getSavedAugmentVisLoader: () => {
      return {
        delete: () => {},
        findAll: () => {
          return {
            hits: [],
          };
        },
      };
    },
  };
});

const sampleSavedObj = generateAugmentVisSavedObject(
  'test-id',
  {
    type: 'PointInTimeEvents',
    name: 'test-fn-name',
    args: {},
  },
  'test-vis-id',
  'test-origin-plugin',
  {
    type: 'test-resource-type',
    id: 'test-resource-id',
  }
);

const sampleVisLayer = createPointInTimeEventsVisLayer();

describe('SavedObjectDeleteAction', () => {
  it('is incompatible with invalid saved obj list', async () => {
    const action = new PluginResourceDeleteAction();
    const visLayers = [sampleVisLayer];
    // @ts-ignore
    expect(await action.isCompatible({ savedObjs: null, visLayers })).toBe(false);
    // @ts-ignore
    expect(await action.isCompatible({ savedObjs: undefined, visLayers })).toBe(false);
    expect(await action.isCompatible({ savedObjs: [], visLayers })).toBe(false);
  });

  it('is incompatible with invalid vislayer list', async () => {
    const action = new PluginResourceDeleteAction();
    const savedObjs = [sampleSavedObj];
    // @ts-ignore
    expect(await action.isCompatible({ savedObjs, visLayers: null })).toBe(false);
    // @ts-ignore
    expect(await action.isCompatible({ savedObjs, visLayers: undefined })).toBe(false);
    expect(await action.isCompatible({ savedObjs, visLayers: [] })).toBe(false);
  });

  it('execute throws error if incompatible saved objs list', async () => {
    const action = new PluginResourceDeleteAction();
    async function check(savedObjs: any, visLayers: any) {
      await action.execute({ savedObjs, visLayers });
    }
    await expect(check(null, [sampleVisLayer])).rejects.toThrow(Error);
  });

  it('execute throws error if incompatible vis layer list', async () => {
    const action = new PluginResourceDeleteAction();
    async function check(savedObjs: any, visLayers: any) {
      await action.execute({ savedObjs, visLayers });
    }
    await expect(check([sampleSavedObj], null)).rejects.toThrow(Error);
  });

  it('execute is successful if valid saved obj and vis layer lists', async () => {
    const action = new PluginResourceDeleteAction();
    async function check(savedObjs: any, visLayers: any) {
      await action.execute({ savedObjs, visLayers });
    }
    await expect(check([sampleSavedObj], [sampleVisLayer])).resolves;
  });

  it('Returns display name', async () => {
    const action = new PluginResourceDeleteAction();
    expect(action.getDisplayName()).toBeDefined();
  });

  it('Returns icon type', async () => {
    const action = new PluginResourceDeleteAction();
    expect(action.getIconType()).toBeDefined();
  });
});
