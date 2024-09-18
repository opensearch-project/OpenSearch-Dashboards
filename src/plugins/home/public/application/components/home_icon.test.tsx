/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { HomeIcon } from './home_icon';
import { coreMock } from '../../../../../core/public/mocks';

describe('<HomeIcon />', () => {
  it('should call chrome.navGroup.setCurrentNavGroup and application.navigateToApp methods from core service when click', () => {
    const coreStartMock = coreMock.createStart();
    const { container } = render(<HomeIcon core={coreStartMock} appId="foo" />);
    const component = container.children[0].children[0];
    fireEvent.click(component);
    expect(coreStartMock.application.navigateToApp).toBeCalledWith('foo');
  });
});
