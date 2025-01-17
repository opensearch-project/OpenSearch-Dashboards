/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { act, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { contentManagementPluginMocks } from '../../../../../content_management/public/mocks';
import { SearchUseCaseOverviewApp } from './search_use_case_app';
import { ContentManagementPluginStart } from '../../../../../content_management/public';
import { ALL_USE_CASE_ID, SEARCH_USE_CASE_ID } from '../../../../../../core/public';
import { BehaviorSubject } from 'rxjs';
import { navigationPluginMock } from '../../../../../navigation/public/mocks';
import { NavigationPublicPluginStart } from '../../../../../navigation/public';
import { TopNavControlsProps } from '../../../../../navigation/public/top_nav_menu';

describe('<SearchUseCaseOverviewApp />', () => {
  const renderPageMock = jest.fn();
  renderPageMock.mockReturnValue('dummy page');
  const mock = {
    ...contentManagementPluginMocks.createStartContract(),
    renderPage: renderPageMock,
  };
  const navigationMock = navigationPluginMock.createStartContract();
  const FunctionComponent = (props: TopNavControlsProps) => (
    <div>
      {props.controls?.map((control, idx) => (
        <div key={idx}>{control.renderComponent}</div>
      ))}
    </div>
  );
  navigationMock.ui.HeaderControl = FunctionComponent;
  const core = coreMock.createStart();
  const currentNavGroupMock = new BehaviorSubject({ id: 'Search' });
  const coreStartMocks = {
    ...core,
    chrome: {
      ...core.chrome,
      navGroup: {
        ...core.chrome.navGroup,
        getCurrentNavGroup$: jest.fn(() => currentNavGroupMock),
      },
    },
  };

  function renderSearchUseCaseOverviewApp(
    contentManagement: ContentManagementPluginStart,
    navigation: NavigationPublicPluginStart,
    services = { ...coreStartMocks }
  ) {
    return (
      <OpenSearchDashboardsContextProvider services={services}>
        <SearchUseCaseOverviewApp contentManagement={contentManagement} navigation={navigation} />
      </OpenSearchDashboardsContextProvider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render page normally', () => {
    currentNavGroupMock.next({ id: SEARCH_USE_CASE_ID });
    const { container } = render(
      renderSearchUseCaseOverviewApp(mock, navigationMock, coreStartMocks)
    );

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
                    data-test-subj="search-overview-setting-button"
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
        dummy page
      </div>
    `);

    expect(coreStartMocks.chrome.setBreadcrumbs).toHaveBeenCalledWith([{ text: 'Overview' }]);
    expect(mock.renderPage).toBeCalledWith('search_overview');
  });

  it('set page title correctly in all use case', () => {
    currentNavGroupMock.next({ id: ALL_USE_CASE_ID });
    render(renderSearchUseCaseOverviewApp(mock, navigationMock, coreStartMocks));

    expect(coreStartMocks.chrome.setBreadcrumbs).toHaveBeenCalledWith([
      { text: 'Search Overview' },
    ]);
  });

  it('user able to dismiss get started', () => {
    const { getByTestId, queryByText } = render(
      renderSearchUseCaseOverviewApp(mock, navigationMock, coreStartMocks)
    );

    expect(getByTestId('search-overview-setting-button')).toBeInTheDocument();
    act(() => {
      fireEvent.click(getByTestId('search-overview-setting-button'));
    });
    expect(queryByText('Hide Get started with Search')).toBeInTheDocument();

    act(() => {
      fireEvent.click(queryByText('Hide Get started with Search')!);
    });
    expect(coreStartMocks.uiSettings.set).toBeCalledWith('searchWorkspace:dismissGetStarted', true);
  });

  it('user able to enable get started', () => {
    coreStartMocks.uiSettings.get.mockReturnValueOnce(true);
    const { getByTestId, queryByText } = render(
      renderSearchUseCaseOverviewApp(mock, navigationMock, coreStartMocks)
    );

    expect(getByTestId('search-overview-setting-button')).toBeInTheDocument();
    act(() => {
      fireEvent.click(getByTestId('search-overview-setting-button'));
    });
    expect(queryByText('Show Get started with Search')).toBeInTheDocument();

    act(() => {
      fireEvent.click(queryByText('Show Get started with Search')!);
    });
    expect(coreStartMocks.uiSettings.set).toBeCalledWith(
      'searchWorkspace:dismissGetStarted',
      false
    );
  });
});
