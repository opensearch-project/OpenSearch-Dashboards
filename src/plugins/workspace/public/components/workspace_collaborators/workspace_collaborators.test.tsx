/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { coreMock } from '../../../../../core/public/mocks';
import { WorkspaceCollaborators } from './workspace_collaborators';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';
import { of } from 'rxjs';

const setup = () => {
  const coreStartMock = coreMock.createStart();
  const services = {
    ...coreStartMock,
    navigationUI: {
      HeaderControl: () => null,
    },
    collaboratorTypes: {
      getTypes$: () => of([]),
    },
  };
  const renderResult = render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceCollaborators />
    </OpenSearchDashboardsContextProvider>
  );
  return {
    renderResult,
  };
};

describe('WorkspaceCollaborators', () => {
  it('should render normally', () => {
    const { renderResult } = setup();
    expect(renderResult).toMatchSnapshot();
  });
});
