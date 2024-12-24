/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { mount, shallow } from 'enzyme';
import { coreMock } from '../../../../../core/public/mocks';
import { DSM_APP_ID } from '../../plugin';
import { DataSourceDropDownHeader } from '.';

describe('DataSourceDropDownHeader', () => {
  it('should render correctly with the provided totalDataSourceCount', () => {
    const totalDataSourceCount = 5;
    const wrapper = shallow(
      <DataSourceDropDownHeader totalDataSourceCount={totalDataSourceCount} />
    );
    expect(wrapper).toMatchSnapshot();
  });

  it('should render "DATA SOURCES" when totalDataSourceCount is greater than 1', () => {
    const totalDataSourceCount = 5;
    const wrapper = mount(<DataSourceDropDownHeader totalDataSourceCount={totalDataSourceCount} />);
    expect(wrapper.text()).toContain('DATA SOURCES');
  });

  it.each([1, 0])(
    'should render "DATA SOURCE" when totalDataSourceCount is %s',
    (totalDataSourceCount) => {
      const wrapper = mount(
        <DataSourceDropDownHeader totalDataSourceCount={totalDataSourceCount} />
      );
      expect(wrapper.text()).toContain('DATA SOURCE');
    }
  );

  it('should render the activeDataSourceCount/totalDataSourceCount when both provided', () => {
    const totalDataSourceCount = 5;
    const activeDataSourceCount = 2;
    const wrapper = mount(
      <DataSourceDropDownHeader
        totalDataSourceCount={totalDataSourceCount}
        activeDataSourceCount={activeDataSourceCount}
      />
    );
    expect(wrapper).toMatchSnapshot();
    expect(wrapper.text()).toContain(`${activeDataSourceCount}/${totalDataSourceCount}`);
  });

  it('should call application.navigateToApp and close the modal mask when the "Manage" link is clicked', () => {
    const totalDataSourceCount = 5;
    const applicationMock = coreMock.createStart().application;
    const navigateToAppMock = applicationMock.navigateToApp;
    const onManageDataSourceMock = jest.fn();
    const wrapper = mount(
      <DataSourceDropDownHeader
        totalDataSourceCount={totalDataSourceCount}
        application={applicationMock}
        onManageDataSource={onManageDataSourceMock}
      />
    );

    wrapper.find('EuiLink').simulate('click');
    expect(navigateToAppMock).toHaveBeenCalledWith('management', {
      path: `opensearch-dashboards/${DSM_APP_ID}`,
    });
    expect(onManageDataSourceMock).toHaveBeenCalled();
  });
});
