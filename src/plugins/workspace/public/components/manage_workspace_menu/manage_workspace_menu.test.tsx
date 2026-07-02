/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import { BehaviorSubject } from 'rxjs';
import { ManageWorkspaceMenu } from './manage_workspace_menu';
import { coreMock } from '../../../../../core/public/mocks';
import { CoreStart, DEFAULT_APP_CATEGORIES } from '../../../../../core/public';

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

const buildCore = () => {
  const core = (coreMock.createStart() as unknown) as CoreStart;
  core.chrome.navGroup.getCurrentNavGroup$ = jest.fn(() => new BehaviorSubject(navGroup)) as any;
  core.chrome.navLinks.getNavLinks$ = jest.fn(() => new BehaviorSubject(chromeNavLinks)) as any;
  core.application.currentAppId$ = new BehaviorSubject('objects') as any;
  core.application.navigateToApp = jest.fn();
  return core;
};

describe('<ManageWorkspaceMenu />', () => {
  it('renders the trigger button', () => {
    const { getByTestId } = render(<ManageWorkspaceMenu coreStart={buildCore()} />);
    expect(getByTestId('manageWorkspaceMenuButton')).toBeInTheDocument();
  });

  it('opens a popover listing only manage-workspace links on click', () => {
    const { getByTestId, queryByTestId } = render(<ManageWorkspaceMenu coreStart={buildCore()} />);
    expect(queryByTestId('manageWorkspaceMenuPopover')).not.toBeInTheDocument();

    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));

    expect(getByTestId('manageWorkspaceMenuPopover')).toBeInTheDocument();
    expect(getByTestId('manageWorkspaceMenuItem-workspace_detail')).toBeInTheDocument();
    expect(getByTestId('manageWorkspaceMenuItem-objects')).toBeInTheDocument();
    // The non-manage-workspace link is excluded.
    expect(queryByTestId('manageWorkspaceMenuItem-discover')).not.toBeInTheDocument();
  });

  it('navigates to the app on row click', () => {
    const core = buildCore();
    const { getByTestId } = render(<ManageWorkspaceMenu coreStart={core} />);
    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));

    fireEvent.click(getByTestId('manageWorkspaceMenuItem-workspace_detail'));

    expect(core.application.navigateToApp).toHaveBeenCalledWith('workspace_detail');
  });

  it('emphasizes the current app row', () => {
    const { getByTestId } = render(<ManageWorkspaceMenu coreStart={buildCore()} />);
    fireEvent.click(getByTestId('manageWorkspaceMenuButton'));
    // currentAppId$ is 'objects' — its row is bolded, others are not.
    expect(getByTestId('manageWorkspaceMenuItem-objects')).toHaveStyle('font-weight: 600');
    expect(getByTestId('manageWorkspaceMenuItem-workspace_detail')).not.toHaveStyle(
      'font-weight: 600'
    );
  });
});
