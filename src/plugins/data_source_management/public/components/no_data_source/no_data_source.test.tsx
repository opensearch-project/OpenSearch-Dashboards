/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShallowWrapper, shallow } from 'enzyme';
import React from 'react';
import { render } from '@testing-library/react';
import { NoDataSource } from './no_data_source';
import { coreMock } from '../../../../../core/public/mocks';
import { DSM_APP_ID } from '../../plugin';

describe('NoDataSource', () => {
  let component: ShallowWrapper<any, Readonly<{}>, React.Component<{}, {}, any>>;
  const totalDataSourceCount = 0;
  const nextTick = () => new Promise((res) => process.nextTick(res));

  it('should render correctly with the provided totalDataSourceCount', () => {
    const wrapper = shallow(<NoDataSource totalDataSourceCount={totalDataSourceCount} />);
    expect(wrapper).toMatchSnapshot();
  });

  it('should display popover when click "No data sources" button', async () => {
    const applicationMock = coreMock.createStart().application;
    const container = render(
      <NoDataSource totalDataSourceCount={totalDataSourceCount} application={applicationMock} />
    );

    await nextTick();

    const button = await container.findByTestId('dataSourceEmptyStateHeaderButton');
    button.click();

    expect(container.getByTestId('dataSourceEmptyStatePopover')).toBeVisible();
  });

  it('should call application.navigateToApp when the "Manage" link is clicked', async () => {
    const applicationMock = coreMock.createStart().application;
    const navigateToAppMock = applicationMock.navigateToApp;

    const container = render(
      <NoDataSource totalDataSourceCount={totalDataSourceCount} application={applicationMock} />
    );

    await nextTick();

    const button = await container.findByTestId('dataSourceEmptyStateHeaderButton');
    button.click();
    const redirectButton = await container.findByTestId(
      'dataSourceEmptyStateManageDataSourceButton'
    );
    redirectButton.click();
    expect(navigateToAppMock).toHaveBeenCalledWith('management', {
      path: `opensearch-dashboards/${DSM_APP_ID}`,
    });
  });

  it('should render normally', () => {
    component = shallow(<NoDataSource totalDataSourceCount={0} />);
    expect(component).toMatchSnapshot();
  });
});
