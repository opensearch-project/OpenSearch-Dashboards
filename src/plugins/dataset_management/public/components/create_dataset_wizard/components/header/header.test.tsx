/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Header } from '../header';
import { mount } from 'enzyme';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { mockManagementPlugin } from '../../../../mocks';
import { DocLinksStart } from 'opensearch-dashboards/public';

describe('Header', () => {
  const datasetName = 'test index pattern';
  const mockedContext = mockManagementPlugin.createDatasetManagmentContext();
  const mockedDocLinks = {
    links: {
      noDocumentation: {
        indexPatterns: {},
      },
    },
  } as DocLinksStart;

  it('should render normally', () => {
    const component = mount(
      wrapWithIntl(<Header datasetName={datasetName} docLinks={mockedDocLinks} />),
      {
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );

    expect(component).toMatchSnapshot();
  });

  it('should render without including system indices', () => {
    const component = mount(
      wrapWithIntl(<Header datasetName={datasetName} docLinks={mockedDocLinks} />),
      {
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );

    expect(component).toMatchSnapshot();
  });

  it('should render a different name, prompt, and beta tag if provided', () => {
    const component = mount(
      wrapWithIntl(
        <Header
          prompt={<div>Test prompt</div>}
          datasetName={datasetName}
          isBeta={true}
          docLinks={mockedDocLinks}
        />
      ),
      {
        // @ts-expect-error TS2769 TODO(ts-error): fixme
        wrappingComponent: OpenSearchDashboardsContextProvider,
        wrappingComponentProps: {
          services: mockedContext,
        },
      }
    );

    expect(component).toMatchSnapshot();
  });
});
