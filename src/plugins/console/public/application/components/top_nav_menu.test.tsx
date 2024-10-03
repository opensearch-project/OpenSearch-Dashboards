/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { MenuItemPosition, TopNavMenu, TopNavMenuItem } from './top_nav_menu';
import { render } from '@testing-library/react';

describe('TopNavMenu Component', () => {
  const mockedItems: TopNavMenuItem[] = [
    {
      id: 'foo',
      label: 'foo',
      description: 'foo',
      onClick: jest.fn(),
      testId: 'foo',
      position: MenuItemPosition.LEFT,
    },
    {
      id: 'bar',
      label: 'bar',
      description: 'bar',
      onClick: jest.fn(),
      testId: 'bar',
      position: MenuItemPosition.RIGHT,
    },
  ];
  it('should render correctly when not use updatedUX', () => {
    const { container } = render(<TopNavMenu items={mockedItems} useUpdatedUX={false} />);
    expect(container).toMatchSnapshot();
  });
  it('should render correctly when use updatedUX', () => {
    const { container } = render(<TopNavMenu items={mockedItems} useUpdatedUX />);
    expect(container).toMatchSnapshot();
  });
});
