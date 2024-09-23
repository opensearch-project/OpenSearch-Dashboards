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

describe('<SearchUseCaseOverviewApp />', () => {
  const renderPageMock = jest.fn();
  renderPageMock.mockReturnValue('dummy page');
  const mock = {
    ...contentManagementPluginMocks.createStartContract(),
    renderPage: renderPageMock,
  };
  const coreStartMocks = coreMock.createStart();

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
    const { container } = render(renderSearchUseCaseOverviewApp(mock, coreStartMocks));

    expect(container).toMatchInlineSnapshot(`
      <div>
        dummy page
      </div>
    `);

    expect(coreStartMocks.chrome.setBreadcrumbs).toHaveBeenCalledWith([{ text: 'Overview' }]);
    expect(mock.renderPage).toBeCalledWith('search_overview');
  });
});
