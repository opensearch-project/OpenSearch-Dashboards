/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentItems, Props } from './recent_items';
import { applicationServiceMock, httpServiceMock } from '../../../mocks';
import { BehaviorSubject } from 'rxjs';

jest.mock('./nav_link', () => ({
  createRecentNavLink: jest.fn().mockImplementation(() => {
    return {
      href: '/recent_nav_link',
    };
  }),
}));

const defaultMockProps = {
  navigateToUrl: applicationServiceMock.createStartContract().navigateToUrl,
  workspaceList$: new BehaviorSubject([]),
  recentlyAccessed$: new BehaviorSubject([]),
  navLinks$: new BehaviorSubject([]),
  basePath: httpServiceMock.createStartContract().basePath,
};
const setup = (props: Props) => {
  return render(<RecentItems {...props} />);
};
describe('Recent items', () => {
  it('should render base element normally', () => {
    const { baseElement } = setup(defaultMockProps);
    expect(baseElement).toMatchSnapshot();
  });

  it('should get workspace name through workspace id and render it with brackets wrapper', () => {
    const workspaceList$ = new BehaviorSubject([
      {
        id: 'workspace_id',
        name: 'workspace_name',
      },
    ]);
    const recentlyAccessed$ = new BehaviorSubject([
      {
        label: 'item_label',
        link: 'item_link',
        id: 'item_id',
        workspaceId: 'workspace_id',
      },
    ]);

    setup({
      ...defaultMockProps,
      workspaceList$,
      recentlyAccessed$,
      navigateToUrl: defaultMockProps.navigateToUrl,
    });
    const button = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(button);
    expect(screen.getByText('(workspace_name)')).toBeInTheDocument();
  });

  it('should call navigateToUrl with link generated from createRecentNavLink when clicking item', () => {
    const workspaceList$ = new BehaviorSubject([]);
    const recentlyAccessed$ = new BehaviorSubject([
      {
        label: 'item_label',
        link: 'item_link',
        id: 'item_id',
      },
    ]);
    const navigateToUrl = jest.fn();
    setup({
      ...defaultMockProps,
      workspaceList$,
      recentlyAccessed$,
      navigateToUrl,
    });
    const button = screen.getByTestId('recentItemsSectionButton');
    fireEvent.click(button);
    const item = screen.getByText('item_label');
    expect(navigateToUrl).not.toHaveBeenCalled();
    fireEvent.click(item);
    expect(navigateToUrl).toHaveBeenCalledWith('/recent_nav_link');
  });
});
