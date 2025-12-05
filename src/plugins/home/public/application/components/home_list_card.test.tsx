/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { render } from '@testing-library/react';

import { HomeListCard, registerHomeListCardToPage } from './home_list_card';
import { contentManagementPluginMocks } from '../../../../content_management/public';
import { EuiLink } from '@elastic/eui';
import { docLinksServiceMock } from '../../../../../core/public/mocks';

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
    allLink: <EuiLink>View all</EuiLink>,
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

  const docLinkMock = docLinksServiceMock.createStartContract();

  it('register to use case overview page', () => {
    registerHomeListCardToPage(contentManagementStartMock, docLinkMock);
    expect(contentManagementStartMock.registerContentProvider).toHaveBeenCalledTimes(2);

    let learnOpenSearchCall = registerContentProviderFn.mock.calls[0];
    expect(learnOpenSearchCall[0].getTargetArea()).toEqual('essentials_overview/service_cards');
    expect(learnOpenSearchCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "learn_opensearch_new",
        "kind": "custom",
        "order": 20,
        "render": [Function],
        "width": 48,
      }
    `);

    learnOpenSearchCall = registerContentProviderFn.mock.calls[1];
    expect(learnOpenSearchCall[0].getTargetArea()).toEqual('all_overview/service_cards');
    expect(learnOpenSearchCall[0].getContent()).toMatchInlineSnapshot(`
      Object {
        "id": "learn_opensearch_new",
        "kind": "custom",
        "order": 40,
        "render": [Function],
        "width": 16,
      }
    `);
  });
});
