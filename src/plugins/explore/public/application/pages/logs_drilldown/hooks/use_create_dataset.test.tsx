/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useCreateDataset } from './use_create_dataset';

// Capture the props passed to the create-flow UI so the test can drive its callbacks. Both seeded
// and unseeded flows now open AdvancedSelector at step 1 (browse) — seeded ones pre-select the index.
let lastAdvancedProps: any;
jest.mock('../../../../../../data/public', () => ({
  AdvancedSelector: (props: any) => {
    lastAdvancedProps = props;
    return null;
  },
}));
jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  toMountPoint: (node: any) => node,
}));
jest.mock('@osd/i18n', () => ({
  i18n: {
    translate: (_k: string, o: { defaultMessage: string; values?: any }) => {
      let m = o.defaultMessage;
      if (o.values)
        Object.entries(o.values).forEach(([k, v]) => (m = m.replace(`{${k}}`, String(v))));
      return m;
    },
  },
}));

const saveDataset = jest.fn();
const getInitialQueryByDataset = jest.fn().mockReturnValue({
  query: 'source = logs-app-*',
  language: 'PPL',
  dataset: { title: 'logs-app-*' },
});
const setQuery = jest.fn();
const navigateToApp = jest.fn();
const addSuccess = jest.fn();
const addDanger = jest.fn();
const clearCache = jest.fn();
const modalClose = jest.fn();
const openModal = jest.fn().mockImplementation((node: any) => {
  render(node); // render the modal content so the mocked selector captures its props
  return { close: modalClose };
});

const makeServices = () =>
  (({
    core: { application: { navigateToApp } },
    overlays: { openModal },
    notifications: { toasts: { addSuccess, addDanger } },
    data: {
      dataViews: { clearCache },
      query: {
        queryString: {
          getDatasetService: () => ({ saveDataset }),
          getInitialQueryByDataset,
          setQuery,
        },
      },
    },
  } as unknown) as any);

const Harness: React.FC<{ services: any; args: any }> = ({ services, args }) => {
  const createDataset = useCreateDataset(services);
  return (
    <button data-test-subj="go" onClick={() => createDataset(args)}>
      go
    </button>
  );
};

const renderHook = (services: any, args: any) =>
  render(<Harness services={services} args={args} />);

// Drive the confirm callback the way the modal would once the user finishes the flow.
const confirm = (dataset: any) => lastAdvancedProps.onSelect({ dataset });

describe('useCreateDataset', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastAdvancedProps = undefined;
  });

  // --- step-1 pre-selection (#19) ---

  it('opens AdvancedSelector at step 1 pre-selecting the seeded pattern (signalType logs)', () => {
    const { getByTestId } = renderHook(makeServices(), { pattern: 'logs-app-*' });
    fireEvent.click(getByTestId('go'));
    expect(openModal).toHaveBeenCalled();
    expect(lastAdvancedProps).toBeDefined();
    expect(lastAdvancedProps.signalType).toBe('logs');
    expect(lastAdvancedProps.useConfiguratorV2).toBe(true);
    expect(lastAdvancedProps.supportedTypes).toEqual(['INDEXES']);
    // The clicked index/pattern is pre-selected at step 1 (browse), not skipped to step 2.
    expect(lastAdvancedProps.initialSelectedItems).toEqual(['logs-app-*']);
  });

  it('passes a comma-joined multi-index pattern as a single seed (creator splits it)', () => {
    const { getByTestId } = renderHook(makeServices(), { pattern: 'a-logs,b-logs' });
    fireEvent.click(getByTestId('go'));
    expect(lastAdvancedProps.initialSelectedItems).toEqual(['a-logs,b-logs']);
  });

  it('pre-selects the active data source (MDS) at step 1', () => {
    const { getByTestId } = renderHook(makeServices(), {
      pattern: 'logs-app-*',
      dataSource: { id: 'ds-2', title: 'C2', type: 'DATA_SOURCE' },
    });
    fireEvent.click(getByTestId('go'));
    expect(lastAdvancedProps.initialDataSourceId).toBe('ds-2');
  });

  it('opens step 1 blank when there is no seed (empty-state "Create dataset")', () => {
    const { getByTestId } = renderHook(makeServices(), { pattern: '' });
    fireEvent.click(getByTestId('go'));
    expect(lastAdvancedProps).toBeDefined();
    expect(lastAdvancedProps.signalType).toBe('logs');
    // No pre-selection when unseeded.
    expect(lastAdvancedProps.initialSelectedItems).toBeUndefined();
    expect(lastAdvancedProps.initialDataSourceId).toBeUndefined();
  });

  // --- confirm / save behavior ---

  it('on confirm: saves with signalType logs, then navigates to the logs app', async () => {
    saveDataset.mockResolvedValue(undefined);
    const { getByTestId } = renderHook(makeServices(), { pattern: 'logs-app-*' });
    fireEvent.click(getByTestId('go'));

    await confirm({ title: 'logs-app-*', id: 'logs-app-*' });

    expect(saveDataset).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'logs-app-*' }),
      expect.anything(),
      'logs'
    );
    await waitFor(() => expect(setQuery).toHaveBeenCalled());
    expect(navigateToApp).toHaveBeenCalledWith('explore/logs', { path: '#/' });
    expect(modalClose).toHaveBeenCalled();
  });

  it('swallows a DuplicateDataViewError and still navigates (no error toast)', async () => {
    saveDataset.mockRejectedValue({ name: 'DuplicateDataViewError' });
    const { getByTestId } = renderHook(makeServices(), { pattern: 'logs-app-*' });
    fireEvent.click(getByTestId('go'));

    await confirm({ title: 'logs-app-*', id: 'logs-app-*' });

    expect(addDanger).not.toHaveBeenCalled();
    await waitFor(() => expect(navigateToApp).toHaveBeenCalled());
  });

  it('treats a "Duplicate data view" message (no name) as a duplicate and still navigates', async () => {
    saveDataset.mockRejectedValue(new Error('Duplicate data view: logs-app-*'));
    const { getByTestId } = renderHook(makeServices(), { pattern: 'logs-app-*' });
    fireEvent.click(getByTestId('go'));

    await confirm({ title: 'logs-app-*', id: 'logs-app-*' });

    expect(addDanger).not.toHaveBeenCalled();
    await waitFor(() => expect(navigateToApp).toHaveBeenCalled());
  });

  it('surfaces a toast and does not navigate on an unexpected save error', async () => {
    saveDataset.mockRejectedValue(new Error('network down'));
    const { getByTestId } = renderHook(makeServices(), { pattern: 'logs-app-*' });
    fireEvent.click(getByTestId('go'));

    await confirm({ title: 'logs-app-*', id: 'logs-app-*' });

    expect(addDanger).toHaveBeenCalled();
    expect(navigateToApp).not.toHaveBeenCalled();
  });

  it('does nothing when the create flow returns no dataset (guard)', async () => {
    const { getByTestId } = renderHook(makeServices(), { pattern: 'logs-app-*' });
    fireEvent.click(getByTestId('go'));

    await lastAdvancedProps.onSelect({}); // no .dataset

    expect(saveDataset).not.toHaveBeenCalled();
    expect(navigateToApp).not.toHaveBeenCalled();
    // The modal is still closed regardless.
    expect(modalClose).toHaveBeenCalled();
  });

  it('drives the unseeded onSelect path through to navigation', async () => {
    saveDataset.mockResolvedValue(undefined);
    const { getByTestId } = renderHook(makeServices(), { pattern: '' });
    fireEvent.click(getByTestId('go'));

    await confirm({ title: 'picked-*', id: 'picked-*' });

    expect(saveDataset).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'picked-*' }),
      expect.anything(),
      'logs'
    );
    await waitFor(() => expect(navigateToApp).toHaveBeenCalled());
    expect(modalClose).toHaveBeenCalled();
  });
});
