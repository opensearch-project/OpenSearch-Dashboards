/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { WorkspaceInitial } from './workspace_initial';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';
import { createMockedRegisteredUseCases$ } from '../../mocks';
import { IntlProvider } from 'react-intl';
import { of } from 'rxjs';
import { ChromeNavControl } from 'opensearch-dashboards/public';

const mockNavControls: ChromeNavControl[] = [
  { mount: jest.fn(), order: 1 },
  { mount: jest.fn(), order: 2 },
  { mount: jest.fn(), order: 3 },
];
const mockCoreStart = coreMock.createStart();
const registeredUseCases$ = createMockedRegisteredUseCases$();
const WorkspaceInitialPage = (props: { isDashboardAdmin: boolean }) => {
  mockCoreStart.chrome.navControls.getLeftBottom$.mockReturnValue(of(mockNavControls));

  const { isDashboardAdmin } = props;
  const { Provider } = createOpenSearchDashboardsReactContext({
    ...mockCoreStart,
    ...{
      application: {
        ...mockCoreStart.application,
        capabilities: {
          ...mockCoreStart.application.capabilities,
          dashboards: {
            isDashboardAdmin,
          },
        },
      },
    },
  });

  return (
    <IntlProvider locale="en">
      <Provider>
        <WorkspaceInitial registeredUseCases$={registeredUseCases$} />
      </Provider>
    </IntlProvider>
  );
};

describe('WorkspaceInitial', () => {
  it('render workspace initial page normally when user is OSD admin', async () => {
    const { container } = render(<WorkspaceInitialPage isDashboardAdmin={true} />);
    expect(container).toMatchSnapshot();
  });

  it('render workspace initial page normally when user is non OSD admin', async () => {
    const { container } = render(<WorkspaceInitialPage isDashboardAdmin={false} />);
    expect(container).toMatchSnapshot();
  });

  it('it should click create workspace button popover when user is OSD admin', async () => {
    const { getByTestId, queryByTestId } = render(<WorkspaceInitialPage isDashboardAdmin={true} />);
    const button = getByTestId('workspace-initial-card-createWorkspace-button');
    expect(button).toBeInTheDocument();
    expect(queryByTestId('workspace-initial-button-create-search-workspace')).toBeNull();
    fireEvent.click(button);
    expect(getByTestId('workspace-initial-button-create-search-workspace')).toBeInTheDocument();
  });

  it('it should click use case information button and show the flyout', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <WorkspaceInitialPage isDashboardAdmin={true} />
    );
    const button = getByTestId('workspace-initial-useCaseCard-search-button-information');
    expect(button).toBeInTheDocument();
    expect(queryByText('Use cases')).toBeNull();
    fireEvent.click(button);
    expect(getByText('Use cases')).toBeInTheDocument();
    fireEvent.click(getByTestId('euiFlyoutCloseButton'));
    expect(queryByText('Use cases')).toBeNull();
  });
});
