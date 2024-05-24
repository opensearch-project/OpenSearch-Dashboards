/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { RightNavigationButton } from './right_navigation_button';
import { applicationServiceMock, httpServiceMock } from '../../../../../core/public/mocks';

const mockProps = {
  application: applicationServiceMock.createStartContract(),
  http: httpServiceMock.createStartContract(),
  appId: 'app_id',
  iconType: 'mock_icon',
  title: 'title',
};

describe('Right navigation button', () => {
  it('should render base element normally', () => {
    const { baseElement } = render(<RightNavigationButton {...mockProps} />);
    expect(baseElement).toMatchSnapshot();
  });

  it('should call application getUrlForApp and navigateToUrl after clicked', () => {
    const navigateToUrl = jest.fn();
    const getUrlForApp = jest.fn();
    const props = {
      ...mockProps,
      application: {
        ...applicationServiceMock.createStartContract(),
        getUrlForApp,
        navigateToUrl,
      },
    };
    const { getByTestId } = render(<RightNavigationButton {...props} />);
    const icon = getByTestId('rightNavigationButton');
    fireEvent.click(icon);
    expect(getUrlForApp).toHaveBeenCalledWith('app_id', {
      path: '/',
      absolute: false,
    });
    expect(navigateToUrl).toHaveBeenCalled();
  });
});
