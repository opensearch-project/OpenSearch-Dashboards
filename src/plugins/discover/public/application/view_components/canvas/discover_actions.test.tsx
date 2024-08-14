/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DiscoverActions } from './discover_actions';
import {
  DiscoverAction,
  DiscoverActionContext,
} from '../../../../../../plugins/data_explorer/public';

jest.mock('@elastic/eui', () => ({
  EuiButtonEmpty: jest.requireActual('@elastic/eui').EuiButtonEmpty,
}));

const mockActions: DiscoverAction[] = [
  { order: 2, iconType: 'icon1', name: 'Action 2', onClick: jest.fn() },
  { order: 1, iconType: 'icon2', name: 'Action 1', onClick: jest.fn() },
  { order: 3, iconType: 'icon3', name: 'Action 3', onClick: jest.fn() },
];

const mockContext: DiscoverActionContext = {
  indexPattern: undefined,
};

describe('DiscoverActions Component', () => {
  it('renders all actions in the correct order', () => {
    render(<DiscoverActions actions={mockActions} context={mockContext} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('Action 1');
    expect(buttons[1]).toHaveTextContent('Action 2');
    expect(buttons[2]).toHaveTextContent('Action 3');
  });

  it('calls the action onClick function with the correct context', () => {
    render(<DiscoverActions actions={mockActions} context={mockContext} />);

    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(mockActions[0].onClick).toHaveBeenCalledWith(mockContext);
  });
});
