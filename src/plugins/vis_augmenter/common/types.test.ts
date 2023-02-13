/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayerTypes, VisLayer, isPointInTimeEventsVisLayer, isValidVisLayer } from './types';

const generateVisLayer = (type: any): VisLayer => {
  return {
    type,
    originPlugin: 'test-plugin',
    pluginResource: {
      type: 'test-resource-type',
      id: 'test-resource-id',
      name: 'test-resource-name',
      urlPath: 'test-resource-url-path',
    },
  };
};

describe('isPointInTimeEventsVisLayer()', function () {
  it('should return false if type does not match', function () {
    const visLayer = generateVisLayer('unknown-vis-layer-type');
    expect(isPointInTimeEventsVisLayer(visLayer)).toBe(false);
  });

  it('should return true if type matches', function () {
    const visLayer = generateVisLayer(VisLayerTypes.PointInTimeEvents);
    expect(isPointInTimeEventsVisLayer(visLayer)).toBe(true);
  });
});

describe('isValidVisLayer()', function () {
  it('should return false if no valid type', function () {
    const visLayer = generateVisLayer('unknown-vis-layer-type');
    expect(isValidVisLayer(visLayer)).toBe(false);
  });

  it('should return true if type matches', function () {
    const visLayer = generateVisLayer(VisLayerTypes.PointInTimeEvents);
    expect(isValidVisLayer(visLayer)).toBe(true);
  });
});
