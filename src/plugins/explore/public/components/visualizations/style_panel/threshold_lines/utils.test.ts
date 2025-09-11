/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { createThresholdLayer } from './utils';
import { ThresholdLineStyle } from '../../types';

describe('createThresholdLayer', () => {
  const mockThresholds = [
    {
      id: '1',
      color: '#54B399',
      show: true,
      style: ThresholdLineStyle.Full,
      value: 42,
      width: 2,
      name: 'Test Threshold',
    },
    {
      id: '2',
      color: '#DB0000',
      show: false,
      style: ThresholdLineStyle.Dashed,
      value: 100,
      width: 1,
      name: 'Hidden Threshold',
    },
  ];

  it('should return null if thresholdLines is undefined', () => {
    expect(createThresholdLayer(undefined)).toBeNull();
  });

  it('should return null if no active thresholds (show: false)', () => {
    const hiddenThresholds = mockThresholds.map((t) => ({ ...t, show: false }));
    expect(createThresholdLayer(hiddenThresholds)).toBeNull();
  });
});
