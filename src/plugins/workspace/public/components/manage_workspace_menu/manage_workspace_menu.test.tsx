/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { ManageWorkspaceMenu } from './manage_workspace_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart, DEFAULT_APP_CATEGORIES, WorkspaceObject } from '../../../../../core/public';
import { WorkspaceUseCase } from '../../types';

// The embedded workspace switcher pulls in recent-workspace + moment machinery
// that isn't relevant here; stub it so we only assert that it is rendered.
jest.mock('../workspace_selector/workspace_selector', () => ({
  WorkspaceSelector: () => <div data-test-subj="mockWorkspaceSelector" />,
}));

const manageCategory = DEFAULT_APP_CATEGORIES.manageWorkspace;

// A nav group whose navLinks include manage-workspace links plus an unrelated one.
const navGroup = {
  id: 'observability',
  title: 'Observability',
  navLinks: [
    {
      id: 'workspace_detail',
      title: 'Workspace details',
      order: 100,
      euiIconType: 'spacesApp',
      category: manageCategory,
    },
    {
      id: 'objects',
      title: 'Saved objects',
      order: 500,
      euiIconType: 'package',
      category: manageCategory,
    },
    // Not a manage-workspace link — must be excluded from the menu.
    { id: 'discover', title: 'Discover', order: 1, category: DEFAULT_APP_CATEGORIES.investigate },
  ],
};

// The concrete chrome nav links that the registered links resolve against.
const chromeNavLinks = [
  { id: 'workspace_detail', title: 'Workspace details', baseUrl: '', href: '' },
  { id: 'objects', title: 'Saved objects', baseUrl: '', href: '' },
  { id: 'discover', title: 'Discover', baseUrl: '', href: '' },
];

const registeredUseCases$ = new BehaviorSubject<WorkspaceUseCase[]>([]);

const buildCore = (
  opts: {
    currentNavGroup?: any;
    currentWorkspace?: WorkspaceObject | null;
  } = {}
) => {
  // Use `in` so an explicit `undefined` (outside a workspace) is respected
  // rather than falling back to the default nav group.
  const currentNavGroup = 'currentNavGroup' in opts ? opts.currentNavGroup : (navGroup as any);
  const currentWorkspace = 'currentWorkspace' in opts ? opts.currentWorkspace! : null;
  const core = (coreMock.createStart() as unknown) as CoreStart;
  core.chrome.navGroup.getCurrentNavGroup$ = jest.fn(
    () => new BehaviorSubject(currentNavGroup)
  ) as any;
  core.chrome.navLinks.getNavLinks$ = jest.fn(() => new BehaviorSubject(chromeNavLinks)) as any;
  core.application.currentAppId$ = new BehaviorSubject('objects') as any;
  core.application.navigateToApp = jest.fn();
  core.workspaces.currentWorkspace$ = new BehaviorSubject(currentWorkspace) as any;
  return core;
};

const renderMenu = (core: CoreStart) =>
  render(<ManageWorkspaceMenu coreStart={core} registeredUseCases$={registeredUseCases$} />);

describe('<ManageWorkspaceMenu />', () => {
  beforeEach(() => {
    // Default: tour already dismissed so it doesn't interfere with popover tests.
    localStorage.setItem('workspace.manageWorkspaceMoved.tourDismissed', 'true');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders the trigger button', () => {
    const { getByTestId } = renderMenu(buildCore());
    expect(getByTestId('manageWorkspaceMenuButton')).toBeInTheDocument();
  });

  it('opens a popover with the workspace selector and manage links', () => {
    const { getByTestId, queryByTestId } = renderMenu(
      buildCore({ currentWorkspace: { id: 'ws-1', name: 'My WS' } as WorkspaceObject })
    );
    expect(queryByTestId('manageWorkspaceMenuPopover')).not.toBeInTheDocument();

    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));

    expect(getByTestId('manageWorkspaceMenuPopover')).toBeInTheDocument();
    // The embedded switcher is the same WorkspaceSelector used in the nav header.
    expect(getByTestId('manageWorkspaceMenuSelector')).toBeInTheDocument();
    expect(getByTestId('mockWorkspaceSelector')).toBeInTheDocument();
    expect(getByTestId('manageWorkspaceMenuItem-workspace_detail')).toBeInTheDocument();
    expect(getByTestId('manageWorkspaceMenuItem-objects')).toBeInTheDocument();
    // The non-manage-workspace link is excluded.
    expect(queryByTestId('manageWorkspaceMenuItem-discover')).not.toBeInTheDocument();
  });

  it('has no "All workspaces" row', () => {
    const { getByTestId, queryByTestId } = renderMenu(buildCore());
    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));
    expect(queryByTestId('manageWorkspaceMenuItem-allWorkspaces')).not.toBeInTheDocument();
  });

  it('shows the switcher even outside a workspace (no manage links)', () => {
    // Outside a workspace: no current nav group, no current workspace.
    const { getByTestId, queryByTestId } = renderMenu(
      buildCore({ currentNavGroup: undefined, currentWorkspace: null })
    );
    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));

    expect(getByTestId('manageWorkspaceMenuSelector')).toBeInTheDocument();
    // No manage-workspace rows when outside a workspace.
    expect(queryByTestId('manageWorkspaceMenuItem-workspace_detail')).not.toBeInTheDocument();
  });

  it('navigates to the app on a manage-workspace row click', () => {
    const core = buildCore({ currentWorkspace: { id: 'ws-1', name: 'My WS' } as WorkspaceObject });
    const { getByTestId } = renderMenu(core);
    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));

    fireEvent.click(getByTestId('manageWorkspaceMenuItem-workspace_detail'));

    expect(core.application.navigateToApp).toHaveBeenCalledWith('workspace_detail');
  });

  it('emphasizes the current app row', () => {
    const { getByTestId } = renderMenu(
      buildCore({ currentWorkspace: { id: 'ws-1', name: 'My WS' } as WorkspaceObject })
    );
    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));
    // currentAppId$ is 'objects' — its row is bolded, others are not.
    expect(getByTestId('manageWorkspaceMenuItem-objects')).toHaveStyle('font-weight: 600');
    expect(getByTestId('manageWorkspaceMenuItem-workspace_detail')).not.toHaveStyle(
      'font-weight: 600'
    );
  });

  describe('first-visit tour', () => {
    it('opens on mount when not previously dismissed', () => {
      localStorage.clear();
      const { getByTestId } = renderMenu(buildCore());
      expect(getByTestId('manageWorkspaceTourDismiss')).toBeInTheDocument();
    });

    it('dismisses and persists the flag on "Got it"', () => {
      localStorage.clear();
      const { getByTestId } = renderMenu(buildCore());

      fireEvent.click(getByTestId('manageWorkspaceTourDismiss'));

      expect(localStorage.getItem('workspace.manageWorkspaceMoved.tourDismissed')).toBe('true');
    });

    it('does not open when the flag is already set', () => {
      // beforeEach set the flag.
      const { queryByTestId } = renderMenu(buildCore());
      expect(queryByTestId('manageWorkspaceTourDismiss')).not.toBeInTheDocument();
    });

    it('is dismissed when the user opens the popover', () => {
      localStorage.clear();
      const { getByTestId } = renderMenu(buildCore());

      fireEvent.click(getByTestId('manageWorkspaceMenuButton'));

      expect(localStorage.getItem('workspace.manageWorkspaceMoved.tourDismissed')).toBe('true');
    });
  });
});
