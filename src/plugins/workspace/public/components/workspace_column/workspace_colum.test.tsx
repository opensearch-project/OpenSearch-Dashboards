/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { render, fireEvent } from '@testing-library/react';
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

  it('should show workspace name badge correctly', async () => {
    const workspaces = ['ws-1', 'ws-2'];
    const { findByTestId, findByText, container } = render(
      <WorkspaceColumn coreSetup={coreSetup} workspaces={workspaces} />
    );
    const badge = await findByTestId('workspace-column-more-workspaces-badge');
    expect(badge).toBeInTheDocument();
    fireEvent.click(badge);
    expect(await findByTestId('workspace-column-popover')).toBeInTheDocument();
    expect(await findByText('foo')).toBeInTheDocument();
    expect(await findByText('bar')).toBeInTheDocument();
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="euiText euiText--small"
        >
          foo
        </div>
          
        <span
          class="euiBadge euiBadge--hollow euiBadge--iconRight"
        >
          <span
            class="euiBadge__content"
          >
            <button
              aria-label="Open workspaces popover"
              class="euiBadge__childButton"
              data-test-subj="workspace-column-more-workspaces-badge"
              title="+ 1 more"
            >
              + 
              1
               more
            </button>
            <button
              aria-label="Open workspaces popover"
              class="euiBadge__iconButton"
              title="Open workspaces popover"
              type="button"
            >
              <span
                class="euiBadge__icon"
                color="inherit"
                data-euiicon-type="popout"
              />
            </button>
          </span>
        </span>
        <div
          class="euiPopover euiPopover--anchorRightCenter euiPopover-isOpen"
          data-test-subj="workspace-column-popover"
        >
          <div
            class="euiPopover__anchor"
          />
        </div>
      </div>
    `);
  });

  it('show  — when no workspace', () => {
    const { container } = render(<WorkspaceColumn coreSetup={coreSetup} />);

    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="euiText euiText--small"
        >
          —
        </div>
      </div>
    `);
  });

  it('show empty when workspace can not found', () => {
    const { container } = render(<WorkspaceColumn coreSetup={coreSetup} workspaces={['ws-404']} />);
    expect(container).toMatchInlineSnapshot(`
      <div>
        <div
          class="euiText euiText--small"
        >
          —
        </div>
      </div>
    `);
  });
});
