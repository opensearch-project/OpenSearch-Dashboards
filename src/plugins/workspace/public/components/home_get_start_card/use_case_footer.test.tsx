/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UseCaseFooter as UseCaseFooterComponent } from './use_case_footer';
import { httpServiceMock } from '../../../../../core/public/mocks';
import { IntlProvider } from 'react-intl';

const mockBasePath = httpServiceMock.createSetupContract().basePath;
const getUrl = (appId: string) => `https://test.com/app/${appId}`;

const createWorkspace = (id: string, name: string, useCaseId: string) => ({
  id,
  name,
  description: '',
  features: [useCaseId],
  reserved: false,
  permissions: {
    library_write: { users: [] },
    write: { users: [] },
  },
});

const UseCaseFooter = (props: any) => {
  return (
    <IntlProvider locale="en">
      <UseCaseFooterComponent {...props} />
    </IntlProvider>
  );
};

describe('UseCaseFooter', () => {
  it('renders create workspace button for admin when no workspaces within use case exist', () => {
    const { getByTestId } = render(
      <UseCaseFooter
        useCaseId="analytics"
        useCaseTitle="Analytics"
        workspaceList={[]}
        basePath={mockBasePath}
        isDashBoardAdmin={true}
        getUrl={getUrl}
      />
    );

    const button = getByTestId('useCase.footer.createWorkspace.button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByText('No workspaces found')).toBeInTheDocument();
    const createWorkspaceButtonInModal = getByTestId('useCase.footer.modal.create.button');
    expect(createWorkspaceButtonInModal).toHaveAttribute(
      'href',
      'https://test.com/app/workspace_create'
    );
  });

  it('renders create workspace button for non-admin when no workspaces within use case exist', () => {
    const { getByTestId } = render(
      <UseCaseFooter
        useCaseId="analytics"
        useCaseTitle="Analytics"
        workspaceList={[]}
        basePath={mockBasePath}
        isDashBoardAdmin={false}
        getUrl={getUrl}
      />
    );

    const button = getByTestId('useCase.footer.createWorkspace.button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByText('Unable to create workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('useCase.footer.modal.create.button')).not.toBeInTheDocument();
  });

  it('renders open workspace button when one workspace exists', () => {
    const { getByTestId } = render(
      <UseCaseFooter
        useCaseId="observability"
        useCaseTitle="Observability"
        workspaceList={[createWorkspace('1', 'Workspace 1', 'use-case-observability')]}
        basePath={mockBasePath}
        isDashBoardAdmin={false}
        getUrl={getUrl}
      />
    );

    const button = getByTestId('useCase.footer.openWorkspace.button');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('href', 'https://test.com/w/1/app/workspace_overview');
  });

  it('renders select workspace popover when multiple workspaces exist', () => {
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });
    const workspaces = [
      createWorkspace('1', 'Workspace 1', 'use-case-observability'),
      createWorkspace('2', 'Workspace 2', 'use-case-observability'),
    ];
    render(
      <UseCaseFooter
        useCaseId="observability"
        useCaseTitle="Observability"
        workspaceList={workspaces}
        basePath={mockBasePath}
        isDashBoardAdmin={false}
        getUrl={getUrl}
      />
    );

    const button = screen.getByText('Select workspace');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText('Workspace 1')).toBeInTheDocument();
    expect(screen.getByText('Workspace 2')).toBeInTheDocument();
    expect(screen.getByText('Observability Workspaces')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Workspace 1'));
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/1/app/workspace_overview'
    );
    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });
});
