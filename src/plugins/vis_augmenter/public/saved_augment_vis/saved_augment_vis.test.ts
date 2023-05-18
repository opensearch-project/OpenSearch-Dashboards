/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayerTypes } from '../types';
import { VisLayerExpressionFn } from '../expressions';
import {
  createSavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
} from './saved_augment_vis';
import { generateAugmentVisSavedObject, getMockAugmentVisSavedObjectClient } from './utils';
import { uiSettingsServiceMock } from '../../../../core/public/mocks';
import { setUISettings } from '../services';
import { PLUGIN_AUGMENTATION_ENABLE_SETTING } from '../../common/constants';
import { ISavedPluginResource } from './types';

const uiSettingsMock = uiSettingsServiceMock.createStartContract();
setUISettings(uiSettingsMock);

describe('SavedObjectLoaderAugmentVis', () => {
  uiSettingsMock.get.mockImplementation((key: string) => {
    return key === PLUGIN_AUGMENTATION_ENABLE_SETTING;
  });

  const fn = {
    type: VisLayerTypes.PointInTimeEvents,
    name: 'test-fn',
    args: {
      testArg: 'test-value',
    },
  } as VisLayerExpressionFn;
  const originPlugin = 'test-plugin';
  const pluginResource = {
    type: 'test-plugin',
    id: 'test-plugin-resource-id',
  };
  const validObj1 = generateAugmentVisSavedObject(
    'valid-obj-id-1',
    fn,
    'test-vis-id',
    originPlugin,
    pluginResource
  );
  const validObj2 = generateAugmentVisSavedObject(
    'valid-obj-id-2',
    fn,
    'test-vis-id',
    originPlugin,
    pluginResource
  );
  const invalidFnTypeObj = generateAugmentVisSavedObject(
    'invalid-fn-obj-id-1',
    {
      ...fn,
      // @ts-ignore
      type: 'invalid-type',
    },
    'test-vis-id',
    originPlugin,
    pluginResource
  );

  const missingFnObj = generateAugmentVisSavedObject(
    'missing-fn-obj-id-1',
    {} as VisLayerExpressionFn,
    'test-vis-id',
    originPlugin,
    pluginResource
  );

  const missingOriginPluginObj = generateAugmentVisSavedObject(
    'missing-origin-plugin-obj-id-1',
    fn,
    'test-vis-id',
    // @ts-ignore
    undefined,
    pluginResource
  );

  const missingPluginResourceTypeObj = generateAugmentVisSavedObject(
    'missing-plugin-resource-type-obj-id-1',
    fn,
    'test-vis-id',
    // @ts-ignore
    originPlugin,
    {
      id: pluginResource.id,
    } as ISavedPluginResource
  );

  const missingPluginResourceIdObj = generateAugmentVisSavedObject(
    'missing-plugin-resource-id-obj-id-1',
    fn,
    'test-vis-id',
    // @ts-ignore
    originPlugin,
    {
      type: pluginResource.type,
    } as ISavedPluginResource
  );

  it('find returns single saved obj', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([validObj1]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.find();
    expect(resp.hits.length).toEqual(1);
    expect(resp.hits[0].id).toEqual('valid-obj-id-1');
    expect(resp.hits[0].error).toEqual(undefined);
  });

  it('find returns multiple saved objs', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([validObj1, validObj2]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.find();
    expect(resp.hits.length).toEqual(2);
    expect(resp.hits[0].id).toEqual('valid-obj-id-1');
    expect(resp.hits[1].id).toEqual('valid-obj-id-2');
    expect(resp.hits[0].error).toEqual(undefined);
    expect(resp.hits[1].error).toEqual(undefined);
  });

  it('find returns empty response', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.find();
    expect(resp.hits.length).toEqual(0);
  });

  it('find does not return objs with errors', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([invalidFnTypeObj]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.find();
    expect(resp.hits.length).toEqual(0);
  });

  it('findAll returns obj with invalid VisLayer fn', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([invalidFnTypeObj]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.findAll();
    expect(resp.hits.length).toEqual(1);
    expect(resp.hits[0].id).toEqual('invalid-fn-obj-id-1');
    expect(resp.hits[0].error).toEqual('Unknown VisLayer expression function type');
  });

  it('findAll returns obj with missing VisLayer fn', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([missingFnObj]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.findAll();
    expect(resp.hits.length).toEqual(1);
    expect(resp.hits[0].id).toEqual('missing-fn-obj-id-1');
    expect(resp.hits[0].error).toEqual(
      'visLayerExpressionFn is missing in augment-vis saved object'
    );
  });

  it('findAll returns obj with missing reference', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([validObj1], false),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.findAll();
    expect(resp.hits.length).toEqual(1);
    expect(resp.hits[0].id).toEqual('valid-obj-id-1');
    expect(resp.hits[0].error).toEqual('visReference is missing in augment-vis saved object');
  });

  it('findAll returns obj with missing originPlugin', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([missingOriginPluginObj]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.findAll();
    expect(resp.hits.length).toEqual(1);
    expect(resp.hits[0].id).toEqual('missing-origin-plugin-obj-id-1');
    expect(resp.hits[0].error).toEqual('originPlugin is missing in augment-vis saved object');
  });

  it('findAll returns obj with missing plugin resource type', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([missingPluginResourceTypeObj]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.findAll();
    expect(resp.hits.length).toEqual(1);
    expect(resp.hits[0].id).toEqual('missing-plugin-resource-type-obj-id-1');
    expect(resp.hits[0].error).toEqual(
      'pluginResource.type is missing in augment-vis saved object'
    );
  });

  it('findAll returns obj with missing plugin resource id', async () => {
    const loader = createSavedAugmentVisLoader({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([missingPluginResourceIdObj]),
    } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    const resp = await loader.findAll();
    expect(resp.hits.length).toEqual(1);
    expect(resp.hits[0].id).toEqual('missing-plugin-resource-id-obj-id-1');
    expect(resp.hits[0].error).toEqual('pluginResource.id is missing in augment-vis saved object');
  });

  it('find returns exception due to setting being disabled', async () => {
    uiSettingsMock.get.mockImplementation((key: string) => {
      return key !== PLUGIN_AUGMENTATION_ENABLE_SETTING;
    });
    const loader = createSavedAugmentVisLoader(({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([]),
    } as unknown) as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    try {
      await loader.find();
    } catch (e) {
      expect(e.message).toBe(
        'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
      );
    }
  });

  it('findAll returns exception due to setting being disabled', async () => {
    uiSettingsMock.get.mockImplementation((key: string) => {
      return key !== PLUGIN_AUGMENTATION_ENABLE_SETTING;
    });
    const loader = createSavedAugmentVisLoader(({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([]),
    } as unknown) as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    try {
      await loader.findAll();
    } catch (e) {
      expect(e.message).toBe(
        'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
      );
    }
  });

  it('get returns exception due to setting being disabled', async () => {
    uiSettingsMock.get.mockImplementation((key: string) => {
      return key !== PLUGIN_AUGMENTATION_ENABLE_SETTING;
    });
    const loader = createSavedAugmentVisLoader(({
      savedObjectsClient: getMockAugmentVisSavedObjectClient([]),
    } as unknown) as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
    try {
      await loader.get();
    } catch (e) {
      expect(e.message).toBe(
        'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
      );
    }
  });
});
