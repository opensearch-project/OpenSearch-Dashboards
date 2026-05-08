/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useCurrentExploreId } from './use_explore_id';
import { useLocation } from 'react-router-dom';

jest.mock('react-router-dom', () => ({
  useLocation: jest.fn(),
}));

describe('useCurrentExploreId', () => {
  const mockUseLocation = useLocation as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns id when match', () => {
    mockUseLocation.mockReturnValue({
      hash: '#/edit/explore-123',
    });

    const { result } = renderHook(() => useCurrentExploreId());

    expect(result.current).toBe('explore-123');
  });

  it('returns undefined when hash does not match pattern', () => {
    mockUseLocation.mockReturnValue({
      hash: '#/view/explore-123',
    });

    const { result } = renderHook(() => useCurrentExploreId());

    expect(result.current).toBeUndefined();
  });

  it('returns undefined for root edit path without id', () => {
    mockUseLocation.mockReturnValue({
      hash: '#/edit/',
    });

    const { result } = renderHook(() => useCurrentExploreId());

    expect(result.current).toBeUndefined();
  });
});
