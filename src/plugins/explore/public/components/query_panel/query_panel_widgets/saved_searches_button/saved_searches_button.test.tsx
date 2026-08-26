/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedSearchesButton } from './saved_searches_button';
import { getOpenButtonRun } from '../../../top_nav/top_nav_links/top_nav_open';
import { setSaveSearchRun } from '../../../top_nav/saved_search_actions';
import { useOpenSearchDashboards } from '../../../../../../opensearch_dashboards_react/public';

jest.mock('../../../top_nav/top_nav_links/top_nav_open', () => ({
  getOpenButtonRun: jest.fn(),
}));

jest.mock('../../../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

const mockGetOpenButtonRun = getOpenButtonRun as jest.Mock;
const mockUseOpenSearchDashboards = useOpenSearchDashboards as jest.Mock;

describe('SavedSearchesButton', () => {
  const services = { overlays: { openFlyout: jest.fn() } };
  const run = jest.fn();

  const openPopover = () => {
    fireEvent.click(screen.getByTestId('queryPanelFooterSavedSearchesButton'));
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSearchDashboards.mockReturnValue({ services });
    mockGetOpenButtonRun.mockReturnValue(run);
    // `saved_search_actions` is a module-level subject shared across tests.
    setSaveSearchRun(undefined);
  });

  it('renders with the folder icon and label', () => {
    render(<SavedSearchesButton />);

    const button = screen.getByTestId('queryPanelFooterSavedSearchesButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Saved searches');
  });

  it('does not open anything before it is clicked', () => {
    render(<SavedSearchesButton />);

    expect(screen.queryByTestId('savedSearchesBrowseButton')).not.toBeInTheDocument();
    expect(run).not.toHaveBeenCalled();
  });

  // Mirrors the Saved queries popover: Save first, then Browse.
  it('lists Save search and Browse searches when opened', () => {
    render(<SavedSearchesButton />);
    openPopover();

    expect(screen.getByTestId('savedSearchesSaveButton')).toHaveTextContent('Save search');
    expect(screen.getByTestId('savedSearchesBrowseButton')).toHaveTextContent('Browse searches');
  });

  // Same flyout as the header's "Browse searches" icon — there is only one saved-search browser.
  it('opens the browse searches flyout from the Browse searches option', () => {
    render(<SavedSearchesButton />);
    openPopover();

    fireEvent.click(screen.getByTestId('savedSearchesBrowseButton'));

    expect(mockGetOpenButtonRun).toHaveBeenCalledWith(services);
    expect(run).toHaveBeenCalled();
  });

  it('runs the header-published save action from the Save search option', () => {
    const saveRun = jest.fn();
    setSaveSearchRun(saveRun);

    render(<SavedSearchesButton />);
    openPopover();

    const saveOption = screen.getByTestId('savedSearchesSaveButton');
    expect(saveOption).not.toBeDisabled();
    fireEvent.click(saveOption);

    expect(saveRun).toHaveBeenCalledTimes(1);
  });

  // Nothing to save into until TopNav publishes a runner, so the option must not look actionable.
  it('disables Save search while no save action is published', () => {
    render(<SavedSearchesButton />);
    openPopover();

    expect(screen.getByTestId('savedSearchesSaveButton')).toBeDisabled();
  });
});
