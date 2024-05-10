/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { shallow } from 'enzyme';
import { getManageDataSourceButton } from './manage_data_source_button';
import { coreMock } from '../../../../../core/public/mocks';
import { DSM_APP_ID } from '../../plugin';
import { render } from '@testing-library/react';

describe('ManageDataSourceButton', () => {
  const applicationMock = coreMock.createStart().application;

  it('renders without crashing', () => {
    const wrapper = render(getManageDataSourceButton());
    expect(wrapper).toBeTruthy();
  });

  it('renders a button with correct label', () => {
    const { getByTestId } = render(getManageDataSourceButton(applicationMock));
    const container = getByTestId('manageDataSourceButtonContainer');
    expect(container).toBeInTheDocument();
    expect(container).toHaveTextContent('Manage data sources');
  });

  it('navigates to management app on button click', () => {
    const { getByTestId } = render(getManageDataSourceButton(applicationMock));
    const button = getByTestId('manageDataSourceButton');
    button.click();
    expect(applicationMock.navigateToApp).toHaveBeenCalledTimes(1);

    expect(applicationMock.navigateToApp).toHaveBeenCalledWith('management', {
      path: `opensearch-dashboards/${DSM_APP_ID}`, // Assuming DSM_APP_ID is replaced with a value
    });
  });
});
