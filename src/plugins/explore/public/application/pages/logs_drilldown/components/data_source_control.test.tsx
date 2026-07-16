/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { DataSourceControl } from './data_source_control';

jest.mock('@osd/i18n', () => ({
  i18n: { translate: (_k: string, o: { defaultMessage: string }) => o.defaultMessage },
}));

// A stub DataSourceSelector that captures its props and lets us fire a selection.
let lastSelectorProps: any;
const StubSelector = (props: any) => {
  lastSelectorProps = props;
  return <div data-test-subj="stub-ds-selector" />;
};

const makeServices = (withMds: boolean) =>
  (({
    dataSourceManagement: withMds ? { ui: { DataSourceSelector: StubSelector } } : undefined,
    savedObjects: { client: {} },
    notifications: { toasts: {} },
    uiSettings: { get: jest.fn() },
  } as unknown) as any);

describe('DataSourceControl', () => {
  beforeEach(() => {
    lastSelectorProps = undefined;
  });

  // --- negative case ---
  it('renders nothing when MDS is disabled / the plugin is absent (single local cluster)', () => {
    const { container } = render(
      <DataSourceControl services={makeServices(false)} onChange={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('logsExploreDataSourceControl')).not.toBeInTheDocument();
  });

  // --- positive cases ---
  it('renders the data_source_management selector when MDS is available', () => {
    render(<DataSourceControl services={makeServices(true)} onChange={jest.fn()} />);
    expect(screen.getByTestId('logsExploreDataSourceControl')).toBeInTheDocument();
    expect(screen.getByTestId('stub-ds-selector')).toBeInTheDocument();
  });

  it('hides the local cluster and lets the selector auto-select a real data source', () => {
    render(<DataSourceControl services={makeServices(true)} onChange={jest.fn()} />);
    // The synthetic "Local cluster" option is hidden. We do NOT pass defaultOption, so the selector
    // falls through to its default-data-source path and auto-selects a real registered cluster on
    // load — the picker always reflects the cluster whose indexes are shown (never empty).
    expect(lastSelectorProps.hideLocalCluster).toBe(true);
    expect(lastSelectorProps.defaultOption).toBeUndefined();
    expect(lastSelectorProps.uiSettings).toBeDefined();
  });

  it('pre-selects a restored data source via defaultOption when defaultDataSourceId is set', () => {
    render(
      <DataSourceControl
        services={makeServices(true)}
        onChange={jest.fn()}
        defaultDataSourceId="ds-restored"
      />
    );
    // A restored id (e.g. from the URL) is fed to the selector as its defaultOption so it re-selects
    // that source instead of auto-picking the workspace default.
    expect(lastSelectorProps.defaultOption).toEqual([{ id: 'ds-restored' }]);
  });

  it('maps a selected option to { id, title } via onChange', () => {
    const onChange = jest.fn();
    render(<DataSourceControl services={makeServices(true)} onChange={onChange} />);
    lastSelectorProps.onSelectedDataSource([{ id: 'ds-2', label: 'Cluster 2' }]);
    expect(onChange).toHaveBeenCalledWith({ id: 'ds-2', title: 'Cluster 2' });
  });

  it('defaults to the local cluster (empty id) when the selection is cleared/empty', () => {
    const onChange = jest.fn();
    render(<DataSourceControl services={makeServices(true)} onChange={onChange} />);
    lastSelectorProps.onSelectedDataSource([]);
    expect(onChange).toHaveBeenCalledWith({ id: '', title: undefined });
  });
});
