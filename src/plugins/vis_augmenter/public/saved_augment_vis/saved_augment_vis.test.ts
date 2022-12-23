/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayerExpressionFn, VisLayerTypes } from '../types';
import {
  createSavedAugmentVisLoader,
  SavedObjectOpenSearchDashboardsServicesWithAugmentVis,
} from './saved_augment_vis';
import { generateAugmentVisSavedObject, getMockAugmentVisSavedObjectClient } from './utils';

describe('SavedObjectLoaderAugmentVis', () => {
  const fn = {
    type: VisLayerTypes.PointInTimeEvents,
    name: 'test-fn',
    args: {
      testArg: 'test-value',
    },
  } as VisLayerExpressionFn;
  const validObj1 = generateAugmentVisSavedObject('valid-obj-id-1', fn, 'test-vis-id');
  const validObj2 = generateAugmentVisSavedObject('valid-obj-id-2', fn, 'test-vis-id');
  const invalidFnTypeObj = generateAugmentVisSavedObject(
    'invalid-fn-obj-id-1',
    {
      ...fn,
      // @ts-ignore
      type: 'invalid-type',
    },
    'test-vis-id'
  );

  const missingFnObj = generateAugmentVisSavedObject(
    'missing-fn-obj-id-1',
    {} as VisLayerExpressionFn,
    'test-vis-id'
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
});
