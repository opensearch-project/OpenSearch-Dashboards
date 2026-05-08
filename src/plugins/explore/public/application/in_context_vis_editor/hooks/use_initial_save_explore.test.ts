/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook } from '@testing-library/react';
import { useInitialSaveExplore } from './use_initial_save_explore';
import { useSavedExplore } from '../../../application/utils/hooks/use_saved_explore';
import { useCurrentExploreId } from './use_explore_id';

jest.mock('../query_builder/query_builder', () => ({}));
jest.mock('../../../application/utils/hooks/use_saved_explore', () => ({
  useSavedExplore: jest.fn(),
}));
jest.mock('./use_explore_id', () => ({
  useCurrentExploreId: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  (useCurrentExploreId as jest.Mock).mockReturnValue('explore-1');
});

describe('useInitialSaveExplore', () => {
  it('returns loading state', () => {
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: undefined,
      error: undefined,
      isLoading: true,
    });

    const { result } = renderHook(() => useInitialSaveExplore());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.savedExplore).toBeUndefined();
    expect(result.current.savedQueryState).toBeUndefined();
    expect(result.current.savedVisConfig).toBeUndefined();
  });

  it('returns error state', () => {
    const error = new Error('not found');
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: undefined,
      error,
      isLoading: false,
    });

    const { result } = renderHook(() => useInitialSaveExplore());

    expect(result.current.error).toBe(error);
    expect(result.current.savedQueryState).toBeUndefined();
    expect(result.current.savedVisConfig).toBeUndefined();
  });

  it('returns undefined savedQueryState when searchSourceJSON is missing', () => {
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '1', title: 'My Explore' },
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useInitialSaveExplore());

    expect(result.current.savedQueryState).toBeUndefined();
  });

  it('parses savedQueryState from searchSourceJSON', () => {
    const query = { query: 'source=logs', language: 'PPL' };
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: {
        id: '1',
        title: 'My Explore',
        kibanaSavedObjectMeta: {
          searchSourceJSON: JSON.stringify({ query }),
        },
      },
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useInitialSaveExplore());

    expect(result.current.savedQueryState).toEqual(query);
  });

  it('returns undefined savedVisConfig when visualization is missing', () => {
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: { id: '1', title: 'My Explore' },
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useInitialSaveExplore());

    expect(result.current.savedVisConfig).toBeUndefined();
  });

  it('parses savedVisConfig from visualization field', () => {
    const visConfig = { chartType: 'bar', params: { color: 'red' }, axesMapping: {} };
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: {
        id: '1',
        title: 'My Explore',
        visualization: JSON.stringify(visConfig),
      },
      error: undefined,
      isLoading: false,
    });

    const { result } = renderHook(() => useInitialSaveExplore());

    expect(result.current.savedVisConfig).toEqual(visConfig);
  });

  it('passes exploreId to useSavedExplore', () => {
    (useCurrentExploreId as jest.Mock).mockReturnValue('my-id');
    (useSavedExplore as jest.Mock).mockReturnValue({
      savedExplore: undefined,
      error: undefined,
      isLoading: false,
    });

    renderHook(() => useInitialSaveExplore());

    expect(useSavedExplore).toHaveBeenCalledWith('my-id');
  });
});
