/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor, screen } from '@testing-library/react';
import { WorkspaceUseCaseOverviewApp } from './workspace_use_case_overview_app';
import { of } from 'rxjs';
import { coreMock } from '../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../opensearch_dashboards_react/public';
import {
  ANALYTICS_ALL_OVERVIEW_PAGE_ID,
  contentManagementPluginMocks,
  ESSENTIAL_OVERVIEW_PAGE_ID,
} from '../../../content_management/public';
import {
  ANALYTICS_WORKSPACE_DISMISS_GET_STARTED,
  ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED,
} from '../../common/constants';
import { navigationPluginMock } from '../../../navigation/public/mocks';
import { TopNavControlsProps } from '../../../navigation/public/top_nav_menu';

const coreStartMocks = coreMock.createStart();
const navigationMock = navigationPluginMock.createStartContract();
const FunctionComponent = (props: TopNavControlsProps) => (
  <div>
    {props.controls?.map((control: any, idx) => (
      <div key={idx}>{control.renderComponent}</div>
    ))}
  </div>
);
navigationMock.ui.HeaderControl = FunctionComponent;

const contentManagementMock = {
  ...contentManagementPluginMocks.createStartContract(),
  renderPage: jest.fn(() => <div>Mocked Page Content</div>),
};

const servicesMock = {
  ...coreStartMocks,
  navigationUI: navigationMock.ui,
  contentManagement: contentManagementMock,
  collaboratorTypes: {
    getTypes$: () => of([]),
  },
};

function overviewPage(pageId = ESSENTIAL_OVERVIEW_PAGE_ID) {
  return (
    <OpenSearchDashboardsContextProvider services={servicesMock}>
      <WorkspaceUseCaseOverviewApp pageId={pageId} />
    </OpenSearchDashboardsContextProvider>
  );
}

describe('WorkspaceUseCaseOverviewApp - Essential', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(overviewPage());
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div>
          <div>
            <span
              class="euiToolTipAnchor"
            >
              <div
                class="euiPopover euiPopover--anchorDownCenter"
              >
                <div
                  class="euiPopover__anchor"
                >
                  <button
                    aria-label="Page settings"
                    class="euiButtonIcon euiButtonIcon--primary euiButtonIcon--small"
                    data-test-subj="essentials_overview-setting-button"
                    type="button"
                  >
                    <span
                      aria-hidden="true"
                      class="euiButtonIcon__icon"
                      color="inherit"
                      data-euiicon-type="gear"
                    />
                  </button>
                </div>
              </div>
            </span>
          </div>
        </div>
        <div>
          Mocked Page Content
        </div>
      </div>
    `);
  });

  it('sets breadcrumbs on mount', () => {
    render(overviewPage());
    expect(coreStartMocks.chrome.setBreadcrumbs).toHaveBeenCalledWith([{ text: 'Overview' }]);
  });

  it('renders header control when available', () => {
    const { getByTestId } = render(overviewPage());
    // setting button exists
    expect(getByTestId('essentials_overview-setting-button')).toBeInTheDocument();
  });

  it('handles get started card dismissal', async () => {
    const { getByTestId, getByText } = render(overviewPage());

    const settingButton = getByTestId(`${ESSENTIAL_OVERVIEW_PAGE_ID}-setting-button`);
    expect(settingButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(settingButton);
    });

    const hideButton = getByText(/Hide Get started with/i);
    expect(hideButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(hideButton);
    });

    await waitFor(() => {
      expect(coreStartMocks.uiSettings.set).toHaveBeenCalledWith(
        ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED,
        true
      );
    });
  });

  it('checks initial get started dismissed state', () => {
    coreStartMocks.uiSettings.get.mockReturnValueOnce(true);

    const { queryByText, getByTestId } = render(overviewPage());

    expect(coreStartMocks.uiSettings.get).toHaveBeenCalledWith(
      ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED
    );

    const settingButton = getByTestId(`${ESSENTIAL_OVERVIEW_PAGE_ID}-setting-button`);
    expect(settingButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(settingButton);
    });

    expect(queryByText(/Show Get started/i)).toBeInTheDocument();

    act(() => {
      fireEvent.click(queryByText(/Show Get started/)!);
    });
    expect(coreStartMocks.uiSettings.set).toBeCalledWith(
      ESSENTIAL_WORKSPACE_DISMISS_GET_STARTED,
      false
    );
  });

  it('renders content management page when available', () => {
    const { queryByText } = render(overviewPage());

    expect(contentManagementMock.renderPage).toHaveBeenCalledWith(ESSENTIAL_OVERVIEW_PAGE_ID);
    expect(queryByText('Mocked Page Content')).toBeInTheDocument();
  });
});

describe('WorkspaceUseCaseOverviewApp - Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles get started card dismissal', async () => {
    const { getByTestId, getByText } = render(overviewPage(ANALYTICS_ALL_OVERVIEW_PAGE_ID));

    const settingButton = getByTestId(`${ANALYTICS_ALL_OVERVIEW_PAGE_ID}-setting-button`);
    expect(settingButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(settingButton);
    });

    const hideButton = getByText('Hide Get started with Analytics');
    expect(hideButton).toBeInTheDocument();
    act(() => {
      fireEvent.click(hideButton);
    });

    await waitFor(() => {
      expect(coreStartMocks.uiSettings.set).toHaveBeenCalledWith(
        ANALYTICS_WORKSPACE_DISMISS_GET_STARTED,
        true
      );
    });
  });
});
