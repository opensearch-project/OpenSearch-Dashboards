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
} from './utils';
import {
  createSavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
  getMockAugmentVisSavedObjectClient,
  generateAugmentVisSavedObject,
  ISavedAugmentVis,
  VisLayerExpressionFn,
  VisLayerTypes,
} from '../';
import { generateVisLayer } from './';

describe('utils', () => {
  // TODO: redo / update this test suite when eligibility is finalized.
  // Tracked in https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3268
  describe('isEligibleForVisLayers', () => {
    it('vis is ineligible with invalid type', async () => {
      const vis = ({
        params: {
          type: 'not-line',
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(vis)).toEqual(false);
    });
    it('vis is eligible with valid type', async () => {
      const vis = ({
        params: {
          type: 'line',
        },
      } as unknown) as Vis;
      expect(isEligibleForVisLayers(vis)).toEqual(true);
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
      expect(err?.stack).toMatchInlineSnapshot(`
        "-----resource-type-1-----
        ID: 1234
        Message: \\"uh-oh!\\""
      `);
    });
    it('multiple VisLayers with errors - returns formatted error', async () => {
      const err = getAnyErrors([errorLayer1, errorLayer2], 'test-vis-title');
      expect(err).not.toEqual(undefined);
      expect(err?.stack).toMatchInlineSnapshot(
        `-----resource-type-1-----\nID: 1234\nMessage: "uh-oh!"\n\n\n` +
          `-----resource-type-2-----\nID: 5678\nMessage: "oh no something terrible has happened :("`,
        `
        "-----resource-type-1-----
        ID: 1234
        Message: \\"uh-oh!\\"


        -----resource-type-2-----
        ID: 5678
        Message: \\"oh no something terrible has happened :(\\""
      `
      );
    });
    it('multiple VisLayers with errors of same type - returns formatted error', async () => {
      const err = getAnyErrors([errorLayer1, errorLayer3], 'test-vis-title');
      expect(err).not.toEqual(undefined);
      expect(err?.stack).toMatchInlineSnapshot(
        `-----resource-type-1-----\nID: 1234\nMessage: "uh-oh!"\n\n` + `ID: abcd\nMessage: "oops!"`,
        `
        "-----resource-type-1-----
        ID: 1234
        Message: \\"uh-oh!\\"

        ID: abcd
        Message: \\"oops!\\""
      `
      );
    });
    it('VisLayers with and without error - returns formatted error', async () => {
      const err = getAnyErrors([noErrorLayer1, errorLayer1], 'test-vis-title');
      expect(err).not.toEqual(undefined);
      expect(err?.stack).toMatchInlineSnapshot(`
        "-----resource-type-1-----
        ID: 1234
        Message: \\"uh-oh!\\""
      `);
    });
  });
});
