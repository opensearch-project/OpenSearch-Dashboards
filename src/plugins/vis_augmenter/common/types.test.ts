/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { VisLayer, isPointInTimeEventsVisLayer } from './types';

describe('isPointInTimeEventsVisLayer()', function () {
  it('should return false if no events field', function () {
    const visLayer = {
      id: 'visLayerId',
      name: 'visLayerName',
      field1: 'value1',
      field2: 'value2',
    } as VisLayer;
    expect(isPointInTimeEventsVisLayer(visLayer)).toBe(false);
  });

  it('should return true if events field exists', function () {
    const visLayer = {
      id: 'testId',
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
