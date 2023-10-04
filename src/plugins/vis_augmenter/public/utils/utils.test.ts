/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vis } from '../../../visualizations/public';
import {
  buildPipelineFromAugmentVisSavedObjs,
  getAugmentVisSavedObjs,
  getAnyErrors,
  isEligibleForVisLayers,
  createSavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
  getMockAugmentVisSavedObjectClient,
  generateAugmentVisSavedObject,
  ISavedAugmentVis,
  VisLayerTypes,
  VisLayerExpressionFn,
  cleanupStaleObjects,
  VisLayer,
  PluginResource,
  VisLayerErrorTypes,
  SavedObjectLoaderAugmentVis,
} from '../';
import { PLUGIN_AUGMENTATION_ENABLE_SETTING } from '../../common/constants';
import { AggConfigs } from '../../../data/common';
import { uiSettingsServiceMock } from '../../../../core/public/mocks';
import { setUISettings } from '../services';
import {
  STUB_INDEX_PATTERN_WITH_FIELDS,
  TYPES_REGISTRY,
  VALID_AGGS,
  VALID_CONFIG_STATES,
  VALID_VIS,
  createPointInTimeEventsVisLayer,
  createVisLayer,
} from '../mocks';

describe('utils', () => {
  const uiSettingsMock = uiSettingsServiceMock.createStartContract();
  setUISettings(uiSettingsMock);
  beforeEach(() => {
    uiSettingsMock.get.mockImplementation((key: string) => {
      return key === PLUGIN_AUGMENTATION_ENABLE_SETTING;
    });
  });
  describe('isEligibleForVisLayers', () => {
    it('vis is ineligible with invalid non-line type', async () => {
      const vis = ({
        params: {
          type: 'not-line',
          seriesParams: [],
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
      expect(isEligibleForVisLayers(vis)).toEqual(false);
    });
    it('vis is ineligible with no date_histogram', async () => {
      const invalidConfigStates = [
        {
          enabled: true,
          type: 'histogram',
          params: {},
        },
        {
          enabled: true,
          type: 'metrics',
          params: {},
        },
      ];
      const invalidAggs = new AggConfigs(STUB_INDEX_PATTERN_WITH_FIELDS, invalidConfigStates, {
        typesRegistry: TYPES_REGISTRY,
      });
      const vis = ({
        params: {
          type: 'line',
          seriesParams: [],
        },
        data: {
          invalidAggs,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(vis)).toEqual(false);
    });
    it('vis is ineligible with invalid aggs counts', async () => {
      const invalidConfigStates = [
        ...VALID_CONFIG_STATES,
        {
          enabled: true,
          type: 'dot',
          params: {},
          schema: 'radius',
        },
      ];
      const invalidAggs = new AggConfigs(STUB_INDEX_PATTERN_WITH_FIELDS, invalidConfigStates, {
        typesRegistry: TYPES_REGISTRY,
      });
      const vis = ({
        params: {
          type: 'line',
          seriesParams: [],
        },
        data: {
          invalidAggs,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(vis)).toEqual(false);
    });
    it('vis is ineligible with no metric aggs', async () => {
      const invalidConfigStates = [
        {
          enabled: true,
          type: 'date_histogram',
          params: {},
        },
      ];
      const invalidAggs = new AggConfigs(STUB_INDEX_PATTERN_WITH_FIELDS, invalidConfigStates, {
        typesRegistry: TYPES_REGISTRY,
      });
      const vis = ({
        params: {
          type: 'line',
          seriesParams: [],
        },
        data: {
          invalidAggs,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(vis)).toEqual(false);
    });
    it('vis is ineligible with series param is not line type', async () => {
      const vis = ({
        params: {
          type: 'line',
          seriesParams: [
            {
              type: 'area',
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
      expect(isEligibleForVisLayers(vis)).toEqual(false);
    });
    it('vis is ineligible with series param not all being line type', async () => {
      const vis = ({
        params: {
          type: 'line',
          seriesParams: [
            {
              type: 'area',
            },
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
      expect(isEligibleForVisLayers(vis)).toEqual(false);
    });
    it('vis is ineligible with invalid x-axis due to no segment aggregation', async () => {
      const badConfigStates = [
        {
          enabled: true,
          type: 'max',
          params: {},
          schema: 'metric',
        },
        {
          enabled: true,
          type: 'max',
          params: {},
          schema: 'metric',
        },
      ];
      const badAggs = new AggConfigs(STUB_INDEX_PATTERN_WITH_FIELDS, badConfigStates, {
        typesRegistry: TYPES_REGISTRY,
      });
      const invalidVis = ({
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
          badAggs,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(invalidVis)).toEqual(false);
    });
    it('vis is ineligible with xaxis not on bottom', async () => {
      const invalidVis = ({
        params: {
          type: 'line',
          seriesParams: [
            {
              type: 'line',
            },
          ],
          categoryAxes: [
            {
              position: 'top',
            },
          ],
        },
        data: {
          aggs: VALID_AGGS,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(invalidVis)).toEqual(false);
    });
    it('vis is ineligible with no seriesParams', async () => {
      const invalidVis = ({
        params: {
          type: 'pie',
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
      expect(isEligibleForVisLayers(invalidVis)).toEqual(false);
    });
    it('vis is ineligible with valid type and disabled setting', async () => {
      uiSettingsMock.get.mockImplementation((key: string) => {
        return key !== PLUGIN_AUGMENTATION_ENABLE_SETTING;
      });
      expect(isEligibleForVisLayers(VALID_VIS)).toEqual(false);
    });
    it('vis is eligible with valid type', async () => {
      expect(isEligibleForVisLayers(VALID_VIS)).toEqual(true);
    });
  });

  describe('getAugmentVisSavedObjs', () => {
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
    const visId1 = 'test-vis-id-1';
    const visId2 = 'test-vis-id-2';
    const visId3 = 'test-vis-id-3';
    const obj1 = generateAugmentVisSavedObject(
      'valid-obj-id-1',
      fn,
      visId1,
      originPlugin,
      pluginResource
    );
    const obj2 = generateAugmentVisSavedObject(
      'valid-obj-id-2',
      fn,
      visId1,
      originPlugin,
      pluginResource
    );
    const obj3 = generateAugmentVisSavedObject(
      'valid-obj-id-3',
      fn,
      visId2,
      originPlugin,
      pluginResource
    );

    it('returns no matching saved objs when client returns empty list', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader)).length).toEqual(0);
    });
    it('throws error when feature setting is disabled', async () => {
      uiSettingsMock.get.mockImplementation((key: string) => {
        return false;
      });
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      try {
        await getAugmentVisSavedObjs(visId1, loader);
      } catch (e: any) {
        expect(
          e.message.includes(
            'Visualization augmentation is disabled, please enable visualization:enablePluginAugmentation.'
          )
        );
      }
    });
    it('returns no matching saved objs when loader throws error', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: {
          findAll: () => {
            return new Error();
          },
        },
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId3, loader)).length).toEqual(0);
    });
    it('returns one matching saved obj', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader)).length).toEqual(1);
    });
    it('returns multiple matching saved objs', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader)).length).toEqual(2);
    });
    it('undefined plugin resource list has no effect', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader, undefined, undefined)).length).toEqual(
        2
      );
    });
    it('empty plugin resource list has no effect', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader, undefined, [])).length).toEqual(2);
    });
    it('empty / undefined plugin resource list passes correct findAll() params', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      loader.findAll = jest.fn().mockImplementation(loader.findAll);
      expect((await getAugmentVisSavedObjs(visId1, loader, undefined, [])).length).toEqual(2);
      expect(loader.findAll).toHaveBeenCalledWith(
        '',
        100,
        undefined,
        {
          type: 'visualization',
          id: visId1 as string,
        },
        undefined
      );
    });
    it('single plugin resource is propagated to findAll()', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      loader.findAll = jest.fn().mockImplementation(loader.findAll);
      expect(
        (await getAugmentVisSavedObjs(visId1, loader, undefined, ['resource-1'])).length
      ).toEqual(2);
      expect(loader.findAll).toHaveBeenCalledWith(
        'resource-1',
        100,
        undefined,
        {
          type: 'visualization',
          id: visId1 as string,
        },
        ['pluginResource.id']
      );
    });
    it('multiple plugin resources are propagated to findAll()', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      loader.findAll = jest.fn().mockImplementation(loader.findAll);
      expect(
        (await getAugmentVisSavedObjs(visId1, loader, undefined, ['resource-1', 'resource-2']))
          .length
      ).toEqual(2);
      expect(loader.findAll).toHaveBeenCalledWith(
        'resource-1|resource-2',
        100,
        undefined,
        {
          type: 'visualization',
          id: visId1 as string,
        },
        ['pluginResource.id']
      );
    });
  });

  describe('buildPipelineFromAugmentVisSavedObjs', () => {
    const obj1 = {
      title: 'obj1',
      originPlugin: 'test-plugin',
      pluginResource: {
        type: 'test-resource-type',
        id: 'obj-1-resource-id',
      },
      visLayerExpressionFn: {
        type: VisLayerTypes.PointInTimeEvents,
        name: 'fn-1',
        args: {
          arg1: 'value-1',
        },
      },
    } as ISavedAugmentVis;
    const obj2 = {
      title: 'obj2',
      originPlugin: 'test-plugin',
      pluginResource: {
        type: 'test-resource-type',
        id: 'obj-2-resource-id',
      },
      visLayerExpressionFn: {
        type: VisLayerTypes.PointInTimeEvents,
        name: 'fn-2',
        args: {
          arg2: 'value-2',
        },
      },
    } as ISavedAugmentVis;
    it('catches error with empty array', async () => {
      try {
        buildPipelineFromAugmentVisSavedObjs([]);
      } catch (e: any) {
        expect(
          e.message.includes(
            'Expression function from augment-vis saved objects could not be generated'
          )
        );
      }
    });
    it('builds with one saved obj', async () => {
      const str = buildPipelineFromAugmentVisSavedObjs([obj1]);
      expect(str).toEqual('fn-1 arg1="value-1"');
    });
    it('builds with multiple saved objs', async () => {
      const str = buildPipelineFromAugmentVisSavedObjs([obj1, obj2]);
      expect(str).toEqual(`fn-1 arg1="value-1"\n| fn-2 arg2="value-2"`);
    });
  });

  describe('getAnyErrors', () => {
    const noErrorLayer1 = createVisLayer(VisLayerTypes.PointInTimeEvents, false);
    const noErrorLayer2 = createVisLayer(VisLayerTypes.PointInTimeEvents, false);
    const errorLayer1 = createVisLayer(VisLayerTypes.PointInTimeEvents, true, 'uh-oh!', {
      type: 'resource-type-1',
      id: '1234',
      name: 'resource-1',
    });
    const errorLayer2 = createVisLayer(
      VisLayerTypes.PointInTimeEvents,
      true,
      'oh no something terrible has happened :(',
      {
        type: 'resource-type-2',
        id: '5678',
        name: 'resource-2',
      }
    );
    const errorLayer3 = createVisLayer(VisLayerTypes.PointInTimeEvents, true, 'oops!', {
      type: 'resource-type-1',
      id: 'abcd',
      name: 'resource-3',
    });

    it('empty array - returns undefined', async () => {
      const err = getAnyErrors([], 'title-vis-title');
      expect(err).toEqual(undefined);
    });
    it('single VisLayer no errors - returns undefined', async () => {
      const err = getAnyErrors([noErrorLayer1], 'test-vis-title');
      expect(err).toEqual(undefined);
    });
    it('multiple VisLayers no errors - returns undefined', async () => {
      const err = getAnyErrors([noErrorLayer1, noErrorLayer2], 'test-vis-title');
      expect(err).toEqual(undefined);
    });
    it('single VisLayer with error - returns formatted error', async () => {
      const err = getAnyErrors([errorLayer1], 'test-vis-title');
      expect(err).not.toEqual(undefined);
      expect(err?.stack).toStrictEqual(`-----resource-type-1-----\nID: 1234\nMessage: "uh-oh!"`);
    });
    it('multiple VisLayers with errors - returns formatted error', async () => {
      const err = getAnyErrors([errorLayer1, errorLayer2], 'test-vis-title');
      expect(err).not.toEqual(undefined);
      expect(err?.stack).toStrictEqual(
        `-----resource-type-1-----\nID: 1234\nMessage: "uh-oh!"\n\n\n` +
          `-----resource-type-2-----\nID: 5678\nMessage: "oh no something terrible has happened :("`
      );
    });
    it('multiple VisLayers with errors of same type - returns formatted error', async () => {
      const err = getAnyErrors([errorLayer1, errorLayer3], 'test-vis-title');
      expect(err).not.toEqual(undefined);
      expect(err?.stack).toStrictEqual(
        `-----resource-type-1-----\nID: 1234\nMessage: "uh-oh!"\n\n` + `ID: abcd\nMessage: "oops!"`
      );
    });
    it('VisLayers with and without error - returns formatted error', async () => {
      const err = getAnyErrors([noErrorLayer1, errorLayer1], 'test-vis-title');
      expect(err).not.toEqual(undefined);
      expect(err?.stack).toStrictEqual(`-----resource-type-1-----\nID: 1234\nMessage: "uh-oh!"`);
    });
  });

  describe('cleanupStaleObjects', () => {
    const fn = {
      type: VisLayerTypes.PointInTimeEvents,
      name: 'test-fn',
      args: {
        testArg: 'test-value',
      },
    } as VisLayerExpressionFn;
    const originPlugin = 'test-plugin';
    const resourceId1 = 'resource-1';
    const resourceId2 = 'resource-2';
    const resourceType1 = 'resource-type-1';
    const augmentVisObj1 = generateAugmentVisSavedObject('id-1', fn, 'vis-id-1', originPlugin, {
      type: resourceType1,
      id: resourceId1,
    });
    const augmentVisObj2 = generateAugmentVisSavedObject('id-2', fn, 'vis-id-1', originPlugin, {
      type: resourceType1,
      id: resourceId2,
    });
    const resource1 = {
      type: 'test-resource-type-1',
      id: resourceId1,
      name: 'resource-1',
      urlPath: 'test-path',
    } as PluginResource;
    const resource2 = {
      type: 'test-resource-type-1',
      id: resourceId2,
      name: 'resource-2',
      urlPath: 'test-path',
    } as PluginResource;
    const validVisLayer1 = createPointInTimeEventsVisLayer(originPlugin, resource1, 1, false);
    const staleVisLayer1 = {
      ...createPointInTimeEventsVisLayer(originPlugin, resource1, 0, true),
      error: {
        type: VisLayerErrorTypes.RESOURCE_DELETED,
        message: 'resource is deleted',
      },
    };
    const staleVisLayer2 = {
      ...createPointInTimeEventsVisLayer(originPlugin, resource2, 0, true),
      error: {
        type: VisLayerErrorTypes.RESOURCE_DELETED,
        message: 'resource is deleted',
      },
    };

    it('no augment-vis objs, no vislayers', async () => {
      const mockDeleteFn = jest.fn();
      const augmentVisObjs = [] as ISavedAugmentVis[];
      const visLayers = [] as VisLayer[];
      const augmentVisLoader = createSavedAugmentVisLoader({
        savedObjectsClient: {
          ...getMockAugmentVisSavedObjectClient(augmentVisObjs),
          delete: mockDeleteFn,
        },
      } as any) as SavedObjectLoaderAugmentVis;

      cleanupStaleObjects(augmentVisObjs, visLayers, augmentVisLoader);

      expect(mockDeleteFn).toHaveBeenCalledTimes(0);
    });
    it('no stale vislayers', async () => {
      const mockDeleteFn = jest.fn();
      const augmentVisObjs = [augmentVisObj1];
      const visLayers = [validVisLayer1];
      const augmentVisLoader = createSavedAugmentVisLoader({
        savedObjectsClient: {
          ...getMockAugmentVisSavedObjectClient(augmentVisObjs),
          delete: mockDeleteFn,
        },
      } as any) as SavedObjectLoaderAugmentVis;

      cleanupStaleObjects(augmentVisObjs, visLayers, augmentVisLoader);

      expect(mockDeleteFn).toHaveBeenCalledTimes(0);
    });
    it('1 stale vislayer', async () => {
      const mockDeleteFn = jest.fn();
      const augmentVisObjs = [augmentVisObj1];
      const visLayers = [staleVisLayer1];
      const augmentVisLoader = createSavedAugmentVisLoader({
        savedObjectsClient: {
          ...getMockAugmentVisSavedObjectClient(augmentVisObjs),
          delete: mockDeleteFn,
        },
      } as any) as SavedObjectLoaderAugmentVis;

      cleanupStaleObjects(augmentVisObjs, visLayers, augmentVisLoader);

      expect(mockDeleteFn).toHaveBeenCalledTimes(1);
    });
    it('multiple stale vislayers', async () => {
      const mockDeleteFn = jest.fn();
      const augmentVisObjs = [augmentVisObj1, augmentVisObj2];
      const visLayers = [staleVisLayer1, staleVisLayer2];
      const augmentVisLoader = createSavedAugmentVisLoader({
        savedObjectsClient: {
          ...getMockAugmentVisSavedObjectClient(augmentVisObjs),
          delete: mockDeleteFn,
        },
      } as any) as SavedObjectLoaderAugmentVis;

      cleanupStaleObjects(augmentVisObjs, visLayers, augmentVisLoader);

      expect(mockDeleteFn).toHaveBeenCalledTimes(2);
    });
    it('stale and valid vislayers', async () => {
      const mockDeleteFn = jest.fn();
      const augmentVisObjs = [augmentVisObj1, augmentVisObj2];
      const visLayers = [validVisLayer1, staleVisLayer2];
      const augmentVisLoader = createSavedAugmentVisLoader({
        savedObjectsClient: {
          ...getMockAugmentVisSavedObjectClient(augmentVisObjs),
          delete: mockDeleteFn,
        },
      } as any) as SavedObjectLoaderAugmentVis;

      cleanupStaleObjects(augmentVisObjs, visLayers, augmentVisLoader);

      expect(mockDeleteFn).toHaveBeenCalledTimes(1);
    });
  });
});
