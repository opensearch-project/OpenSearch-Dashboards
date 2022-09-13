/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from '../header';
import { shallow } from 'enzyme';
import { DocLinksStart } from 'opensearch-dashboards/public';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from '../../../../../../opensearch_dashboards_react/public';
import { docLinks } from '../../../../mocks';
import { mockManagementPlugin } from '../../../../mocks';

describe('Datasource Management: Header', () => {
  const mockedContext = mockManagementPlugin.createDataSourceManagementContext();
  const mockedDocLinks = docLinks as DocLinksStart;

  test('should render normally', () => {
    const component = shallow(wrapWithIntl(<Header docLinks={mockedDocLinks} />), {
      wrappingComponent: OpenSearchDashboardsContextProvider,
      wrappingComponentProps: {
        services: mockedContext,
      },
    });

    expect(component).toMatchSnapshot();
  });
});
