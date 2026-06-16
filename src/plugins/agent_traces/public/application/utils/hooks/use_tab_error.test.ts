/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useTabError } from './use_tab_error';
import { TabDefinition } from '../../../services/tab_registry/tab_registry_service';
import { defaultPrepareQueryString } from '../state_management/actions/query_actions';
import { selectQueryStatusMap, selectSort } from '../state_management/selectors';

// Mock dependencies
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('../state_management/actions/query_actions', () => ({
  defaultPrepareQueryString: jest.fn(),
}));

jest.mock('../state_management/selectors', () => ({
  selectQueryStatusMap: jest.fn(),
  selectSort: jest.fn(),
}));

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockDefaultPrepareQueryString = defaultPrepareQueryString as jest.MockedFunction<
  typeof defaultPrepareQueryString
>;
const mockSelectQueryStatusMap = selectQueryStatusMap as jest.MockedFunction<
  typeof selectQueryStatusMap
>;
const mockSelectSort = selectSort as jest.MockedFunction<typeof selectSort>;

describe('useTabError', () => {
  const mockQuery = {
    query: 'SELECT * FROM logs',
    language: 'SQL',
  };

  const mockTabDefinition: TabDefinition = {
    id: 'test-tab',
    label: 'Test Tab',
    component: () => null,
    flavor: ['logs'] as any,
    supportedLanguages: ['SQL'],
  };

  const mockError = {
    statusCode: 400,
    error: 'Bad Request',
    message: {
      reason: 'Test error',
      details: 'Test error details',
      type: 'test_error',
    },
    originalErrorMessage: 'Original error message',
  };

  const mockSort = [['timestamp', 'desc']] as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDefaultPrepareQueryString.mockReturnValue('default-cache-key');
    mockSelectQueryStatusMap.mockReturnValue({});
    mockSelectSort.mockReturnValue(mockSort);
  });

  it('returns null when registryTab is undefined', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryStatusMap) return {};
      if (selector === selectSort) return mockSort;
      return mockQuery; // state.query
    });

    const { result } = renderHook(() => useTabError(undefined));

    expect(result.current).toBeNull();
  });

  it('returns error from queryStatusMap when tab has error', () => {
    const cacheKey = 'test-cache-key';
    mockDefaultPrepareQueryString.mockReturnValue(cacheKey);

    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryStatusMap) {
        return {
          [cacheKey]: { error: mockError },
        };
      }
      if (selector === selectSort) return mockSort;
      return mockQuery; // state.query
    });

    const { result } = renderHook(() => useTabError(mockTabDefinition));

    expect(result.current).toEqual(mockError);
    expect(mockDefaultPrepareQueryString).toHaveBeenCalledWith(mockQuery, mockSort);
  });

  it('returns null when queryStatusMap has no error for the tab', () => {
    const cacheKey = 'test-cache-key';
    mockDefaultPrepareQueryString.mockReturnValue(cacheKey);

    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryStatusMap) {
        return {
          [cacheKey]: { error: null },
        };
      }
      if (selector === selectSort) return mockSort;
      return mockQuery; // state.query
    });

    const { result } = renderHook(() => useTabError(mockTabDefinition));

    expect(result.current).toBeNull();
  });

  it('uses tab prepareQuery function when provided', () => {
    const customPrepareQuery = jest.fn().mockReturnValue('custom-cache-key');
    const tabWithCustomQuery = {
      ...mockTabDefinition,
      prepareQuery: customPrepareQuery,
    };

    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectQueryStatusMap) {
        return {
          'custom-cache-key': { error: mockError },
        };
      }
      if (selector === selectSort) return mockSort;
      return mockQuery; // state.query
    });

    const { result } = renderHook(() => useTabError(tabWithCustomQuery));

    expect(result.current).toEqual(mockError);
    expect(customPrepareQuery).toHaveBeenCalledWith(mockQuery, mockSort);
    expect(mockDefaultPrepareQueryString).not.toHaveBeenCalled();
  });
});
