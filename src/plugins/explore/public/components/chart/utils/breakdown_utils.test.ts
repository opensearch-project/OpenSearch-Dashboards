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

  const mockServices = {
    uiSettings: {
      get: jest.fn().mockReturnValue(true),
    },
  };

  it('should return false when dataset is undefined', () => {
    expect(shouldShowBreakdownSelector(undefined)).toBe(false);
  });

  it('should return false when services is undefined', () => {
    expect(shouldShowBreakdownSelector(mockDataView, undefined)).toBe(false);
  });

  it('should return false when experimental setting is disabled', () => {
    const mockDisabledServices = {
      uiSettings: {
        get: jest.fn().mockReturnValue(false),
      },
    };
    expect(shouldShowBreakdownSelector(mockDataView, mockDisabledServices)).toBe(false);
  });

  it('should return true when dataSourceRef does not exist (default behavior)', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
        } as DataView,
        mockServices
      )
    ).toBe(true);
  });

  it('should return true when dataSourceRef exists but type is missing', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            version: '3.3.0',
          },
        } as any,
        mockServices
      )
    ).toBe(true);
  });

  it('should return true when dataSourceRef exists but version is missing', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
          },
        } as any,
        mockServices
      )
    ).toBe(true);
  });

  it('should return true for OpenSearch version 3.3.0', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
            version: '3.3.0',
          },
        } as any,
        mockServices
      )
    ).toBe(true);
  });

  it('should return true for OpenSearch version greater than 3.3.0', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
            version: '3.4.0',
          },
        } as any,
        mockServices
      )
    ).toBe(true);

    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
            version: '4.0.0',
          },
        } as any,
        mockServices
      )
    ).toBe(true);
  });

  it('should return false for OpenSearch version less than 3.3.0', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
            version: '3.2.0',
          },
        } as any,
        mockServices
      )
    ).toBe(false);

    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
            version: '2.5.0',
          },
        } as any,
        mockServices
      )
    ).toBe(false);
  });

  it('should return false for non-OpenSearch data sources', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'S3',
            version: '8.0.0',
          },
        } as any,
        mockServices
      )
    ).toBe(false);
  });

  it('should handle version strings without patch version', () => {
    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
            version: '3.3',
          },
        } as any,
        mockServices
      )
    ).toBe(true);

    expect(
      shouldShowBreakdownSelector(
        {
          timeFieldName: '@timestamp',
          dataSourceRef: {
            id: 'test-id',
            type: 'OpenSearch',
            version: '3.2',
          },
        } as any,
        mockServices
      )
    ).toBe(false);
  });
});
