/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { IntlProvider } from 'react-intl';
import { render, screen, fireEvent } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { createMockedRegisteredUseCases$ } from '../../mocks';

import { UseCaseFooter as UseCaseFooterComponent, UseCaseFooterProps } from './use_case_footer';

describe('UseCaseFooter', () => {
  // let coreStartMock: CoreStart;
  const navigateToApp = jest.fn();
  const registeredUseCases$ = createMockedRegisteredUseCases$();

  const getMockCore = (isDashboardAdmin: boolean = true) => {
    const coreStartMock = coreMock.createStart();
    coreStartMock.application.capabilities = {
      ...coreStartMock.application.capabilities,
      dashboards: { isDashboardAdmin },
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

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const UseCaseFooter = (props: UseCaseFooterProps) => {
    return (
      <IntlProvider locale="en">
        <UseCaseFooterComponent {...props} />
      </IntlProvider>
    );
  };
  it('renders create workspace button for admin when no workspaces within use case exist', () => {
    const { getByTestId } = render(
      <UseCaseFooter
        useCaseId="analytics"
        useCaseTitle="Analytics"
        core={getMockCore()}
        registeredUseCases$={registeredUseCases$}
      />
    );

    const button = getByTestId('useCase.footer.createWorkspace.button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
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
        core={getMockCore(false)}
        registeredUseCases$={registeredUseCases$}
      />
    );

    const button = getByTestId('useCase.footer.createWorkspace.button');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByText('Unable to create workspace')).toBeInTheDocument();
    expect(screen.queryByTestId('useCase.footer.modal.create.button')).not.toBeInTheDocument();
    fireEvent.click(getByTestId('useCase.footer.modal.close.button'));
  });

  it('renders open workspace button when one workspace exists', () => {
    const core = getMockCore();
    core.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: ['use-case-observability'] },
    ]);
    const { getByTestId } = render(
      <UseCaseFooter
        useCaseId="observability"
        useCaseTitle="Observability"
        core={core}
        registeredUseCases$={registeredUseCases$}
      />
    );

    const button = getByTestId('useCase.footer.openWorkspace.button');
    expect(button).toBeInTheDocument();
    expect(button).not.toBeDisabled();
    expect(button).toHaveAttribute('href', 'https://test.com/w/workspace-1/app/discover');
  });

  it('renders select workspace popover when multiple workspaces exist', () => {
    const core = getMockCore();
    core.workspaces.workspaceList$.next([
      { id: 'workspace-1', name: 'workspace 1', features: ['use-case-observability'] },
      { id: 'workspace-2', name: 'workspace 2', features: ['use-case-observability'] },
    ]);

    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      value: {
        assign: jest.fn(),
      },
    });

    render(
      <UseCaseFooter
        useCaseId="observability"
        useCaseTitle="Observability"
        core={core}
        registeredUseCases$={registeredUseCases$}
      />
    );

    const button = screen.getByText('Select workspace');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText('workspace 1')).toBeInTheDocument();
    expect(screen.getByText('workspace 2')).toBeInTheDocument();
    expect(screen.getByText('Observability Workspaces')).toBeInTheDocument();

    const inputElement = screen.getByPlaceholderText('Search');
    expect(inputElement).toBeInTheDocument();
    fireEvent.change(inputElement, { target: { value: 'workspace 1' } });
    expect(screen.queryByText('workspace 2')).toBeNull();

    fireEvent.click(screen.getByText('workspace 1'));
    expect(window.location.assign).toHaveBeenCalledWith(
      'https://test.com/w/workspace-1/app/discover'
    );
    Object.defineProperty(window, 'location', {
      value: originalLocation,
    });
  });
});
