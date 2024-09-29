/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../opensearch_dashboards_react/public';
import { contentManagementPluginMocks } from '../../../../../content_management/public/mocks';
import { SearchUseCaseOverviewApp } from './search_use_case_app';
import { ContentManagementPluginStart } from '../../../../../content_management/public';
import { ALL_USE_CASE_ID, SEARCH_USE_CASE_ID } from '../../../../../../core/public';
import { BehaviorSubject } from 'rxjs';

describe('<SearchUseCaseOverviewApp />', () => {
  const renderPageMock = jest.fn();
  renderPageMock.mockReturnValue('dummy page');
  const mock = {
    ...contentManagementPluginMocks.createStartContract(),
    renderPage: renderPageMock,
  };
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
    services = { ...coreStartMocks }
  ) {
    return (
      <OpenSearchDashboardsContextProvider services={services}>
        <SearchUseCaseOverviewApp contentManagement={contentManagement} />
      </OpenSearchDashboardsContextProvider>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render page normally', () => {
    currentNavGroupMock.next({ id: SEARCH_USE_CASE_ID });
    const { container } = render(renderSearchUseCaseOverviewApp(mock, coreStartMocks));

    expect(container).toMatchInlineSnapshot(`
      <div>
        dummy page
      </div>
    `);

    expect(coreStartMocks.chrome.setBreadcrumbs).toHaveBeenCalledWith([{ text: 'Overview' }]);
    expect(mock.renderPage).toBeCalledWith('search_overview');
  });

  it('set page title correctly in all use case', () => {
    currentNavGroupMock.next({ id: ALL_USE_CASE_ID });
    render(renderSearchUseCaseOverviewApp(mock, coreStartMocks));

    expect(coreStartMocks.chrome.setBreadcrumbs).toHaveBeenCalledWith([
      { text: 'Search Overview' },
    ]);
  });
});
