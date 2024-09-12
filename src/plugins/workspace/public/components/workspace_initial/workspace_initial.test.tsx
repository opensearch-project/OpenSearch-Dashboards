/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import React from 'react';
import { WorkspaceInitial } from './workspace_initial';
import { coreMock } from '../../../../../core/public/mocks';
import { createOpenSearchDashboardsReactContext } from '../../../../opensearch_dashboards_react/public';

const mockCoreStart = coreMock.createStart();
const WorkspaceInitialPage = (props: { isDashboardAdmin: boolean }) => {
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
    <Provider>
      <WorkspaceInitial />
    </Provider>
  );
};

describe('WorkspaceInitial', () => {
  it('render workspace initial page normally when user is dashboard admin', async () => {
    const { container } = render(<WorkspaceInitialPage isDashboardAdmin={true} />);
    expect(container).toMatchSnapshot();
  });

  it('render workspace initial page normally when user is non dashboard admin', async () => {
    const { container } = render(<WorkspaceInitialPage isDashboardAdmin={false} />);
    expect(container).toMatchSnapshot();
  });

  it('render workspace initial page normally when theme is dark mode', async () => {
    mockCoreStart.uiSettings.get.mockReturnValue(true);
    const { container } = render(<WorkspaceInitialPage isDashboardAdmin={true} />);
    expect(container).toMatchSnapshot();
  });
});
