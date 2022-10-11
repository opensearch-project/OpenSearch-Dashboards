/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from '../header';
import { shallow } from 'enzyme';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from '../../../../../../opensearch_dashboards_react/public';
import { mockManagementPlugin } from '../../../../mocks';

describe('Datasource Management: Header', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();

  test('should render normally', () => {
    const component = shallow(wrapWithIntl(<Header />), {
      wrappingComponent: OpenSearchDashboardsContextProvider,
      wrappingComponentProps: {
        services: mockedContext,
      },
    });

    expect(component).toMatchSnapshot();
  });
});
