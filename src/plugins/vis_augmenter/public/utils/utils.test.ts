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
  generateVisLayer,
  VisLayerTypes,
  VisLayerExpressionFn,
  PLUGIN_AUGMENTATION_ENABLE_SETTING,
} from '../';
import { AggConfigs, AggTypesRegistryStart, IndexPattern } from '../../../data/common';
import { mockAggTypesRegistry } from '../../../data/common/search/aggs/test_helpers';
import { uiSettingsServiceMock } from '../../../../core/public/mocks';
import { setUISettings } from '../services';

describe('utils', () => {
  const uiSettingsMock = uiSettingsServiceMock.createStartContract();
  setUISettings(uiSettingsMock);
  beforeEach(() => {
    uiSettingsMock.get.mockImplementation((key: string) => {
      return key === PLUGIN_AUGMENTATION_ENABLE_SETTING;
    });
  });
  describe('isEligibleForVisLayers', () => {
    const validConfigStates = [
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
    const stubIndexPatternWithFields = {
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
    };
    const typesRegistry: AggTypesRegistryStart = mockAggTypesRegistry();
    const aggs = new AggConfigs(stubIndexPatternWithFields as IndexPattern, validConfigStates, {
      typesRegistry,
    });
    const validVis = ({
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
        aggs,
      },
    } as unknown) as Vis;
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
          aggs,
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
      const invalidAggs = new AggConfigs(
        stubIndexPatternWithFields as IndexPattern,
        invalidConfigStates,
        {
          typesRegistry,
        }
      );
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
        ...validConfigStates,
        {
          enabled: true,
          type: 'dot',
          params: {},
          schema: 'radius',
        },
      ];
      const invalidAggs = new AggConfigs(
        stubIndexPatternWithFields as IndexPattern,
        invalidConfigStates,
        {
          typesRegistry,
        }
      );
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
      const invalidAggs = new AggConfigs(
        stubIndexPatternWithFields as IndexPattern,
        invalidConfigStates,
        {
          typesRegistry,
        }
      );
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
          aggs,
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
          aggs,
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
      const badAggs = new AggConfigs(stubIndexPatternWithFields as IndexPattern, badConfigStates, {
        typesRegistry,
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
          aggs,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(invalidVis)).toEqual(false);
    });
    it('vis is ineligible with valid type and disabled setting', async () => {
      uiSettingsMock.get.mockImplementation((key: string) => {
        return key !== PLUGIN_AUGMENTATION_ENABLE_SETTING;
      });
      expect(isEligibleForVisLayers(validVis)).toEqual(false);
    });
    it('vis is eligible with valid type', async () => {
      expect(isEligibleForVisLayers(validVis)).toEqual(true);
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
    const visId1 = 'test-vis-id-1';
    const visId2 = 'test-vis-id-2';
    const visId3 = 'test-vis-id-3';
    const obj1 = generateAugmentVisSavedObject('valid-obj-id-1', fn, visId1);
    const obj2 = generateAugmentVisSavedObject('valid-obj-id-2', fn, visId1);
    const obj3 = generateAugmentVisSavedObject('valid-obj-id-3', fn, visId2);

    it('returns no matching saved objs with filtering', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2, obj3]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId3, loader)).length).toEqual(0);
    });
    it('returns no matching saved objs when client returns empty list', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader)).length).toEqual(0);
    });
    it('returns one matching saved obj', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader)).length).toEqual(1);
    });
    it('returns multiple matching saved objs without filtering', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader)).length).toEqual(2);
    });
    it('returns multiple matching saved objs with filtering', async () => {
      const loader = createSavedAugmentVisLoader({
        savedObjectsClient: getMockAugmentVisSavedObjectClient([obj1, obj2, obj3]),
      } as SavedObjectOpenSearchDashboardsServicesWithAugmentVis);
      expect((await getAugmentVisSavedObjs(visId1, loader)).length).toEqual(2);
    });
  });

  describe('buildPipelineFromAugmentVisSavedObjs', () => {
    const obj1 = {
      title: 'obj1',
      pluginResourceId: 'obj-1-resource-id',
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
      pluginResourceId: 'obj-2-resource-id',
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
    const noErrorLayer1 = generateVisLayer(VisLayerTypes.PointInTimeEvents, false);
    const noErrorLayer2 = generateVisLayer(VisLayerTypes.PointInTimeEvents, false);
    const errorLayer1 = generateVisLayer(VisLayerTypes.PointInTimeEvents, true, 'uh-oh!', {
      type: 'resource-type-1',
      id: '1234',
      name: 'resource-1',
    });
    const errorLayer2 = generateVisLayer(
      VisLayerTypes.PointInTimeEvents,
      true,
      'oh no something terrible has happened :(',
      {
        type: 'resource-type-2',
        id: '5678',
        name: 'resource-2',
      }
    );
    const errorLayer3 = generateVisLayer(VisLayerTypes.PointInTimeEvents, true, 'oops!', {
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
});
