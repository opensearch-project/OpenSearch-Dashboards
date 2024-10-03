/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { FeatureCards } from './feature_cards';
import { AppCategory, ChromeNavLink } from 'opensearch-dashboards/public';
import { navigationPluginMock } from '../../../../navigation/public/mocks';
import { coreMock } from '../../../../../../src/core/public/mocks';

const mockCategory: AppCategory = {
  id: 'dashboard',
  label: 'Dashboard',
  order: 2,
};

const mockSetAppDescriptionControls = coreMock.createStart().application.setAppDescriptionControls;
const mockNavigationUI = navigationPluginMock.createStartContract().ui;
mockNavigationUI.HeaderControl = () => null;

const navLinks: ChromeNavLink[] = [
  {
    id: '1',
    title: 'title1',
    baseUrl: '',
    href: '',
  },
  {
    id: '2',
    title: 'title2',
    baseUrl: '',
    href: '',
  },
  {
    id: '3',
    title: 'title3',
    baseUrl: '',
    href: '',
  },
  {
    id: '4',
    title: 'title4',
    baseUrl: '',
    href: '',
  },
  {
    id: '5',
    title: 'title5',
    baseUrl: '',
    href: '',
  },
  {
    id: 'category-1',
    title: 'title1',
    baseUrl: '',
    href: '',
    category: mockCategory,
  },
  {
    id: 'category-2',
    title: 'title2',
    baseUrl: '',
    href: '',
    category: mockCategory,
  },
  {
    id: 'category-3',
    title: 'title3',
    baseUrl: '',
    href: '',
    category: mockCategory,
  },
  {
    id: 'category-4',
    title: 'title4',
    baseUrl: '',
    href: '',
    category: mockCategory,
  },
  {
    id: 'category-5',
    title: 'title5',
    baseUrl: '',
    href: '',
    category: mockCategory,
  },
];

describe('<FeatureCards />', () => {
  it('render with empty navLinks', () => {
    const { container } = render(
      <FeatureCards
        pageDescription=""
        navLinks={[]}
        navigateToApp={jest.fn()}
        setAppDescriptionControls={mockSetAppDescriptionControls}
        navigationUI={mockNavigationUI}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('render with complex navLinks', () => {
    const { container } = render(
      <FeatureCards
        pageDescription=""
        navLinks={navLinks}
        navigateToApp={jest.fn()}
        setAppDescriptionControls={mockSetAppDescriptionControls}
        navigationUI={mockNavigationUI}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('click item', () => {
    const mockedNavigateToApp = jest.fn();
    const { getByTestId } = render(
      <FeatureCards
        pageDescription=""
        navLinks={navLinks}
        navigateToApp={mockedNavigateToApp}
        setAppDescriptionControls={mockSetAppDescriptionControls}
        navigationUI={mockNavigationUI}
      />
    );
    fireEvent.click(getByTestId('landingPageFeature_1'));
    expect(mockedNavigateToApp).toBeCalledWith('1');
  });
});
