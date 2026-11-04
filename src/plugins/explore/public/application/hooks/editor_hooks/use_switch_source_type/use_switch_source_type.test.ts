/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { ExploreFlavor } from '../../../../../common';
import { getServices } from '../../../../services/services';
import { onEditorRunActionCreator } from '../../../utils/state_management/actions/query_editor/on_editor_run/on_editor_run';
import { useClearEditors } from '../use_clear_editors';
import { useEditorFocus } from '../use_editor_focus';
import { useSwitchSourceType } from './use_switch_source_type';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: jest.fn(),
}));
jest.mock('../../../../services/services', () => ({ getServices: jest.fn() }));
jest.mock('../../../../services/source_type_registry', () => ({
  OPENSEARCH_SOURCE_TYPE_ID: 'opensearch',
  getSourceTypeRegistry: () => ({ getLabel: (sourceType: { id: string }) => sourceType.id }),
}));
jest.mock(
  '../../../utils/state_management/actions/query_editor/on_editor_run/on_editor_run',
  () => ({ onEditorRunActionCreator: jest.fn((_services, text) => ({ type: 'run', text })) })
);
jest.mock('../use_clear_editors', () => ({ useClearEditors: jest.fn() }));
jest.mock('../use_editor_focus', () => ({ useEditorFocus: jest.fn() }));

describe('useSwitchSourceType', () => {
  const dispatch = jest.fn();
  const clearEditors = jest.fn();
  const focusOnEditor = jest.fn();
  const setUserQueryLanguage = jest.fn();
  const cacheDataset = jest.fn();
  const getType = jest.fn();
  const addWarning = jest.fn();
  const addError = jest.fn();
  let currentQuery: Record<string, unknown>;
  const setQuery = jest.fn((query: Record<string, unknown>) => {
    currentQuery = { ...currentQuery, ...query };
  });
  const getInitialQueryByDataset = jest.fn((dataset: { language?: string }) => ({
    query: 'source = default',
    language: dataset.language ?? 'PPL',
    dataset,
  }));
  const storage = { get: jest.fn() };
  const services = {
    storage,
    data: {
      query: {
        queryString: {
          getQuery: () => currentQuery,
          setQuery,
          getInitialQueryByDataset,
          getLanguageService: () => ({ setUserQueryLanguage }),
          getDatasetService: () => ({ cacheDataset, getType }),
        },
      },
    },
    notifications: { toasts: { addWarning, addError } },
  };
  const dataset = { id: 'my-dataset', title: 'My dataset', type: 'MY_SOURCE', language: 'MY_LANG' };
  const sourceType = (id: string, resolved: unknown) =>
    ({ id, resolveDefaultDataset: jest.fn().mockResolvedValue(resolved) }) as any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    currentQuery = {
      query: 'old query',
      language: 'PROMQL',
      queryOptions: { maxDataPoints: 100 },
    };
    (useDispatch as jest.Mock).mockReturnValue(dispatch);
    (useClearEditors as jest.Mock).mockReturnValue(clearEditors);
    (useEditorFocus as jest.Mock).mockReturnValue(focusOnEditor);
    (getServices as jest.Mock).mockReturnValue(services);
    cacheDataset.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("opens the source's default dataset with an empty editor in the dataset's language", async () => {
    const source = sourceType('my-source', dataset);
    const { result } = renderHook(() => useSwitchSourceType(ExploreFlavor.Metrics));

    await act(() => result.current(source));

    expect(source.resolveDefaultDataset).toHaveBeenCalledWith({
      data: services.data,
      flavor: ExploreFlavor.Metrics,
    });
    // Cached without the storage service, as the dataset picker does.
    expect(cacheDataset).toHaveBeenCalledWith(dataset, {
      data: services.data,
      notifications: services.notifications,
    });
    expect(currentQuery).toEqual({
      query: '',
      language: 'MY_LANG',
      dataset,
      queryOptions: undefined,
    });
    expect(setUserQueryLanguage).toHaveBeenCalledWith('MY_LANG');
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: expect.stringContaining('setQueryWithHistory'),
        payload: expect.objectContaining({ query: '', language: 'MY_LANG', dataset }),
      })
    );
    expect(clearEditors).toHaveBeenCalled();
    expect(focusOnEditor).not.toHaveBeenCalled();
    expect(onEditorRunActionCreator).not.toHaveBeenCalled();

    act(() => {
      jest.runAllTimers();
    });
    expect(focusOnEditor).toHaveBeenCalled();
    expect(onEditorRunActionCreator).toHaveBeenCalledWith(services, '');
    expect(dispatch).toHaveBeenCalledWith({ type: 'run', text: '' });
  });

  it('opens the dataset but does not run it when its type requires an explicit Run', async () => {
    const explicit = { ...dataset, type: 'EXPLICIT_RUN_TYPE' };
    getType.mockImplementation((type: string) =>
      type === 'EXPLICIT_RUN_TYPE' ? { meta: { requiresExplicitRun: true } } : undefined
    );
    const { result } = renderHook(() => useSwitchSourceType(ExploreFlavor.Logs));

    await act(() => result.current(sourceType('explicit-source', explicit)));
    act(() => {
      jest.runAllTimers();
    });

    expect(currentQuery).toEqual(expect.objectContaining({ query: '', dataset: explicit }));
    expect(clearEditors).toHaveBeenCalled();
    expect(focusOnEditor).toHaveBeenCalled();
    expect(onEditorRunActionCreator).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: 'run' }));
  });

  it('still switches when the dataset cannot be cached', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const failure = new Error('no dataView');
    cacheDataset.mockRejectedValue(failure);
    const { result } = renderHook(() => useSwitchSourceType(ExploreFlavor.Metrics));

    await act(() => result.current(sourceType('my-source', dataset)));

    expect(warn).toHaveBeenCalledWith(
      'Could not cache the my-source dataset "my-dataset"',
      failure
    );
    expect(currentQuery).toEqual(expect.objectContaining({ language: 'MY_LANG', dataset }));
    expect(setUserQueryLanguage).toHaveBeenCalledWith('MY_LANG');
    warn.mockRestore();
  });

  it('opens an empty PromQL picker when the built-in source has no Prometheus connection', async () => {
    const { result } = renderHook(() => useSwitchSourceType(ExploreFlavor.Metrics));

    await act(() => result.current(sourceType('opensearch', undefined)));

    expect(currentQuery).toEqual({
      query: '',
      language: 'PROMQL',
      dataset: undefined,
      queryOptions: undefined,
    });
    expect(cacheDataset).not.toHaveBeenCalled();
    expect(setUserQueryLanguage).toHaveBeenCalledWith('PROMQL');
    expect(addWarning).not.toHaveBeenCalled();
    act(() => {
      jest.runAllTimers();
    });
    expect(onEditorRunActionCreator).toHaveBeenCalledWith(services, '');
  });

  it('warns and keeps the current query when a source has no dataset', async () => {
    const { result } = renderHook(() => useSwitchSourceType(ExploreFlavor.Logs));

    await act(() => result.current(sourceType('my-source', undefined)));

    expect(addWarning).toHaveBeenCalledWith({ title: 'No my-source dataset found to query' });
    expect(setQuery).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
    act(() => {
      jest.runAllTimers();
    });
    expect(onEditorRunActionCreator).not.toHaveBeenCalled();
  });

  it('shows an error toast when the default dataset cannot be resolved', async () => {
    const failure = new Error('lookup failed');
    const source = {
      id: 'my-source',
      resolveDefaultDataset: jest.fn().mockRejectedValue(failure),
    } as any;
    const { result } = renderHook(() => useSwitchSourceType(ExploreFlavor.Metrics));

    await act(() => result.current(source));

    expect(addError).toHaveBeenCalledWith(failure, { title: 'Could not switch source type' });
    expect(setQuery).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it('cancels the pending focus and run on unmount', async () => {
    const { result, unmount } = renderHook(() => useSwitchSourceType(ExploreFlavor.Metrics));

    await act(() => result.current(sourceType('my-source', dataset)));
    unmount();
    jest.runAllTimers();

    expect(focusOnEditor).not.toHaveBeenCalled();
    expect(onEditorRunActionCreator).not.toHaveBeenCalled();
  });
});
