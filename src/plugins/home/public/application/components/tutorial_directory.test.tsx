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

const makeProps = () => {
  const coreMocks = coreMock.createStart();
  return {
    addBasePath: coreMocks.http.basePath.prepend,
    openTab: 'foo',
    isCloudEnabled: false,
  };
};

describe('<TutorialDirectory />', () => {
  let currentService: ReturnType<typeof getMockedServices>;
  beforeEach(() => {
    currentService = getMockedServices();
    setServices(currentService);
  });
  it('should render home breadcrumbs when withoutHomeBreadCrumb is undefined', async () => {
    const finalProps = makeProps();
    currentService.http.get.mockResolvedValueOnce([]);
    // @ts-ignore
    const { TutorialDirectory } = await import('./tutorial_directory');
    render(
      <IntlProvider locale="en">
        <TutorialDirectory {...finalProps} />
      </IntlProvider>
    );
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
    const finalProps = makeProps();
    currentService.http.get.mockResolvedValueOnce([]);
    // @ts-ignore
    const { TutorialDirectory } = await import('./tutorial_directory');
    render(
      <IntlProvider locale="en">
        <TutorialDirectory {...finalProps} withoutHomeBreadCrumb />
      </IntlProvider>
    );
    expect(currentService.chrome.setBreadcrumbs).toBeCalledWith([
      {
        text: 'Add data',
      },
    ]);
  });
});
