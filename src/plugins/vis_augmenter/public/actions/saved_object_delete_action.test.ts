/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { SavedObjectDeleteAction } from './saved_object_delete_action';
import services from '../services';

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
    getUISettings: () => {
      return {
        get: (config: string) => {
          switch (config) {
            case 'visualization:enablePluginAugmentation':
              return true;
            case 'visualization:enablePluginAugmentation.maxPluginObjects':
              return 10;
            default:
              throw new Error(`Accessing ${config} is not supported in the mock.`);
          }
        },
      };
    },
  };
});

describe('SavedObjectDeleteAction', () => {
  it('is incompatible with invalid types', async () => {
    const action = new SavedObjectDeleteAction();
    const savedObjectId = '1234';
    // @ts-ignore
    expect(await action.isCompatible({ type: null, savedObjectId })).toBe(false);
    // @ts-ignore
    expect(await action.isCompatible({ type: undefined, savedObjectId })).toBe(false);
    expect(await action.isCompatible({ type: '', savedObjectId })).toBe(false);
    expect(await action.isCompatible({ type: 'not-visualization-type', savedObjectId })).toBe(
      false
    );
    expect(await action.isCompatible({ type: 'savedSearch', savedObjectId })).toBe(false);
  });

  it('is incompatible with invalid saved obj ids', async () => {
    const action = new SavedObjectDeleteAction();
    const type = 'visualization';
    // @ts-ignore
    expect(await action.isCompatible({ type, savedObjectId: null })).toBe(false);
    // @ts-ignore
    expect(await action.isCompatible({ type, savedObjectId: undefined })).toBe(false);
    expect(await action.isCompatible({ type, savedObjectId: '' })).toBe(false);
  });

  it('execute throws error if incompatible type', async () => {
    const action = new SavedObjectDeleteAction();
    async function check(type: any, id: any) {
      await action.execute({ type, savedObjectId: id });
    }
    await expect(check(null, '1234')).rejects.toThrow(Error);
  });

  it('execute throws error if incompatible saved obj id', async () => {
    const action = new SavedObjectDeleteAction();
    async function check(type: any, id: any) {
      await action.execute({ type, savedObjectId: id });
    }
    await expect(check('visualization', null)).rejects.toThrow(Error);
  });

  it('execute is successful if valid type and saved obj id', async () => {
    const getLoaderSpy = jest.spyOn(services, 'getSavedAugmentVisLoader');
    const action = new SavedObjectDeleteAction();
    async function check(type: any, id: any) {
      await action.execute({ type, savedObjectId: id });
    }
    await expect(check('visualization', 'test-id')).resolves;
    expect(getLoaderSpy).toHaveBeenCalledTimes(1);
  });

  it('Returns display name', async () => {
    const action = new SavedObjectDeleteAction();
    expect(action.getDisplayName()).toBeDefined();
  });

  it('Returns icon type', async () => {
    const action = new SavedObjectDeleteAction();
    expect(action.getIconType()).toBeDefined();
  });
});
