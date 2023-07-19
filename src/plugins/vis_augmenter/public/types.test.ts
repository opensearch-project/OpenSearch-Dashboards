/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  VisLayerTypes,
  isPointInTimeEventsVisLayer,
  isValidVisLayer,
  isVisLayerWithError,
} from './types';
import { createVisLayer } from './mocks';

describe('isPointInTimeEventsVisLayer()', function () {
  it('should return false if type does not match', function () {
    const visLayer = createVisLayer('unknown-vis-layer-type');
    expect(isPointInTimeEventsVisLayer(visLayer)).toBe(false);
  });

  it('should return true if type matches', function () {
    const visLayer = createVisLayer(VisLayerTypes.PointInTimeEvents);
    expect(isPointInTimeEventsVisLayer(visLayer)).toBe(true);
  });
});

describe('isValidVisLayer()', function () {
  it('should return false if no valid type', function () {
    const visLayer = createVisLayer('unknown-vis-layer-type');
    expect(isValidVisLayer(visLayer)).toBe(false);
  });

  it('should return true if type matches', function () {
    const visLayer = createVisLayer(VisLayerTypes.PointInTimeEvents);
    expect(isValidVisLayer(visLayer)).toBe(true);
  });
});

describe('isVisLayerWithError()', function () {
  it('should return false if no error', function () {
    const visLayer = createVisLayer('unknown-vis-layer-type', false);
    expect(isVisLayerWithError(visLayer)).toBe(false);
  });

  it('should return true if error', function () {
    const visLayer = createVisLayer(VisLayerTypes.PointInTimeEvents, true);
    expect(isVisLayerWithError(visLayer)).toBe(true);
  });
});
