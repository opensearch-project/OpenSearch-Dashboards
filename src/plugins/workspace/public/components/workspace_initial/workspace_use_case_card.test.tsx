/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { WorkspaceUseCaseCard } from './workspace_use_case_card';
import * as utils from './utils';
import { applicationServiceMock, httpServiceMock } from '../../../../../core/public/mocks';

describe('WorkspaceUseCaseCard', () => {
  const applicationMock = applicationServiceMock.createStartContract();
  const httpMock = httpServiceMock.createStartContract();
  const mockWorkspaces = [
    {
      id: 'workspace 1',
      name: 'Workspace 1',
      features: ['use-case-observability'],
      visitedMessage: 'Viewed 1 day ago',
    },
    {
      id: 'workspace 2',
      name: 'Workspace 2',
      features: ['use-case-observability'],
      visitedMessage: 'Not visited recently',
    },
  ];

  const mockUseCase = {
    id: 'observability',
    title: 'Observability',
    description:
      'Gain visibility into system health, performance, and reliability through monitoring of logs, metrics and traces.',
    features: [],
    icon: 'wsObservability',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the workspaces and button correctly', () => {
    jest.spyOn(utils, 'getWorkspacesWithRecentMessage').mockReturnValue(mockWorkspaces);
    const { getByText, getByTestId } = render(
      <WorkspaceUseCaseCard
        useCase={mockUseCase}
        workspaces={mockWorkspaces}
        application={applicationMock}
        http={httpMock}
        isDashboardAdmin={true}
        handleClickUseCaseInformation={jest.fn}
      />
    );

    expect(getByText('Observability')).toBeInTheDocument();
    expect(getByText('Workspace 1')).toBeInTheDocument();
    expect(getByText('Workspace 2')).toBeInTheDocument();
    expect(getByText('Viewed 1 day ago')).toBeInTheDocument();
    expect(getByText('Not visited recently')).toBeInTheDocument();
    expect(
      getByTestId('workspace-initial-useCaseCard-observability-button-createWorkspace')
    ).toBeInTheDocument();
    expect(
      getByTestId('workspace-initial-useCaseCard-observability-button-view')
    ).toBeInTheDocument();
  });

  it('should show the "Create workspace" button and show admin information for OSD admin user if there is no workspace', () => {
    jest.spyOn(utils, 'getWorkspacesWithRecentMessage').mockReturnValue([]);
    const { queryByText, queryByTestId } = render(
      <WorkspaceUseCaseCard
        useCase={mockUseCase}
        workspaces={[]}
        application={applicationMock}
        http={httpMock}
        isDashboardAdmin={true}
        handleClickUseCaseInformation={jest.fn}
      />
    );

    expect(
      queryByTestId('workspace-initial-useCaseCard-observability-button-createWorkspace')
    ).toBeInTheDocument();
    expect(
      queryByText('Create a workspace or request a workspace owner to add you as a collaborator.')
    ).toBeInTheDocument();
  });

  it('should not show the "Create workspace" button and show no admin information for non OSD admin user if there is no workspace', () => {
    jest.spyOn(utils, 'getWorkspacesWithRecentMessage').mockReturnValue([]);
    const { queryByText, queryByTestId } = render(
      <WorkspaceUseCaseCard
        useCase={mockUseCase}
        workspaces={[]}
        application={applicationMock}
        http={httpMock}
        isDashboardAdmin={false}
        handleClickUseCaseInformation={jest.fn}
      />
    );

    expect(
      queryByTestId('workspace-initial-useCaseCard-observability-button-createWorkspace')
    ).toBeNull();
    expect(
      queryByText('Request a workspace owner to add you as a collaborator.')
    ).toBeInTheDocument();
  });
});
