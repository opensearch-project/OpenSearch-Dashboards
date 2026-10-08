/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { useUnassignedAssets } from './use_unassigned_assets';
import { countUnassignedAssets } from './utils';

// Mock only countUnassignedAssets so the hook test stays focused on the hook; the real
// getMigratableAssetTypes must still run so we can prove which type set is passed downstream.
jest.mock('./utils', () => {
  const actual = jest.requireActual('./utils');
  return {
    ...actual,
    countUnassignedAssets: jest.fn(),
  };
});

const ALLOWED_TYPES_URL = '/api/opensearch-dashboards/management/saved_objects/_allowed_types';

const countUnassignedAssetsMock = countUnassignedAssets as jest.Mock;

const setup = () => {
  const http = coreMock.createStart().http;
  http.get = jest.fn();
  const client = { find: jest.fn() } as any;
  return { http, client };
};

describe('useUnassignedAssets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing and issues no requests when disabled', async () => {
    const { http, client } = setup();

    const { result } = renderHook(() => useUnassignedAssets(http, client, false));

    expect(result.current.total).toBe(0);
    // A disabled hook must expose no leftover types, so the wizard can never open on stale metadata.
    expect(result.current.types).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(http.get).not.toHaveBeenCalled();
    expect(countUnassignedAssetsMock).not.toHaveBeenCalled();
  });

  it('fetches _allowed_types then resolves the total and types when enabled', async () => {
    const { http, client } = setup();
    (http.get as jest.Mock).mockResolvedValue({ types: ['dashboard', 'visualization'] });
    countUnassignedAssetsMock.mockResolvedValue(7);

    const { result } = renderHook(() => useUnassignedAssets(http, client, true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(http.get).toHaveBeenCalledWith(ALLOWED_TYPES_URL);
    expect(result.current.total).toBe(7);
    // The migratable types are handed to the wizard so opening it costs no further metadata request.
    expect(result.current.types).toEqual(['dashboard', 'visualization']);
    expect(result.current.error).toBeUndefined();
  });

  /**
   * The landing page must not pay for the asset list just to decide whether the entry point appears,
   * so the hook counts and never fetches objects.
   */
  it('counts without ever fetching the asset list', async () => {
    const { http, client } = setup();
    (http.get as jest.Mock).mockResolvedValue({ types: ['dashboard'] });
    countUnassignedAssetsMock.mockResolvedValue(3);

    const { result } = renderHook(() => useUnassignedAssets(http, client, true));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(countUnassignedAssetsMock).toHaveBeenCalledTimes(1);
    expect(result.current).not.toHaveProperty('assets');
  });

  it('exposes a type set excluding config, homepage, data-source and data-connection', async () => {
    const { http, client } = setup();
    (http.get as jest.Mock).mockResolvedValue({
      types: ['config', 'homepage', 'data-source', 'data-connection', 'dashboard', 'visualization'],
    });
    countUnassignedAssetsMock.mockResolvedValue(0);

    const { result } = renderHook(() => useUnassignedAssets(http, client, true));

    await waitFor(() => expect(countUnassignedAssetsMock).toHaveBeenCalled());

    const [passedClient, passedTypes] = countUnassignedAssetsMock.mock.calls[0];
    expect(passedClient).toBe(client);
    expect(passedTypes).toEqual(['dashboard', 'visualization']);
    expect(passedTypes).not.toContain('config');
    expect(passedTypes).not.toContain('homepage');
    expect(passedTypes).not.toContain('data-source');
    expect(passedTypes).not.toContain('data-connection');

    await waitFor(() => expect(result.current.loading).toBe(false));
    // The exposed types match exactly what was counted -- the wizard reuses this set verbatim.
    expect(result.current.types).toEqual(['dashboard', 'visualization']);
  });

  it('sets error and resets total and types when _allowed_types rejects', async () => {
    const { http, client } = setup();
    (http.get as jest.Mock).mockRejectedValue({ body: { message: 'allowed types failed' } });

    const { result } = renderHook(() => useUnassignedAssets(http, client, true));

    await waitFor(() => expect(result.current.error).toBe('allowed types failed'));
    expect(result.current.total).toBe(0);
    expect(result.current.types).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(countUnassignedAssetsMock).not.toHaveBeenCalled();
  });

  it('sets error and resets total and types when the count rejects', async () => {
    const { http, client } = setup();
    (http.get as jest.Mock).mockResolvedValue({ types: ['dashboard'] });
    countUnassignedAssetsMock.mockRejectedValue(new Error('count failed'));

    const { result } = renderHook(() => useUnassignedAssets(http, client, true));

    await waitFor(() => expect(result.current.error).toBe('count failed'));
    expect(result.current.total).toBe(0);
    expect(result.current.types).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('re-issues the lookup and clears a previous error on refresh', async () => {
    const { http, client } = setup();
    // First run fails.
    (http.get as jest.Mock).mockRejectedValueOnce({ body: { message: 'transient failure' } });

    const { result } = renderHook(() => useUnassignedAssets(http, client, true));

    await waitFor(() => expect(result.current.error).toBe('transient failure'));

    // Subsequent runs succeed.
    (http.get as jest.Mock).mockResolvedValue({ types: ['dashboard'] });
    countUnassignedAssetsMock.mockResolvedValue(2);

    await act(async () => {
      result.current.refresh();
    });

    await waitFor(() => expect(result.current.error).toBeUndefined());
    expect(result.current.total).toBe(2);
    expect(result.current.types).toEqual(['dashboard']);
    // _allowed_types was fetched again (initial failed run + successful refresh).
    expect((http.get as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(2);
  });
});
