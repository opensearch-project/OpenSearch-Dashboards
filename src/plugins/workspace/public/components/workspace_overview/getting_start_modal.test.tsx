/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { fireEvent, render } from '@testing-library/react';
import React from 'react';
import { coreMock } from '../../../../../core/public/mocks';
import { DEFAULT_APP_CATEGORIES } from '../../../../../core/public';
import {
  WorkspaceOverviewGettingStartModal,
  WorkspaceOverviewGettingStartModalProps,
} from './getting_start_modal';
import { GetStartCard } from './types';
import { waitFor } from '@testing-library/dom';

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
  // see https://github.com/elastic/eui/issues/5271 as workaround to render EuiSelectable correctly
  // don't work for OUI, TODO find out a way to render EuiSelectable
  beforeEach(() => {
    jest.mock('react-virtualized-auto-sizer', () => ({ children }: any) =>
      children({ height: 800, width: 1400 })
    );
  });

  it.skip('render getting start card modal normally with empty cards', async () => {
    const { getByTestId } = render(renderWorkspaceCardModal([]));
    await waitFor(() => expect(getByTestId('category_single_selection')).toHaveTextContent('All'));
  });

  it.skip('render getting start card modal normally', async () => {
    const cards = [
      {
        appId: 'home',
        featureDescription: 'Discover pre-loaded datasets before adding your own.',
        featureName: 'Sample Datasets',
        link: '/app/home#/tutorial_directory',
        category: DEFAULT_APP_CATEGORIES.getStarted,
      },
      {
        appId: 'dashboards',
        featureDescription: 'Gain clarity and visibility with dynamic data visualization tools.',
        featureName: 'Dashboards',
        link: '/app/dashboards',
        category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
      },
    ];
    const { container, getByTestId } = render(renderWorkspaceCardModal(cards));
    expect(container).toMatchSnapshot();
    expect(getByTestId('category_single_selection')).toHaveTextContent('All');
    expect(getByTestId('category_single_selection')).toHaveTextContent('Get started');
    expect(getByTestId('category_single_selection')).toHaveTextContent('Dashboard and report');
    expect(container).toHaveTextContent(
      'Gain clarity and visibility with dynamic data visualization tools.'
    );
    expect(container).toHaveTextContent('Discover pre-loaded datasets before adding your own.');
  });

  it.skip('click on category to filter cards', async () => {
    const cards = [
      {
        appId: 'home',
        featureDescription: 'Discover pre-loaded datasets before adding your own.',
        featureName: 'Sample Datasets',
        link: '/app/home#/tutorial_directory',
        category: DEFAULT_APP_CATEGORIES.getStarted,
      },
      {
        appId: 'dashboards',
        featureDescription: 'Gain clarity and visibility with dynamic data visualization tools.',
        featureName: 'Dashboards',
        link: '/app/dashboards',
        category: DEFAULT_APP_CATEGORIES.dashboardAndReport,
      },
    ];
    const { container, getByTitle } = render(renderWorkspaceCardModal(cards));
    // click `Get started` category
    fireEvent.click(getByTitle('Get started'));
    expect(container).not.toHaveTextContent(
      'Gain clarity and visibility with dynamic data visualization tools.'
    );
    expect(container).toHaveTextContent('Discover pre-loaded datasets before adding your own.');

    // click `Dashboard and report` category
    fireEvent.click(getByTitle('Dashboard and report'));
    expect(container).toHaveTextContent(
      'Gain clarity and visibility with dynamic data visualization tools.'
    );
    expect(container).not.toHaveTextContent('Discover pre-loaded datasets before adding your own.');
  });

  it('click on close will close the modal', async () => {
    const { getByTestId } = render(renderWorkspaceCardModal([]));
    fireEvent.click(getByTestId('close'));
    expect(closeModal).toHaveBeenCalled();
  });
});
