/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vis, VislibDimensions } from '../../../visualizations/public';
import {
  buildPipelineFromAugmentVisSavedObjs,
  getAugmentVisSavedObjs,
  isEligibleForVisLayers,
} from './utils';
import { VisLayerTypes, ISavedAugmentVis, VisLayerExpressionFn } from '../types';
import {
  createSavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
  getMockAugmentVisSavedObjectClient,
  generateAugmentVisSavedObject,
} from '../saved_augment_vis';
import { AggConfigs, AggTypesRegistryStart } from '../../../data/common/search/aggs';
import { stubIndexPatternWithFields } from '../../../data/common/index_patterns/index_pattern.stub';
import { IndexPattern } from '../../../data/common/index_patterns/index_patterns';
import { mockAggTypesRegistry } from '../../../data/common/search/aggs/test_helpers';

describe('utils', () => {
  describe('isEligibleForVisLayers', () => {
    const validDimensions = {
      x: {
        params: {
          bounds: {
            min: '2023-03-22T21:55:12.455Z',
            max: '2023-03-23T21:55:12.455Z',
          },
        },
        label: 'order_date per 30 minutes',
      },
    } as VislibDimensions;
    const configStates = [
      {
        enabled: true,
        type: 'histogram',
        params: {},
      },
      {
        enabled: true,
        type: 'date_histogram',
        params: {},
      },
    ];
    const typesRegistry: AggTypesRegistryStart = mockAggTypesRegistry();
    const aggs = new AggConfigs(stubIndexPatternWithFields as IndexPattern, configStates, {
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
        },
        data: {
          aggs,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(vis, validDimensions)).toEqual(false);
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
      expect(isEligibleForVisLayers(vis, validDimensions)).toEqual(false);
    });
    it('vis is ineligible with invalid aggs counts', async () => {
      const invalidConfigStates = [
        {
          enabled: true,
          type: 'date_histogram',
          params: {},
        },
        {
          enabled: true,
          type: 'date_histogram',
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
      expect(isEligibleForVisLayers(vis, validDimensions)).toEqual(false);
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
        },
        data: {
          aggs,
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(vis, validDimensions)).toEqual(false);
    });
    it('vis is eligible with valid type', async () => {
      expect(isEligibleForVisLayers(validVis, validDimensions)).toEqual(true);
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
});
