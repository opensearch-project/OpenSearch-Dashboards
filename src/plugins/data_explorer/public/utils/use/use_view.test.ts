/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, renderHook } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../common';
import { useTypedDispatch, useTypedSelector } from '../state_management';
import { useView } from './use_view';

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

jest.mock('../state_management', () => ({
  useTypedDispatch: jest.fn(),
  useTypedSelector: jest.fn(),
}));

describe('useView', () => {
  const setActiveNavLink = jest.fn();
  const dispatch = jest.fn();
  const views = {
    discover: { id: 'discover', activeNavLinkId: 'discover' },
    'view-b': { id: 'view-b', activeNavLinkId: 'view-b-nav' },
    'view-without-nav-link': { id: 'view-without-nav-link' },
  };
  let appId: string;

  beforeEach(() => {
    jest.clearAllMocks();
    appId = 'discover';
    (useParams as jest.Mock).mockImplementation(() => ({ appId }));
    (useTypedSelector as jest.Mock).mockReturnValue(undefined);
    (useTypedDispatch as jest.Mock).mockReturnValue(dispatch);
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: {
        chrome: { setActiveNavLink },
        viewRegistry: {
          get: jest.fn((id: keyof typeof views) => views[id]),
        },
      },
    });
  });

  it('updates the active nav link when the route view changes without a host remount', () => {
    const { rerender, unmount } = renderHook(() => useView());

    expect(setActiveNavLink).toHaveBeenLastCalledWith('discover', PLUGIN_ID);

    act(() => {
      appId = 'view-b';
      rerender();
    });
    expect(setActiveNavLink).toHaveBeenLastCalledWith('view-b-nav', PLUGIN_ID);

    act(() => {
      appId = 'view-without-nav-link';
      rerender();
    });
    expect(setActiveNavLink).toHaveBeenLastCalledWith(undefined, PLUGIN_ID);

    act(() => {
      appId = 'unknown';
      rerender();
    });
    expect(setActiveNavLink).toHaveBeenLastCalledWith(undefined, PLUGIN_ID);

    const callsBeforeUnmount = setActiveNavLink.mock.calls.length;
    unmount();
    expect(setActiveNavLink).toHaveBeenCalledTimes(callsBeforeUnmount);
  });
});
