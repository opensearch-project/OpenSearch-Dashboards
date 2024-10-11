/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { HeaderSearchBarIcon, HeaderSearchBar } from './header_search_bar';
import { GlobalSearchHandler, SearchObjectTypes } from '../../global_search';
import { EuiText } from '@elastic/eui';

describe('<HeaderSearchBarIcon />', () => {
  const searchFn = jest.fn().mockResolvedValue([]);
  const searchFnBar = jest.fn().mockResolvedValue([]);
  const globalSearchStrategies: GlobalSearchHandler[] = [
    {
      id: 'foo',
      type: SearchObjectTypes.PAGES,
      invoke: searchFn,
    },
    {
      id: 'bar',
      type: SearchObjectTypes.PAGES,
      invoke: searchFnBar,
    },
  ];

  it('render HeaderSearchBarIcon correctly without search results', () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBarIcon globalSearchHandlers={globalSearchStrategies} />
    );
    const searchIcon = getByTestId('search-icon');
    expect(searchIcon).toBeVisible();

    fireEvent.click(searchIcon);

    expect(getByTestId('search-input')).toBeVisible();

    act(() => {
      fireEvent.change(getByTestId('search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    waitFor(() => {
      expect(queryByText('No results found.')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBarIcon correctly with search results', () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBarIcon globalSearchHandlers={globalSearchStrategies} />
    );
    const searchIcon = getByTestId('search-icon');
    expect(searchIcon).toBeVisible();

    fireEvent.click(searchIcon);

    expect(getByTestId('search-input')).toBeVisible();

    searchFn.mockResolvedValue([<EuiText>index page</EuiText>]);
    act(() => {
      fireEvent.change(getByTestId('search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    waitFor(() => {
      expect(queryByText('index page')).toBeInTheDocument();
    });
  });
});

describe('<HeaderSearchBar />', () => {
  const searchFn = jest.fn().mockResolvedValue([]);
  const searchFnBar = jest.fn().mockResolvedValue([]);
  const searchFnBaz = jest.fn().mockResolvedValue([]);
  const globalSearchHandlers: GlobalSearchHandler[] = [
    {
      id: 'foo',
      type: SearchObjectTypes.PAGES,
      invoke: searchFn,
    },
    {
      id: 'bar',
      type: SearchObjectTypes.PAGES,
      invoke: searchFnBar,
    },
    {
      id: 'baz',
      type: SearchObjectTypes.SAVED_OBJECTS,
      invoke: searchFnBaz,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('render HeaderSearchBar with panel', () => {
    const { getByTestId } = render(
      <HeaderSearchBar globalSearchHandlers={globalSearchHandlers} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();
  });

  it('render HeaderSearchBar with search result', () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchHandlers={globalSearchHandlers} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('search-input')).toBeVisible();

    searchFn.mockResolvedValue([<EuiText>index page</EuiText>]);
    searchFnBar.mockResolvedValue([<EuiText>index polices</EuiText>]);
    act(() => {
      fireEvent.change(getByTestId('search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    // merge page results together
    waitFor(() => {
      expect(queryByText('index page')).toBeInTheDocument();
      expect(queryByText('index polices')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBar with reject search result', () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchHandlers={globalSearchHandlers} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('search-input')).toBeVisible();

    searchFn.mockResolvedValue([<EuiText>index page</EuiText>]);
    searchFnBar.mockRejectedValue(new Error('Async search error'));

    act(() => {
      fireEvent.change(getByTestId('search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    // ignore reject and show pages for success search≠
    waitFor(() => {
      expect(queryByText('index page')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBar with all reject search result', () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchHandlers={globalSearchHandlers} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('search-input')).toBeVisible();

    searchFnBar.mockRejectedValue(new Error('Async search error'));
    searchFn.mockRejectedValue(new Error('Async search error'));

    act(() => {
      fireEvent.change(getByTestId('search-input'), {
        target: { value: 'index' },
      });
    });

    expect(searchFn).toHaveBeenCalled();

    // show no result for all reject search
    waitFor(() => {
      expect(queryByText('No results found.')).toBeInTheDocument();
    });
  });

  it('render HeaderSearchBar with search saved objects', () => {
    const { getByTestId, queryByText } = render(
      <HeaderSearchBar globalSearchHandlers={globalSearchHandlers} panel />
    );
    const searchPanel = getByTestId('search-result-panel');
    expect(searchPanel).toBeVisible();

    expect(getByTestId('search-input')).toBeVisible();

    searchFnBaz.mockResolvedValue([<div>saved objects</div>]);

    act(() => {
      fireEvent.change(getByTestId('search-input'), {
        target: { value: '@index' },
      });
    });

    // pages handler will not been invoked
    globalSearchHandlers.forEach((handler) => {
      if (handler.type === SearchObjectTypes.SAVED_OBJECTS) {
        expect(handler.invoke).toHaveBeenCalled();
      } else {
        expect(handler.invoke).not.toHaveBeenCalled();
      }
    });

    waitFor(() => {
      expect(queryByText('saved objects')).toBeInTheDocument();
    });
  });
});
