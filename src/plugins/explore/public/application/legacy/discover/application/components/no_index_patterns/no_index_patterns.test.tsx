/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ExploreFlavor } from '../../../../../../../common';
import { DiscoverNoIndexPatterns } from './no_index_patterns';

jest.mock('@osd/i18n', () => ({
  i18n: { translate: (_k: string, o: { defaultMessage: string }) => o.defaultMessage },
}));

// The data/public barrel pulls in UI components that break in jsdom; the empty state only needs
// AdvancedSelector as an opaque element for the create-dataset modal.
jest.mock('../../../../../../../../data/public', () => ({ AdvancedSelector: () => null }));
jest.mock('../../../../../../../../data/common', () => ({
  DEFAULT_DATA: { SET_TYPES: { INDEX: 'INDEX', INDEX_PATTERN: 'INDEX_PATTERN' } },
}));
jest.mock('../../../../../../../../opensearch_dashboards_react/public', () => ({
  toMountPoint: (x: unknown) => x,
}));

// Control the resolved flavor per test.
const mockGetCurrentFlavor = jest.fn();
jest.mock('../../../../../../helpers/get_flavor_from_app_id', () => ({
  getCurrentFlavor: () => mockGetCurrentFlavor(),
}));

const navigateToApp = jest.fn();
let mockServices: any;
jest.mock('../../../opensearch_dashboards_services', () => ({
  getServices: () => mockServices,
}));

const makeServices = (opts: { logsDrilldownEnabled?: boolean; sqlSupportEnabled?: boolean } = {}) =>
  ({
    sqlSupportEnabled: opts.sqlSupportEnabled ?? false,
    logsDrilldownEnabled: opts.logsDrilldownEnabled ?? true,
    core: { application: { navigateToApp } },
    data: { query: { queryString: { getDatasetService: jest.fn() } } },
    overlays: { openModal: jest.fn(() => ({ close: jest.fn() })) },
    notifications: { toasts: { addError: jest.fn() } },
  } as any);

describe('DiscoverNoIndexPatterns — Logs drilldown gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockServices = makeServices();
  });

  it('shows the Logs drilldown button on the Logs flavor when the flag is on', async () => {
    mockGetCurrentFlavor.mockResolvedValue(ExploreFlavor.Logs);
    render(<DiscoverNoIndexPatterns />);
    expect(await screen.findByTestId('discoverNoIndexPatternsLogsDrilldown')).toBeInTheDocument();
  });

  it('hides the Logs drilldown button on the Traces flavor (shared empty state)', async () => {
    mockGetCurrentFlavor.mockResolvedValue(ExploreFlavor.Traces);
    render(<DiscoverNoIndexPatterns />);
    // The create-dataset action still renders, so the component has settled.
    expect(await screen.findByTestId('discoverNoIndexPatternsCreateDataset')).toBeInTheDocument();
    expect(screen.queryByTestId('discoverNoIndexPatternsLogsDrilldown')).not.toBeInTheDocument();
  });

  it('hides the Logs drilldown button when the flag is off, even on Logs', async () => {
    mockServices = makeServices({ logsDrilldownEnabled: false });
    mockGetCurrentFlavor.mockResolvedValue(ExploreFlavor.Logs);
    render(<DiscoverNoIndexPatterns />);
    expect(await screen.findByTestId('discoverNoIndexPatternsCreateDataset')).toBeInTheDocument();
    expect(screen.queryByTestId('discoverNoIndexPatternsLogsDrilldown')).not.toBeInTheDocument();
  });

  it('navigates to the Logs drilldown app on click', async () => {
    mockGetCurrentFlavor.mockResolvedValue(ExploreFlavor.Logs);
    render(<DiscoverNoIndexPatterns />);
    const btn = await screen.findByTestId('discoverNoIndexPatternsLogsDrilldown');
    btn.click();
    await waitFor(() =>
      expect(navigateToApp).toHaveBeenCalledWith('explore/logs-drilldown', { path: '#/' })
    );
  });
});
