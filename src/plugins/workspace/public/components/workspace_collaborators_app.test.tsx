/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { coreMock, workspacesServiceMock } from '../../../../core/public/mocks';
import { WorkspaceCollaboratorsApp } from './workspace_collaborators_app';
import { OpenSearchDashboardsContextProvider } from '../../../../plugins/opensearch_dashboards_react/public';

const setup = () => {
  const coreStartMock = coreMock.createStart();
  // Use BehaviorSubject instead of of([]) to avoid infinite loops with useObservable in React 18
  const collaboratorTypes$ = new BehaviorSubject([]);
  // Create a mock currentWorkspace$ as BehaviorSubject to avoid infinite loops
  const currentWorkspace$ = new BehaviorSubject(null);
  const services = {
    ...coreStartMock,
    workspaces: {
      ...workspacesServiceMock.createStartContract(),
      currentWorkspace$,
    },
    navigationUI: {
      HeaderControl: () => null,
    },
    collaboratorTypes: {
      getTypes$: () => collaboratorTypes$,
    },
  };
  const renderResult = render(
    <OpenSearchDashboardsContextProvider services={services}>
      <WorkspaceCollaboratorsApp />
    </OpenSearchDashboardsContextProvider>
  );
  return {
    renderResult,
  };
};

describe('WorkspaceCollaboratorsApp', () => {
  it('should render normally', () => {
    const { renderResult } = setup();
    expect(renderResult).toMatchSnapshot();
  });
});
