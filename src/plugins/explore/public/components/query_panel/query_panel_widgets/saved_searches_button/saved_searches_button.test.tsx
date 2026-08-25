/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SavedSearchesButton } from './saved_searches_button';
import { getOpenButtonRun } from '../../../top_nav/top_nav_links/top_nav_open';
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSearchDashboards.mockReturnValue({ services });
    mockGetOpenButtonRun.mockReturnValue(run);
  });

  it('renders with the folder icon and label', () => {
    render(<SavedSearchesButton />);

    const button = screen.getByTestId('queryPanelFooterSavedSearchesButton');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Saved searches');
  });

  // Same flyout as the header's "Browse searches" icon — there is only one saved-search browser.
  it('opens the browse searches flyout on click, anchored to the button', () => {
    render(<SavedSearchesButton />);

    const button = screen.getByTestId('queryPanelFooterSavedSearchesButton');
    fireEvent.click(button);

    expect(mockGetOpenButtonRun).toHaveBeenCalledWith(services);
    expect(run).toHaveBeenCalledWith(button);
  });

  it('does not open anything before it is clicked', () => {
    render(<SavedSearchesButton />);

    expect(run).not.toHaveBeenCalled();
  });
});
