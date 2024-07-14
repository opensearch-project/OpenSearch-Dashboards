/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { FeatureCards } from './feature_cards';
import { AppCategory, ChromeNavLink } from 'opensearch-dashboards/public';

const mockCategory: AppCategory = {
  id: 'dashboard',
  label: 'Dashboard',
  order: 2,
};

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
      <FeatureCards getStartedCards={[]} pageTitle="" navLinks={[]} navigateToApp={jest.fn()} />
    );
    expect(container).toMatchSnapshot();
  });

  it('render with complex navLinks', () => {
    const { container, getAllByTestId } = render(
      <FeatureCards
        getStartedCards={[]}
        pageTitle=""
        navLinks={navLinks}
        navigateToApp={jest.fn()}
      />
    );
    expect(container).toMatchSnapshot();
    expect(getAllByTestId('landingPageRow_1').length).toEqual(2);
  });

  it('click item', () => {
    const mockedNavigateToApp = jest.fn();
    const { getByTestId } = render(
      <FeatureCards
        getStartedCards={[]}
        pageTitle=""
        navLinks={navLinks}
        navigateToApp={mockedNavigateToApp}
      />
    );
    fireEvent.click(getByTestId('landingPageFeature_1'));
    expect(mockedNavigateToApp).toBeCalledWith('1');
  });
});
