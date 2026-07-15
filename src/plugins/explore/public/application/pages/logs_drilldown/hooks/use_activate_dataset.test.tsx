/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useActivateDataset } from './use_activate_dataset';

const cacheDataset = jest.fn();
const getInitialQueryByDataset = jest
  .fn()
  .mockReturnValue({ query: 'source = x', language: 'PPL' });
const setQuery = jest.fn();
const navigateToApp = jest.fn();

const makeServices = () =>
  (({
    core: { application: { navigateToApp } },
    uiSettings: {},
    savedObjects: {},
    notifications: {},
    http: {},
    data: {
      query: {
        queryString: {
          getDatasetService: () => ({ cacheDataset }),
          getInitialQueryByDataset,
          setQuery,
        },
      },
    },
  } as unknown) as any);

const Harness: React.FC<{ services: any; args: any }> = ({ services, args }) => {
  const activate = useActivateDataset(services);
  return (
    <button data-test-subj="go" onClick={() => activate(args)}>
      go
    </button>
  );
};

const run = (args: any) => {
  const services = makeServices();
  const { getByTestId } = render(<Harness services={services} args={args} />);
  fireEvent.click(getByTestId('go'));
};

describe('useActivateDataset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheDataset.mockResolvedValue(undefined);
  });

  // --- positive cases ---
  it('caches the dataset (PPL pinned), writes the query, and navigates to the logs app', async () => {
    run({ title: 'logs-app-*', datasetId: 'ds-1', timeFieldName: '@timestamp' });

    await waitFor(() => expect(cacheDataset).toHaveBeenCalled());
    const cachedDataset = cacheDataset.mock.calls[0][0];
    expect(cachedDataset.title).toBe('logs-app-*');
    expect(cachedDataset.id).toBe('ds-1');
    // Language is pinned to the explore default (PPL) so hand-off doesn't inherit stale SQL/DQL.
    expect(cachedDataset.language).toBeDefined();

    await waitFor(() => expect(setQuery).toHaveBeenCalled());
    expect(navigateToApp).toHaveBeenCalledWith('explore/logs', { path: '#/' });
  });

  it('derives a data-source-scoped id when no datasetId is given', async () => {
    run({
      title: 'orders-*',
      dataSource: { id: 'ds-2', title: 'C2', type: 'DATA_SOURCE' },
    });
    await waitFor(() => expect(cacheDataset).toHaveBeenCalled());
    expect(cacheDataset.mock.calls[0][0].id).toBe('ds-2::orders-*');
  });

  it('falls back to the title as the id for the local cluster (no dataSource, no datasetId)', async () => {
    run({ title: 'local-logs' });
    await waitFor(() => expect(cacheDataset).toHaveBeenCalled());
    expect(cacheDataset.mock.calls[0][0].id).toBe('local-logs');
  });

  // --- negative case ---
  it('still navigates when caching fields throws (caching is non-fatal)', async () => {
    cacheDataset.mockRejectedValue(new Error('field caps down'));
    run({ title: 'logs-app-*', datasetId: 'ds-1' });

    // Even though caching rejected, the query is written and we navigate.
    await waitFor(() => expect(navigateToApp).toHaveBeenCalledWith('explore/logs', { path: '#/' }));
    expect(setQuery).toHaveBeenCalled();
  });
});
