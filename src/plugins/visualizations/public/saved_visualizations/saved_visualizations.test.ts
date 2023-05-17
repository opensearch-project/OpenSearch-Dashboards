/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { getMockSavedVisLoader } from './mocks';
import {
  generateAugmentVisSavedObject,
  VisLayerTypes,
  VisLayerExpressionFn,
  AugmentVisSavedObject,
} from '../../../vis_augmenter/public';

describe('SavedObjectLoaderVisualize', () => {
  describe('delete', () => {
    const fn = {
      type: VisLayerTypes.PointInTimeEvents,
      name: 'test-fn',
      args: {
        testArg: 'test-value',
      },
    } as VisLayerExpressionFn;
    const originPlugin = 'test-plugin';
    const pluginResource = {
      type: 'test-plugin-resource',
      id: 'test-plugin-resource-id',
    };
    const testVisId1 = 'vis-id-1';
    const testVisId2 = 'vis-id-2';
    const testAugmentVisId1 = 'augment-vis-id-1';
    const testAugmentVisId2 = 'augment-vis-id-2';

    const augmentVisObj1 = generateAugmentVisSavedObject(
      testAugmentVisId1,
      fn,
      testVisId1,
      originPlugin,
      pluginResource
    );
    const augmentVisObj2 = generateAugmentVisSavedObject(
      testAugmentVisId2,
      fn,
      testVisId1,
      originPlugin,
      pluginResource
    );
    const augmentVisObj3 = generateAugmentVisSavedObject(
      testAugmentVisId2,
      fn,
      testVisId2,
      originPlugin,
      pluginResource
    );

    it('no augment-vis saved objs', async () => {
      const mockAugmentVisDelete = jest.fn();
      const mockVisDelete = jest.fn();
      const augmentVisObjs = [] as AugmentVisSavedObject[];
      const visIds = [testVisId1];
      await getMockSavedVisLoader(mockAugmentVisDelete, mockVisDelete, augmentVisObjs).delete(
        visIds
      );

      expect(mockAugmentVisDelete).toHaveBeenCalledTimes(0);
      expect(mockVisDelete).toHaveBeenCalledTimes(1);
    });
    it('1 vis saved obj, 1 matching augment-vis saved obj', async () => {
      const mockAugmentVisDelete = jest.fn();
      const mockVisDelete = jest.fn();
      const augmentVisObjs = [augmentVisObj1];
      const visIds = [testVisId1];
      await getMockSavedVisLoader(mockAugmentVisDelete, mockVisDelete, augmentVisObjs).delete(
        visIds
      );

      expect(mockAugmentVisDelete).toHaveBeenCalledTimes(1);
      expect(mockVisDelete).toHaveBeenCalledTimes(1);
    });
    it('1 vis saved obj, multiple matching augment-vis saved objs', async () => {
      const mockAugmentVisDelete = jest.fn();
      const mockVisDelete = jest.fn();
      const augmentVisObjs = [augmentVisObj1, augmentVisObj2];
      const visIds = [testVisId1];
      await getMockSavedVisLoader(mockAugmentVisDelete, mockVisDelete, augmentVisObjs).delete(
        visIds
      );

      expect(mockAugmentVisDelete).toHaveBeenCalledTimes(2);
      expect(mockVisDelete).toHaveBeenCalledTimes(1);
    });
    it('multiple vis saved objs, multiple matching augment-vis saved objs', async () => {
      const mockAugmentVisDelete = jest.fn();
      const mockVisDelete = jest.fn();
      const augmentVisObjs = [augmentVisObj1, augmentVisObj2, augmentVisObj3];
      const visIds = [testVisId1, testVisId2];
      await getMockSavedVisLoader(mockAugmentVisDelete, mockVisDelete, augmentVisObjs).delete(
        visIds
      );

      expect(mockAugmentVisDelete).toHaveBeenCalledTimes(3);
      expect(mockVisDelete).toHaveBeenCalledTimes(2);
    });
    it('no matching augment-vis saved objs', async () => {
      const mockAugmentVisDelete = jest.fn();
      const mockVisDelete = jest.fn();
      const augmentVisObjs = [augmentVisObj1];
      const visIds = [testVisId2];
      await getMockSavedVisLoader(mockAugmentVisDelete, mockVisDelete, augmentVisObjs).delete(
        visIds
      );

      expect(mockAugmentVisDelete).toHaveBeenCalledTimes(0);
      expect(mockVisDelete).toHaveBeenCalledTimes(1);
    });
    it('partial matching augment-vis saved objs', async () => {
      const mockAugmentVisDelete = jest.fn();
      const mockVisDelete = jest.fn();
      const augmentVisObjs = [augmentVisObj1, augmentVisObj3];
      const visIds = [testVisId2];
      await getMockSavedVisLoader(mockAugmentVisDelete, mockVisDelete, augmentVisObjs).delete(
        visIds
      );

      expect(mockAugmentVisDelete).toHaveBeenCalledTimes(1);
      expect(mockVisDelete).toHaveBeenCalledTimes(1);
    });
  });
});
