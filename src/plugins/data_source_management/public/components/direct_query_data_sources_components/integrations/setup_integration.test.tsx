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
  get: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: TEST_INTEGRATION_CONFIG,
    })
  ),
  post: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data_streams: [],
    })
  ),
};

configure({ adapter: new Adapter() });

describe('SetupIntegrationForm tests', () => {
  const setupProps = {
    integration: 'test_integration',
    renderType: 'page',
    http: mockHttp as HttpStart,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('renders SetupIntegrationForm', async () => {
    let wrapper: any;
    await act(async () => {
      // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
      wrapper = shallow(<SetupIntegrationForm {...setupProps} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(wrapper).toMatchSnapshot();
  });

  it('displays loading page when showLoading is true', async () => {
    let wrapper: any;
    await act(async () => {
      // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
      wrapper = mount(<SetupIntegrationForm {...setupProps} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // Wait for initial rendering and effects to complete
    await act(async () => {
      wrapper.update();
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const setupBottomBar = wrapper.find(SetupBottomBar).first();

    // Simulate clicking the loading button
    await act(async () => {
      setupBottomBar.prop('setLoading')(true);
    });

    await act(async () => {
      wrapper.update();
    });

    expect(wrapper.find(LoadingPage)).toHaveLength(1);
  });

  it('renders SetupBottomBar with correct props', async () => {
    let wrapper: any;
    await act(async () => {
      // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
      wrapper = mount(<SetupIntegrationForm {...setupProps} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
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

    // Check that integration prop contains the fetched data
    expect(setupBottomBar.prop('integration')).toMatchObject({
      name: 'sample',
      type: 'logs',
      license: 'Apache-2.0',
      version: '2.0.0',
    });
  });

  // New snapshot test
  it('renders SetupIntegrationForm and matches snapshot', async () => {
    let wrapper: any;
    await act(async () => {
      // @ts-expect-error TS2322, TS2786 TODO(ts-error): fixme
      wrapper = mount(<SetupIntegrationForm {...setupProps} />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(wrapper).toMatchSnapshot();
  });
});
