/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import {
  WorkspaceOverviewGettingStartModal,
  WorkspaceOverviewGettingStartModalProps,
} from './getting_start_modal';
import { GetStartCard } from './types';
import { waitFor } from '@testing-library/dom';
import { WORKSPACE_APP_CATEGORIES } from '../../../common/constants';

// see https://github.com/elastic/eui/issues/5271 as workaround to render EuiSelectable correctly
jest.mock('react-virtualized-auto-sizer', () => ({ children }: any) =>
  children({ height: 600, width: 300 })
);

describe('WorkspaceOverviewGettingStartModal', () => {
  const mockCoreStart = coreMock.createStart();
  const closeModal = jest.fn();
  const renderWorkspaceCardModal = (cards: GetStartCard[]) => {
    const props: WorkspaceOverviewGettingStartModalProps = {
      availableCards: cards,
      onCloseModal: closeModal,
      application: mockCoreStart.application,
      basePath: mockCoreStart.http.basePath,
      workspaceId: 'foo',
    };
    return <WorkspaceOverviewGettingStartModal {...props} />;
  };

  it('render getting start card modal normally with empty cards', async () => {
    const { getByTestId } = render(renderWorkspaceCardModal([]));
    await waitFor(() => expect(getByTestId('category_single_selection')).toHaveTextContent('All'));
  });

  it('render getting start card modal normally', async () => {
    const cards = [
      {
        id: 'home',
        featureDescription: 'Discover pre-loaded datasets before adding your own.',
        featureName: 'Sample Datasets',
        link: '/app/home#/tutorial_directory',
        category: WORKSPACE_APP_CATEGORIES.getStarted,
      },
      {
        id: 'dashboards',
        featureDescription: 'Gain clarity and visibility with dynamic data visualization tools.',
        featureName: 'Dashboards',
        link: '/app/dashboards',
        category: WORKSPACE_APP_CATEGORIES.dashboardAndReport,
      },
    ];
    const { queryByText, getByTestId } = render(renderWorkspaceCardModal(cards));
    expect(getByTestId('category_single_selection')).toHaveTextContent('All');
    expect(getByTestId('category_single_selection')).toHaveTextContent('Get started');
    expect(getByTestId('category_single_selection')).toHaveTextContent('Dashboard and report');
    expect(
      queryByText('Gain clarity and visibility with dynamic data visualization tools.')
    ).not.toBeNull();
    expect(queryByText('Discover pre-loaded datasets before adding your own.')).not.toBeNull();
  });

  it('click on category to filter cards', async () => {
    const cards = [
      {
        id: 'home',
        featureDescription: 'Discover pre-loaded datasets before adding your own.',
        featureName: 'Sample Datasets',
        link: '/app/home#/tutorial_directory',
        category: WORKSPACE_APP_CATEGORIES.getStarted,
      },
      {
        id: 'dashboards',
        featureDescription: 'Gain clarity and visibility with dynamic data visualization tools.',
        featureName: 'Dashboards',
        link: '/app/dashboards',
        category: WORKSPACE_APP_CATEGORIES.dashboardAndReport,
      },
    ];
    const { queryByText, getByTitle } = render(renderWorkspaceCardModal(cards));
    // click `Get started` category
    fireEvent.click(getByTitle('Get started'));
    expect(
      queryByText('Gain clarity and visibility with dynamic data visualization tools.')
    ).toBeNull();
    expect(queryByText('Discover pre-loaded datasets before adding your own.')).not.toBeNull();

    // click `Dashboard and report` category
    fireEvent.click(getByTitle('Dashboard and report'));
    expect(
      queryByText('Gain clarity and visibility with dynamic data visualization tools.')
    ).not.toBeNull();
    expect(queryByText('Discover pre-loaded datasets before adding your own.')).toBeNull();
  });

  it('click on close will close the modal', async () => {
    const { getByTestId } = render(renderWorkspaceCardModal([]));
    fireEvent.click(getByTestId('close'));
    expect(closeModal).toHaveBeenCalled();
  });
});
