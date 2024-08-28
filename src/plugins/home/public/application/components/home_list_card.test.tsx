/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';

import { HomeListCard, registerHomeListCardToPage } from './home_list_card';
import { contentManagementPluginMocks } from '../../../../content_management/public';

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

describe('Register HomeListCardToPages', () => {
  const registerContentProviderFn = jest.fn();
  const contentManagementStartMock = {
    ...contentManagementPluginMocks.createStartContract(),
    registerContentProvider: registerContentProviderFn,
  };

  it('register to use case overview page', () => {
    registerHomeListCardToPage(contentManagementStartMock);
    expect(contentManagementStartMock.registerContentProvider).toHaveBeenCalledTimes(4);

    let whatsNewCall = registerContentProviderFn.mock.calls[0];
    expect(whatsNewCall[0].getTargetArea()).toEqual('analytics_overview/service_cards');
    expect(whatsNewCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "whats_new",
        "kind": "custom",
        "order": 10,
        "render": [Function],
        "width": 24,
      }
    `);

    let learnOpenSearchCall = registerContentProviderFn.mock.calls[1];
    expect(learnOpenSearchCall[0].getTargetArea()).toEqual('analytics_overview/service_cards');
    expect(learnOpenSearchCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "learn_opensearch_new",
        "kind": "custom",
        "order": 20,
        "render": [Function],
        "width": 24,
      }
    `);

    whatsNewCall = registerContentProviderFn.mock.calls[2];
    expect(whatsNewCall[0].getTargetArea()).toEqual('all_overview/service_cards');
    expect(whatsNewCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "whats_new",
        "kind": "custom",
        "order": 30,
        "render": [Function],
        "width": undefined,
      }
    `);

    learnOpenSearchCall = registerContentProviderFn.mock.calls[3];
    expect(learnOpenSearchCall[0].getTargetArea()).toEqual('all_overview/service_cards');
    expect(learnOpenSearchCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "learn_opensearch_new",
        "kind": "custom",
        "order": 40,
        "render": [Function],
        "width": undefined,
      }
    `);
  });
});
