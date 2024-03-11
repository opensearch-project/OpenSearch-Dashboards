/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { render } from '@testing-library/react';
import { WorkspaceColumn } from './workspace_column';

describe('workspace column in saved objects page', () => {
  const coreSetup = coreMock.createSetup();
  const workspaceList = [
    {
      id: 'ws-1',
      name: 'foo',
    },
    {
      id: 'ws-2',
      name: 'bar',
    },
  ];
  coreSetup.workspaces.workspaceList$.next(workspaceList);

  it('should show workspace name correctly', () => {
    const workspaces = ['ws-1', 'ws-2'];
    const { container } = render(<WorkspaceColumn coreSetup={coreSetup} workspaces={workspaces} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="euiText euiText--medium"
        >
          foo | bar
        </div>
      </div>
    `);
  });

  it('show empty when no workspace', () => {
    const { container } = render(<WorkspaceColumn coreSetup={coreSetup} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="euiText euiText--medium"
        />
      </div>
    `);
  });

  it('show empty when workspace can not found', () => {
    const { container } = render(<WorkspaceColumn coreSetup={coreSetup} workspaces={['ws-404']} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="euiText euiText--medium"
        />
      </div>
    `);
  });
});
