/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount, shallow } from 'enzyme';
// @ts-expect-error TS7016 TODO(ts-error): fixme
import Adapter from 'enzyme-adapter-react-16';
import React from 'react';
import { SetupIntegrationForm, SetupBottomBar, LoadingPage } from './setup_integration';
import { HttpStart } from 'opensearch-dashboards/public';
import { act } from 'react-dom/test-utils';
import { TEST_INTEGRATION_CONFIG } from '../../../mocks';

const mockHttp: Partial<HttpStart> = {
  get: jest.fn().mockResolvedValue({
    data: TEST_INTEGRATION_CONFIG,
  }),
  post: jest.fn(),
};

configure({ adapter: new Adapter() });

describe('SetupIntegrationForm tests', () => {
  const setupProps = {
    integration: 'test_integration',
    renderType: 'page',
    http: mockHttp as HttpStart,
  };

  it('renders SetupIntegrationForm', () => {
    // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
    const wrapper = shallow(<SetupIntegrationForm {...setupProps} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('displays loading page when showLoading is true', () => {
    // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
    const wrapper = mount(<SetupIntegrationForm {...setupProps} />);
    const setupBottomBar = wrapper.find(SetupBottomBar).first();

    act(() => {
      setupBottomBar.prop('setLoading')(true);
    });

    wrapper.update();
    expect(wrapper.find(LoadingPage)).toHaveLength(1);
  });

  it('renders SetupBottomBar with correct props', () => {
    // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
    const wrapper = mount(<SetupIntegrationForm {...setupProps} />);

    act(() => {
      wrapper.update();
    });

    const setupBottomBar = wrapper.find(SetupBottomBar).first();

    expect(setupBottomBar.prop('config')).toMatchObject({
      displayName: 'test_integration Integration',
      connectionType: 'index',
      connectionDataSource: '',
      connectionLocation: '',
      checkpointLocation: '',
      connectionTableName: 'test_integration',
      enabledWorkflows: [],
    });

    // Check only the properties that should be initially set
    expect(setupBottomBar.prop('integration')).toMatchObject({
      name: 'test_integration',
      type: '',
      assets: [],
      version: '',
      license: '',
      components: [],
    });
  });

  // New snapshot test
  it('renders SetupIntegrationForm and matches snapshot', () => {
    // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
    const wrapper = mount(<SetupIntegrationForm {...setupProps} />);
    expect(wrapper).toMatchSnapshot();
  });
});
