/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';

import { HomeListCard } from './home_list_card';

describe('<HomeListCard />', () => {
  it('should render static content normally', async () => {
    const mockConfig = {
      title: `What's New`,
      list: [
        {
          label: 'Quickstart guide',
          href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
          target: '_blank',
          description: 'Get started in minutes with OpenSearch Dashboards',
        },
      ],
    };
    const { baseElement } = render(<HomeListCard config={mockConfig} />);
    expect(baseElement).toMatchSnapshot();
  });
});

it('should render View All button when allLink is provided', () => {
  const mockConfig = {
    title: `What's New`,
    list: [
      {
        label: 'Quickstart guide',
        href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
        target: '_blank',
        description: 'Get started in minutes with OpenSearch Dashboards',
      },
    ],
    allLink: 'https://opensearch.org/docs/latest/',
  };

  const { getByText } = render(<HomeListCard config={mockConfig} />);
  expect(getByText('View all')).toBeInTheDocument();
});

it('should not show View All button when allLink is not provided', () => {
  const mockConfig = {
    title: `What's New`,
    list: [
      {
        label: 'Quickstart guide',
        href: 'https://opensearch.org/docs/latest/dashboards/quickstart/',
        target: '_blank',
        description: 'Get started in minutes with OpenSearch Dashboards',
      },
    ],
  };

  const { queryByText } = render(<HomeListCard config={mockConfig} />);
  expect(queryByText('View all')).not.toBeInTheDocument();
});
