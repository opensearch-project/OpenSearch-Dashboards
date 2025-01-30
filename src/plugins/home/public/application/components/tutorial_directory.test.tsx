/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { coreMock } from '../../../../../core/public/mocks';
import { setServices } from '../opensearch_dashboards_services';
import { getMockedServices } from '../opensearch_dashboards_services.mock';
import * as utils from '../../../../../plugins/data_source_management/public/components/utils';
import { DataSourceSelectionService } from '../../../../../plugins/data_source_management/public';
import { OpenSearchDashboardsContextProvider } from '../../../../opensearch_dashboards_react/public';

const makeProps = () => {
  const coreMocks = coreMock.createStart();
  return {
    addBasePath: coreMocks.http.basePath.prepend,
    openTab: 'foo',
    isCloudEnabled: false,
  };
};

const setup = async ({ props, services }) => {
  const mockHeaderControl = ({ controls }) => {
    return controls?.[0].description ?? controls?.[0].renderComponent ?? null;
  };
  const setHeaderActionMenuMock = jest.fn();

  // @ts-ignore
  const { TutorialDirectory } = await import('./tutorial_directory');
  const finalServices = {
    ...services,
    notifications: services.toastNotifications,
    setHeaderActionMenu: services.setHeaderActionMenu ?? setHeaderActionMenuMock,
    navigation: services.navigation ?? {
      ui: {
        HeaderControl: mockHeaderControl,
      },
    },
  };

  const renderResult = render(
    <IntlProvider locale="en">
      <OpenSearchDashboardsContextProvider services={finalServices}>
        <TutorialDirectory {...makeProps()} {...props} />
      </OpenSearchDashboardsContextProvider>
    </IntlProvider>
  );

  return {
    renderResult,
    setHeaderActionMenuMock,
  };
};

describe('<TutorialDirectory />', () => {
  let currentService: ReturnType<typeof getMockedServices>;
  beforeEach(() => {
    currentService = getMockedServices();
    setServices(currentService);
  });
  it('should render home breadcrumbs when withoutHomeBreadCrumb is undefined', async () => {
    currentService.http.get.mockResolvedValueOnce([]);
    spyOn(utils, 'getDataSourceSelection').and.returnValue(new DataSourceSelectionService());

    await setup({ services: currentService });
    expect(currentService.chrome.setBreadcrumbs).toBeCalledWith([
      {
        href: '#/',
        text: 'Home',
      },
      {
        text: 'Add data',
      },
    ]);
  });

  it('should not render home breadcrumbs when withoutHomeBreadCrumb is true', async () => {
    currentService.http.get.mockResolvedValueOnce([]);
    spyOn(utils, 'getDataSourceSelection').and.returnValue(new DataSourceSelectionService());

    await setup({
      props: { withoutHomeBreadCrumb: true },
      services: currentService,
    });
    expect(currentService.chrome.setBreadcrumbs).toBeCalledWith([
      {
        text: 'Add data',
      },
    ]);
  });

  it('should call setBreadcrumbs with "Sample data" when usedUpdatedUX', async () => {
    currentService.http.get.mockResolvedValueOnce([]);
    currentService.uiSettings.get.mockResolvedValueOnce(true);
    spyOn(utils, 'getDataSourceSelection').and.returnValue(new DataSourceSelectionService());

    await setup({
      props: { withoutHomeBreadCrumb: true },
      services: currentService,
    });
    expect(currentService.chrome.setBreadcrumbs).toBeCalledWith([
      {
        text: 'Sample data',
      },
    ]);
  });

  it('should render description and call setHeaderActionMenu when usedUpdatedUX', async () => {
    currentService.http.get.mockResolvedValueOnce([]);
    currentService.uiSettings.get.mockResolvedValueOnce(true);
    spyOn(utils, 'getDataSourceSelection').and.returnValue(new DataSourceSelectionService());

    const { setHeaderActionMenuMock, renderResult } = await setup({
      props: { withoutHomeBreadCrumb: true },
      services: currentService,
    });
    expect(
      renderResult.getByText('Explore sample data, visualizations, and dashboards.')
    ).toBeInTheDocument();
    expect(setHeaderActionMenuMock).toHaveBeenCalled();
  });
});
