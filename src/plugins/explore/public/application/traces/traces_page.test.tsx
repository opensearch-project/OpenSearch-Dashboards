/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppMountParameters } from 'opensearch-dashboards/public';
import React from 'react';
import { render } from 'test_utils/testing_lib_helpers';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { TracesPage } from './traces_page';

// Mock the useOpenSearchDashboards hook
jest.mock('../../../../opensearch_dashboards_react/public', () => ({
  useOpenSearchDashboards: jest.fn(),
}));

// Mock the trackUiMetric function
jest.mock('../../ui_metric', () => ({
  DISCOVER_LOAD_EVENT: 'discover_load',
  NEW_DISCOVER_LOAD_EVENT: 'new_discover_load',
  trackUiMetric: jest.fn(),
}));

// Mock the components used by TracesPage
jest.mock('../../components/sidebar', () => ({
  Sidebar: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="sidebar">{children}</div>
  ),
}));

jest.mock('../legacy/discover/application/view_components/context', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-test-subj="discover-context">{children}</div>
  ),
}));

jest.mock('../legacy/discover/application/view_components/panel', () => ({
  __esModule: true,
  default: () => <div data-test-subj="discover-panel">panel</div>,
}));

jest.mock('../legacy/discover/application/view_components/canvas', () => ({
  __esModule: true,
  default: () => <div data-test-subj="discover-canvas">canvas</div>,
}));

describe('TracesPage', () => {
  const mockUiSettings = {
    get: jest.fn(),
  };

  const params: AppMountParameters = {
    element: document.createElement('div'),
    history: {} as any,
    onAppLeave: jest.fn(),
    setHeaderActionMenu: jest.fn(),
    appBasePath: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useOpenSearchDashboards as jest.Mock).mockReturnValue({
      services: {
        uiSettings: mockUiSettings,
      },
    });
  });

  it('should render with enhancements disabled', () => {
    mockUiSettings.get.mockImplementation((key) => {
      if (key === 'home:useNewHomePage') return false;
      return false; // Default for QUERY_ENHANCEMENT_ENABLED_SETTING
    });

    const { container } = render(<TracesPage params={params} />);

    expect(container.querySelector('.mainPage')).toBeInTheDocument();
    expect(container.querySelector('.dsc--next')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-context"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-canvas"]')).toBeInTheDocument();
  });

  it('should render with enhancements enabled', () => {
    mockUiSettings.get.mockImplementation((key) => {
      if (key === 'home:useNewHomePage') return false;
      return true; // For QUERY_ENHANCEMENT_ENABLED_SETTING
    });

    const { container } = render(<TracesPage params={params} />);

    expect(container.querySelector('.mainPage')).toBeInTheDocument();
    expect(container.querySelector('.dsc--next')).toBeInTheDocument();
    expect(container.querySelector('.navBar')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-context"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-canvas"]')).toBeInTheDocument();
  });

  it('should render with new home page enabled', () => {
    mockUiSettings.get.mockImplementation((key) => {
      if (key === 'home:useNewHomePage') return true;
      return true; // For QUERY_ENHANCEMENT_ENABLED_SETTING
    });

    const { container } = render(<TracesPage params={params} />);

    expect(container.querySelector('.mainPage')).toBeInTheDocument();
    expect(container.querySelector('.navBar')).not.toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-context"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-panel"]')).toBeInTheDocument();
    expect(container.querySelector('[data-test-subj="discover-canvas"]')).toBeInTheDocument();
  });
});
