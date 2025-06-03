/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DEFAULT_NAV_GROUPS, NavGroupItemInMap } from '../../../../../core/public';
import { coreMock } from '../../../../../core/public/mocks';
import { OpenSearchDashboardsContextProvider } from '../../../../../plugins/opensearch_dashboards_react/public';

import {
  WorkspaceUseCaseFlyout,
  fulfillUseCaseWithDisplayedFeatures,
} from './workspace_use_case_flyout';
import { AvailableUseCaseItem } from './types';
import { BehaviorSubject } from 'rxjs';

const mockAvailableUseCases = [
  {
    id: 'use-case-1',
    icon: 'logoElasticsearch',
    title: 'Use Case 1',
    description: 'This is the description for Use Case 1',
    features: [
      {
        id: 'feature-1',
        title: 'Feature 1',
      },
      {
        id: 'feature-2',
        title: 'Feature 2',
        details: [],
      },
    ],
  },
  {
    id: 'use-case-2',
    icon: 'logoKibana',
    title: 'Use Case 2',
    description: 'This is the description for Use Case 2',
    features: [],
  },
];

const setup = ({
  onClose = jest.fn(),
  availableUseCases = mockAvailableUseCases,
  defaultExpandUseCase,
  unsetChrome = false,
}: Partial<{
  availableUseCases: AvailableUseCaseItem[];
  onClose: () => void;
  defaultExpandUseCase: string;
  unsetChrome: boolean;
}> = {}) => {
  const coreStartMock = coreMock.createStart();
  const navGroupsMap$ = new BehaviorSubject<Record<string, NavGroupItemInMap>>({
    'use-case-1': {
      id: 'use-case-1',
      title: 'Use case 1',
      description: 'This is the description for Use Case 1',
      navLinks: [
        {
          id: 'feature-1',
          title: 'Feature 1',
        },
        {
          id: 'feature-2',
          title: 'Feature 2',
        },
      ],
    },
    'use-case-2': {
      id: 'use-case-2',
      title: 'Use case 2',
      description: 'This is the description for Use Case 2',
      navLinks: [],
    },
    [DEFAULT_NAV_GROUPS.all.id]: {
      ...DEFAULT_NAV_GROUPS.all,
      navLinks: [],
    },
  });
  const navLinks$ = new BehaviorSubject([
    { id: 'feature-1', title: 'Feature 1', baseUrl: '', href: '' },
    { id: 'feature-2', title: 'Feature 2', baseUrl: '', href: '' },
  ]);

  coreStartMock.chrome.navGroup.getNavGroupsMap$.mockImplementation(() => navGroupsMap$);
  coreStartMock.chrome.navLinks.getNavLinks$.mockImplementation(() => navLinks$);
  const renderResult = render(
    <OpenSearchDashboardsContextProvider
      services={{ ...coreStartMock, chrome: unsetChrome ? undefined : coreStartMock.chrome }}
    >
      <WorkspaceUseCaseFlyout
        onClose={onClose}
        availableUseCases={availableUseCases}
        defaultExpandUseCase={defaultExpandUseCase}
      />
    </OpenSearchDashboardsContextProvider>
  );
  return {
    renderResult,
    coreStartMock,
  };
};

describe('WorkspaceUseCaseFlyout', () => {
  it('should render the flyout with the correct title and available use cases', () => {
    setup();
    const title = screen.getByText('Use cases');
    expect(title).toBeInTheDocument();
    expect(screen.getByText(mockAvailableUseCases[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockAvailableUseCases[1].title)).toBeInTheDocument();
  });

  it('should call the onClose callback when the close button is clicked', () => {
    const onCloseMock = jest.fn();
    setup({ onClose: onCloseMock });
    const closeButton = screen.getByTestId('euiFlyoutCloseButton');
    fireEvent.click(closeButton);
    expect(onCloseMock).toHaveBeenCalled();
  });

  it('should expand the default use case if provided', () => {
    setup({ defaultExpandUseCase: 'use-case-1' });
    const useCaseDescription = screen.getByText(/This is the description for Use Case 1/);
    expect(useCaseDescription).toBeInTheDocument();
  });

  it('should render "(all features)" suffix for "all use case"', () => {
    setup({
      availableUseCases: [{ ...DEFAULT_NAV_GROUPS.all, features: [] }],
    });
    expect(screen.getByText('(all features)')).toBeInTheDocument();
  });

  it('should render use case without "Features included:" if not exists in nav groups map', () => {
    setup({
      availableUseCases: [
        {
          id: 'not-exist',
          title: 'Not exist use case',
          description: 'This is a not exist use case',
          features: [],
        },
      ],
    });
    expect(screen.getByText('Not exist use case')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Not exist use case'));
    expect(screen.queryByText('Features included:')).toBeNull();
  });

  it('should not render use case if chrome not provided', () => {
    setup({ unsetChrome: true });

    fireEvent.click(screen.getByText(mockAvailableUseCases[0].title));
    expect(screen.queryByText('Features included:')).toBeNull();
  });
});

describe('fulfillUseCaseWithDisplayedFeatures', () => {
  const allNavLinks = [
    { id: 'link1', title: 'Link 1', hidden: false, baseUrl: '', href: '' },
    { id: 'link2', title: 'Link 2', hidden: true, baseUrl: '', href: '' },
    { id: 'link3', title: 'Link 3', hidden: false, baseUrl: '', href: '' },
    { id: 'link4', title: 'Link 4', hidden: false, baseUrl: '', href: '' },
    { id: 'link5', title: 'Link 5', hidden: false, baseUrl: '', href: '' },
    { id: 'a_overview', title: 'A Overview', hidden: false, baseUrl: '', href: '' },
    { id: 'b-gettingStarted', title: 'B Getting Started', hidden: false, baseUrl: '', href: '' },
  ];

  const useCase = {
    id: 'useCase1',
    title: 'Use Case 1',
    features: [],
    description: '',
  };
  it('should filter out hidden links', () => {
    const result = fulfillUseCaseWithDisplayedFeatures({
      allNavLinks,
      navGroupNavLinks: [{ id: 'link2', title: 'Link 2' }],
      useCase,
    });

    expect(result.displayedFeatures).toHaveLength(0);
  });

  it('should filter out overview/getting started links', () => {
    const result = fulfillUseCaseWithDisplayedFeatures({
      allNavLinks,
      navGroupNavLinks: [
        { id: 'a_overview', title: 'Overview' },
        { id: 'b-gettingStarted', title: 'Getting Started' },
      ],
      useCase,
    });

    expect(result.displayedFeatures).toHaveLength(0);
  });

  it('should handle links without category', () => {
    const result = fulfillUseCaseWithDisplayedFeatures({
      allNavLinks: [{ id: 'link1', title: 'Link 1', hidden: false, baseUrl: '', href: '' }],
      navGroupNavLinks: [{ id: 'link1', title: 'Link 1' }],
      useCase,
    });

    expect(result.displayedFeatures).toHaveLength(1);
    expect(result.displayedFeatures).toContainEqual({ id: 'link1', title: 'Link 1' });
  });

  it('should filter out custom features', () => {
    const result = fulfillUseCaseWithDisplayedFeatures({
      allNavLinks,
      navGroupNavLinks: [
        {
          id: 'link3',
          title: 'Link 3',
          category: { id: 'custom', label: 'Custom' },
        },
      ],
      useCase,
    });

    expect(result.displayedFeatures).toHaveLength(0);
  });

  it('should group features by category', () => {
    const navGroupNavLinks = [
      { id: 'link1', title: 'Link 1', category: { id: 'category1', label: 'Category 1' } },
      { id: 'link4', title: 'Link 4', category: { id: 'category1', label: 'Category 1' } },
      { id: 'link5', title: 'Link 5' },
    ];

    const result = fulfillUseCaseWithDisplayedFeatures({
      allNavLinks,
      navGroupNavLinks,
      useCase,
    });

    expect(result.displayedFeatures).toHaveLength(2);

    expect(result.displayedFeatures).toContainEqual({
      id: 'category1',
      title: 'Category 1',
      details: ['Link 1', 'Link 4'],
    });
    expect(result.displayedFeatures).toContainEqual({
      id: 'link5',
      title: 'Link 5',
    });
  });
});
