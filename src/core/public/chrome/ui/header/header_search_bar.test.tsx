/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { HeaderSearchBarIcon, HeaderSearchBar } from './header_search_bar';
import { GlobalSearchCommand } from '../../global_search';
import { EuiText } from '@elastic/eui';

describe('<HeaderSearchBarIcon />', () => {
  const searchFn = jest.fn().mockResolvedValue([]);
  const searchFnBar = jest.fn().mockResolvedValue([]);
  const globalSearchCommands: GlobalSearchCommand[] = [
    {
      id: 'foo',
      type: 'PAGES',
      run: searchFn,
    },
    {
      id: 'bar',
      type: 'PAGES',
      run: searchFnBar,
    },
  ];

  it('render HeaderSearchBarIcon correctly without search results', async () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBarIcon globalSearchCommands={globalSearchCommands} />
    );
    const searchIcon = getByTestId('globalSearch-leftNav-icon');
    expect(searchIcon).toBeVisible();

    fireEvent.click(searchIcon);

    expect(getByTestId('global-search-input')).toBeVisible();

    act(() => {
      fireEvent.change(getByTestId('global-search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    await waitFor(() => {
      expect(queryByText('No results found.')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBarIcon correctly with search results', async () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBarIcon globalSearchCommands={globalSearchCommands} />
    );
    const searchIcon = getByTestId('globalSearch-leftNav-icon');
    expect(searchIcon).toBeVisible();

    fireEvent.click(searchIcon);

    expect(getByTestId('global-search-input')).toBeVisible();

    searchFn.mockResolvedValue([<EuiText>index page</EuiText>]);
    act(() => {
      fireEvent.change(getByTestId('global-search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    await waitFor(() => {
      expect(queryByText('index page')).toBeInTheDocument();
    });
  });
});

describe('<HeaderSearchBar />', () => {
  const searchFn = jest.fn().mockResolvedValue([]);
  const searchFnBar = jest.fn().mockResolvedValue([]);
  const searchFnBaz = jest.fn().mockResolvedValue([]);
  const globalSearchCommands: GlobalSearchCommand[] = [
    {
      id: 'foo',
      type: 'PAGES',
      run: searchFn,
    },
    {
      id: 'bar',
      type: 'PAGES',
      run: searchFnBar,
    },
    {
      id: 'baz',
      type: 'SAVED_OBJECTS',
      run: searchFnBaz,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render HeaderSearchBar with panel', () => {
    const { getByTestId } = render(
      <HeaderSearchBar globalSearchCommands={globalSearchCommands} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();
  });

  it('render HeaderSearchBar with search input', async () => {
    const { queryByTestId, getByTestId } = render(
      <HeaderSearchBar globalSearchCommands={globalSearchCommands} />
    );
    const searchPanel = queryByTestId('search-result-panel');
    expect(searchPanel).toBeNull();

    // focus on search input
    const searchInput = getByTestId('global-search-input');
    expect(searchInput).toBeVisible();
    searchInput.focus();

    await waitFor(() => {
      expect(queryByTestId('search-result-panel')).toBeVisible();
      expect(queryByTestId('global-search-input')).toBeVisible();
    });
  });

  it('render HeaderSearchBar with search result', async () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchCommands={globalSearchCommands} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('global-search-input')).toBeVisible();

    searchFn.mockResolvedValue([<EuiText>index page</EuiText>]);
    searchFnBar.mockResolvedValue([<EuiText>index polices</EuiText>]);
    act(() => {
      fireEvent.change(getByTestId('global-search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    // merge page results together
    await waitFor(() => {
      expect(queryByText('index page')).toBeInTheDocument();
      expect(queryByText('index polices')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBar with reject search result', async () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchCommands={globalSearchCommands} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('global-search-input')).toBeVisible();

    searchFn.mockResolvedValue([<EuiText>index page</EuiText>]);
    searchFnBar.mockRejectedValue(new Error('Async search error'));

    act(() => {
      fireEvent.change(getByTestId('global-search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    // ignore reject and show pages for success search≠
    await waitFor(() => {
      expect(queryByText('index page')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBar with all reject search result', async () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchCommands={globalSearchCommands} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('global-search-input')).toBeVisible();

    searchFnBar.mockRejectedValue(new Error('Async search error'));
    searchFn.mockRejectedValue(new Error('Async search error'));

    act(() => {
      fireEvent.change(getByTestId('global-search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    // show no result for all reject search
    await waitFor(() => {
      expect(queryByText('No results found.')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBar with search saved objects', async () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchCommands={globalSearchCommands} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('global-search-input')).toBeVisible();

    searchFnBaz.mockResolvedValue([<div>saved objects</div>]);

    act(() => {
      fireEvent.change(getByTestId('global-search-input'), {
        target: { value: '@index' },
      });
    });

    // pages search command will not been invoked
    globalSearchCommands.forEach((command) => {
      if (command.type === 'SAVED_OBJECTS') {
        expect(command.run).toHaveBeenCalled();
      } else {
        expect(command.run).not.toHaveBeenCalled();
      }
    });

    await waitFor(() => {
      expect(queryByText('saved objects')).toBeInTheDocument();
    });
  });
});
