/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { CreateDataSourcePanel } from './create_data_source_panel';
import { CreateDataSourcePanelHeader } from './create_data_source_panel_header';
import { CreateDataSourceCardView } from './create_data_source_card_view';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getCreateBreadcrumbs } from '../breadcrumbs';
import { RouteComponentProps } from 'react-router-dom';
import { navigationPluginMock } from 'src/plugins/navigation/public/mocks';

jest.mock('../../../../opensearch_dashboards_react/public');
jest.mock('../breadcrumbs');
jest.mock('./create_data_source_panel_header', () => ({
  CreateDataSourcePanelHeader: () => <div>CreateDataSourcePanelHeader</div>,
}));
jest.mock('./create_data_source_card_view', () => ({
  CreateDataSourceCardView: () => <div>CreateDataSourceCardView</div>,
}));

describe('CreateDataSourcePanel', () => {
  const mockedContext = {
    services: {
      chrome: {},
      setBreadcrumbs: jest.fn(),
      notifications: {
        toasts: {
          addSuccess: jest.fn(),
          addDanger: jest.fn(),
        },
      },
      uiSettings: {},
      navigation: navigationPluginMock.createStartContract(),
    },
  };

  beforeAll(() => {
    (useOpenSearchDashboards as jest.Mock).mockReturnValue(mockedContext);
    (getCreateBreadcrumbs as jest.Mock).mockReturnValue([{ text: 'Create Data Source' }]);
  });

  const defaultProps: RouteComponentProps & { featureFlagStatus: boolean } = {
    featureFlagStatus: true,
    history: { push: jest.fn() } as any,
    location: {} as any,
    match: {} as any,
  };

  const shallowComponent = (props = defaultProps) => shallow(<CreateDataSourcePanel {...props} />);

  test('renders correctly', () => {
    const wrapper = shallowComponent();
    expect(wrapper).toMatchSnapshot();
  });

  test('renders CreateDataSourcePanelHeader and CreateDataSourceCardView', () => {
    const wrapper = shallowComponent();
    expect(wrapper.find(CreateDataSourcePanelHeader)).toHaveLength(1);
    expect(wrapper.find(CreateDataSourceCardView)).toHaveLength(1);
  });
});
