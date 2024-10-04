/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { render, screen, fireEvent } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';

import { UseCaseCardTitle, UseCaseCardTitleProps } from './use_case_card_title';
import { WorkspaceUseCase } from '../../types';

describe('UseCaseCardTitle', () => {
  const navigateToApp = jest.fn();
  const getMockCore = () => {
    const coreStartMock = coreMock.createStart();
    coreStartMock.application.capabilities = {
      ...coreStartMock.application.capabilities,
    };
    coreStartMock.application = {
      ...coreStartMock.application,
      navigateToApp,
    };
    jest.spyOn(coreStartMock.application, 'getUrlForApp').mockImplementation((appId: string) => {
      return `https://test.com/app/${appId}`;
    });
    return coreStartMock;
  };

  const useCaseMock: WorkspaceUseCase = {
    id: 'essentials',
    title: 'Essentials',
    description:
      'Analyze data to derive insights, identify patterns and trends, and make data-driven decisions.',
    features: [
      {
        id: 'essentials_overview',
        title: 'Overview',
      },
      {
        id: 'discover',
        title: 'Discover',
      },
    ],
    systematic: false,
    order: 7000,
  };

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const UseCaseCardTitleComponent = (props: UseCaseCardTitleProps) => {
    return (
      <IntlProvider locale="en">
        <UseCaseCardTitle {...props} />
      </IntlProvider>
    );
  };
  it('renders create workspace button when no workspaces within use case exist', () => {
    const { getByTestId, getByText } = render(
      <UseCaseCardTitleComponent filterWorkspaces={[]} useCase={useCaseMock} core={getMockCore()} />
    );

    const dropDownButton = getByTestId('workspace.getStartCard.essentials.icon.button');
    expect(dropDownButton).toBeInTheDocument();
    fireEvent.click(dropDownButton);

    expect(getByText('No workspaces available')).toBeInTheDocument();

    const createWorkspaceButton = getByTestId(
      'workspace.getStartCard.essentials.popover.createWorkspace.button'
    );
    expect(createWorkspaceButton).toBeInTheDocument();
    expect(createWorkspaceButton).toHaveAttribute('href', 'https://test.com/app/workspace_create');
  });

  it('renders select workspace popover when multiple workspaces exist', () => {
    const workspaces = [
      { id: 'workspace-1', name: 'workspace 1', features: ['essentials'] },
      { id: 'workspace-2', name: 'workspace 2', features: ['essentials'] },
    ];

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    const { getByTestId, getByText } = render(
      <UseCaseCardTitleComponent
        filterWorkspaces={workspaces}
        useCase={useCaseMock}
        core={getMockCore()}
      />
    );

    const dropDownButton = getByTestId('workspace.getStartCard.essentials.icon.button');
    expect(dropDownButton).toBeInTheDocument();
    fireEvent.click(dropDownButton);

    expect(getByText('SELECT WORKSPACE')).toBeInTheDocument();
    expect(getByText('workspace 1')).toBeInTheDocument();
    expect(getByText('workspace 2')).toBeInTheDocument();

    const inputElement = screen.getByPlaceholderText('Search workspace name');
    expect(inputElement).toBeInTheDocument();
    fireEvent.change(inputElement, { target: { value: 'workspace 1' } });
    expect(screen.queryByText('workspace 2')).toBeNull();

    fireEvent.click(screen.getByText('workspace 1'));
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/essentials_overview'
    );
    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });
});
