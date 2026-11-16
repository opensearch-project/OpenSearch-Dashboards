/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory, MemoryHistory } from 'history';
import { useEditorSessionKey } from './use_editor_session_key';

const renderWithHistory = (history: MemoryHistory) =>
  renderHook(() => useEditorSessionKey(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <Router history={history}>{children}</Router>
    ),
  });

describe('useEditorSessionKey', () => {
  let history: MemoryHistory;

  beforeEach(() => {
    history = createMemoryHistory({ initialEntries: ['/#/edit/a'] });
  });

  it('keeps the key on REPLACE (the editor writing its own URL state)', () => {
    const { result } = renderWithHistory(history);
    expect(result.current).toBe(0);

    act(() => history.replace('/#/edit/a?_eq=(x)'));

    expect(result.current).toBe(0);
  });

  it('changes the key on PUSH', () => {
    const { result } = renderWithHistory(history);

    act(() => history.push('/#/edit/b'));

    expect(result.current).toBe(1);
  });

  it('changes the key on back and forward (POP)', () => {
    const { result } = renderWithHistory(history);
    act(() => history.push('/#/edit/b'));

    act(() => history.goBack());
    expect(result.current).toBe(2);

    act(() => history.goForward());
    expect(result.current).toBe(3);
  });

  it('stops listening on unmount', () => {
    const { result, unmount } = renderWithHistory(history);
    unmount();

    act(() => history.push('/#/edit/b'));

    expect(result.current).toBe(0);
  });
});
