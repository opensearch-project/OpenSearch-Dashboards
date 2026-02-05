/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { mount } from 'enzyme';
import { wrapWithIntl } from 'test_utils/enzyme_helpers';
import { OpenSearchDashboardsContextProvider } from 'src/plugins/opensearch_dashboards_react/public';
import { mockManagementPlugin } from '../../../../mocks';
import { ScriptingWarningCallOut } from './warning_call_out';

describe('ScriptingWarningCallOut', () => {
  const mockedContext = mockManagementPlugin.createDatasetManagmentContext();

  it('should render normally', async () => {
    const component = mount(wrapWithIntl(<ScriptingWarningCallOut isVisible={true} />), {
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      wrappingComponent: OpenSearchDashboardsContextProvider,
      wrappingComponentProps: {
        services: mockedContext,
      },
    });

    expect(component).toMatchSnapshot();
  });

  it('should render nothing if not visible', async () => {
    const component = mount(wrapWithIntl(<ScriptingWarningCallOut isVisible={false} />), {
      // @ts-expect-error TS2769 TODO(ts-error): fixme
      wrappingComponent: OpenSearchDashboardsContextProvider,
      wrappingComponentProps: {
        services: mockedContext,
      },
    });

    expect(component).toMatchSnapshot();
  });
});
