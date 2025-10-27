/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { shouldShowBreakdownSelector } from './breakdown_utils';
import { DataView } from '../../../../../data/common';

describe('shouldShowBreakdownSelector', () => {
  const mockDataView = {
    timeFieldName: '@timestamp',
  } as DataView;

  it('should return false when dataView is undefined', () => {
    expect(shouldShowBreakdownSelector(undefined)).toBe(false);
  });

  it('should return false when services is undefined', () => {
    expect(shouldShowBreakdownSelector(mockDataView, undefined)).toBe(false);
  });

  it('should return false when experimental setting is disabled', () => {
    const mockServices = {
      uiSettings: {
        get: jest.fn().mockReturnValue(false),
      },
    };

    expect(shouldShowBreakdownSelector(mockDataView, mockServices)).toBe(false);
  });

  it('should return true when dataView exists and experimental setting is enabled', () => {
    const mockServices = {
      uiSettings: {
        get: jest.fn().mockReturnValue(true),
      },
    };

    expect(shouldShowBreakdownSelector(mockDataView, mockServices)).toBe(true);
  });
});
