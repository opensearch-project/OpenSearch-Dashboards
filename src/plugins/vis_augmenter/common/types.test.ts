/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayerTypes, VisLayer, isPointInTimeEventsVisLayer, isValidVisLayer } from './types';

describe('isPointInTimeEventsVisLayer()', function () {
  it('should return false if type does not match', function () {
    const visLayer = ({
      type: 'incorrect-type',
      name: 'visLayerName',
      field1: 'value1',
      field2: 'value2',
    } as unknown) as VisLayer;
    expect(isPointInTimeEventsVisLayer(visLayer)).toBe(false);
  });

  it('should return true if type matches', function () {
    const visLayer = {
      type: VisLayerTypes.PointInTimeEvents,
      name: 'testName',
      events: [
        {
          timestamp: 123,
          resourceId: 'testId',
          resourceName: 'testName',
        },
      ],
    } as VisLayer;
    expect(isPointInTimeEventsVisLayer(visLayer)).toBe(true);
  });
});

describe('isValidVisLayer()', function () {
  it('should return false if no valid type', function () {
    const visLayer = ({
      type: 'incorrect-type',
      name: 'visLayerName',
      field1: 'value1',
      field2: 'value2',
    } as unknown) as VisLayer;
    expect(isValidVisLayer(visLayer)).toBe(false);
  });

  it('should return true if type matches', function () {
    const visLayer = {
      type: VisLayerTypes.PointInTimeEvents,
      name: 'testName',
      events: [
        {
          timestamp: 123,
          resourceId: 'testId',
          resourceName: 'testName',
        },
      ],
    } as VisLayer;
    expect(isValidVisLayer(visLayer)).toBe(true);
  });
});
