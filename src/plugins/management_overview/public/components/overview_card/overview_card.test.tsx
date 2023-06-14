/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import { render } from '@testing-library/react';
import { OverviewCard } from './overview_card';
import React from 'react';
import { PluginPages } from 'src/core/types';

function renderOverviewCard(pages: PluginPages[]) {
  return render(<OverviewCard title="Dev Tools" onClick={jest.fn()} pages={pages} />);
}

describe('OverviewCard', () => {
  const singlePage: PluginPages[] = [
    {
      title: 'Dev tools',
      order: 100,
      url: '#/console',
    },
  ];

  const multiplePages: PluginPages[] = [
    {
      title: 'Dev tools-1',
      order: 100,
      url: '#/page1',
    },
    {
      title: 'Dev tools-2',
      order: 200,
      url: '#/page2',
    },
    {
      title: 'Dev tools-3',
      order: 300,
      url: '#/page3',
    },
    {
      title: 'Dev tools-4',
      order: 400,
      url: '#/page1',
    },
    {
      title: 'Dev tools-5',
      order: 500,
      url: '#/page5',
    },
  ];

  it('should render normally', () => {
    const { container, queryByText } = renderOverviewCard(singlePage);
    expect(container.firstChild).toMatchSnapshot();
    expect(queryByText('View more...')).toBeNull();
  });

  it('should render normally for more than 4 pages', () => {
    const { container, queryByText } = renderOverviewCard(multiplePages);
    expect(container.firstChild).toMatchSnapshot();
    expect(queryByText('View more...')).not.toBeNull();
  });
});
