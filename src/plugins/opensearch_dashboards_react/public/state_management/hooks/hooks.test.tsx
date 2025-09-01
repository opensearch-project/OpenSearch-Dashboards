/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { PluginStoreProvider } from '../context/plugin_store_context';
import { useAction } from './use_actions';
import { useSelector } from './use_selector';
import { usePluginKeys } from './use_plugin_keys';
import { Store } from '../store';
import { TestActions, TestSelectors, TestState } from './mocks';
import { BehaviorSubject } from 'rxjs';
import { waitFor } from '@testing-library/react';

function setupStore(initialValue = 0) {
  const store = new Store();
  const state$ = new BehaviorSubject<TestState>({ value: initialValue });
  const actions = new TestActions(state$);
  const selectors = new TestSelectors(state$);
  store.registerService('testPlugin', selectors, actions);
  return { store, actions, selectors, state$ };
}

describe('state_management hooks', () => {
  it('usePluginKeys returns registered plugin keys', () => {
    const { store } = setupStore();
    const wrapper = ({ children }: any) => (
      <PluginStoreProvider store={store}>{children}</PluginStoreProvider>
    );
    const { result } = renderHook(() => usePluginKeys(), { wrapper });
    expect(result.current).toContain('testPlugin');
  });

  it('useAction returns actions and can update state', () => {
    const { store, state$ } = setupStore();
    const wrapper = ({ children }: any) => (
      <PluginStoreProvider store={store}>{children}</PluginStoreProvider>
    );
    const { result } = renderHook(() => useAction<TestState>('testPlugin'), { wrapper });
    expect(result.current).toBeInstanceOf(TestActions);
    act(() => {
      (result.current as TestActions).increment();
    });
    expect(state$.getValue().value).toBe(1);
  });

  it('useSelector returns selected state and updates on change', async () => {
    const { store, actions } = setupStore();
    const wrapper = ({ children }: any) => (
      <PluginStoreProvider store={store}>{children}</PluginStoreProvider>
    );
    const { result } = renderHook(
      () => useSelector<TestState, number>('testPlugin', (state) => state.value),
      { wrapper }
    );
    expect(result.current).toBe(0);
    act(() => {
      actions.increment();
    });
    await waitFor(() => {
      expect(result.current).toBe(1);
    });
  });
});
