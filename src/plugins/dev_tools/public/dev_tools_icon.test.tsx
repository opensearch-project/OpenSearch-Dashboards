/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { DevToolsIcon } from './dev_tools_icon';
import { coreMock } from '../../../core/public/mocks';

describe('<DevToolsIcon />', () => {
  it('should call chrome.navGroup.setCurrentNavGroup and application.navigateToApp methods from core service when click', () => {
    const coreStartMock = coreMock.createStart();
    const { container } = render(<DevToolsIcon core={coreStartMock} appId="foo" />);
    const component = container.children[0];
    fireEvent.click(component);
    expect(coreStartMock.application.navigateToApp).toBeCalledWith('foo');
  });
});
