/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { WorkspaceForm } from './workspace_form';
import { coreMock } from '../../../../../core/public/mocks';

const mockCoreStart = coreMock.createStart();

const setup = (isDashboardAdmin = true) => {
  const application = {
    ...mockCoreStart.application,
    capabilities: {
      ...mockCoreStart.application.capabilities,
      dashboards: {
        isDashboardAdmin,
      },
    },
  };
  const savedObjects = {
    ...mockCoreStart.savedObjects,
    client: {
      ...mockCoreStart.savedObjects.client,
      find: jest.fn().mockImplementation(() => {
        return new Promise(() => {});
      }),
    },
  };
  return render(<WorkspaceForm application={application} savedObjects={savedObjects} />);
};

describe('WorkspaceForm', () => {
  it('should enable data source panel for dashboard admin', () => {
    const { getByText } = setup(true);

    expect(getByText('Select Data Sources')).toBeInTheDocument();
  });

  it('should not display data source panel for non dashboard admin', () => {
    const { queryByText } = setup(false);

    expect(queryByText('Select Data Sources')).not.toBeInTheDocument();
  });
});
