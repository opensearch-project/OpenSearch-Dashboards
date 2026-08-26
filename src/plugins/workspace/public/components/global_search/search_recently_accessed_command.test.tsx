/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render } from '@testing-library/react';
import { ChromeRecentlyAccessedHistoryItem, IBasePath } from '../../../../../core/public';
import { searchRecentlyAccessed } from './search_recently_accessed_command';

const currentWorkspaceId = 'current-workspace';

const createItem = (
  id: string,
  label: string,
  workspaceId: string | undefined = currentWorkspaceId,
  type: string | undefined = 'visualization'
): ChromeRecentlyAccessedHistoryItem => ({
  id,
  label,
  link: `/app/visualize#/edit/${id}`,
  workspaceId,
  meta: {
    type,
    lastAccessedTime: 1,
  },
});

const basePath = {
  remove: jest.fn((path: string) => path),
  prepend: jest.fn((path: string) => `/base${path}`),
} as unknown as IBasePath;

describe('searchRecentlyAccessed', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns current-workspace items for an empty query and preserves their order', () => {
    const results = searchRecentlyAccessed({
      items: [
        createItem('first', 'First item'),
        createItem('other-workspace', 'Other workspace item', 'other-workspace'),
        createItem('second', 'Second item', currentWorkspaceId, 'dashboard'),
        {
          ...createItem('no-workspace', 'No workspace item'),
          workspaceId: undefined,
        },
        {
          ...createItem('no-type', 'No type item'),
          meta: { lastAccessedTime: 1 },
        },
      ],
      query: '',
      currentWorkspaceId,
      basePath,
    });

    expect(results.map(({ id }) => id)).toEqual(['first', 'second']);
    expect(results[0].href).toContain(`/w/${currentWorkspaceId}/app/visualize`);
  });

  it('matches labels case-insensitively without searching the displayed type', () => {
    const items = [
      createItem('time-series', 'Time series'),
      createItem('dashboard', 'Sales overview', currentWorkspaceId, 'dashboard'),
    ];

    expect(
      searchRecentlyAccessed({
        items,
        query: 'TIME',
        currentWorkspaceId,
        basePath,
      }).map(({ id }) => id)
    ).toEqual(['time-series']);

    expect(
      searchRecentlyAccessed({
        items,
        query: 'dashboard',
        currentWorkspaceId,
        basePath,
      })
    ).toEqual([]);
  });

  it('returns at most 10 matching items', () => {
    const results = searchRecentlyAccessed({
      items: Array.from({ length: 12 }, (_, index) =>
        createItem(`item-${index}`, `Matching item ${index}`)
      ),
      query: 'matching',
      currentWorkspaceId,
      basePath,
    });

    expect(results).toHaveLength(10);
    expect(results.map(({ id }) => id)).toEqual(
      Array.from({ length: 10 }, (_, index) => `item-${index}`)
    );
  });

  it('renders the item type with its label', () => {
    const [result] = searchRecentlyAccessed({
      items: [createItem('dashboard', 'Sales overview', currentWorkspaceId, 'dashboard')],
      query: 'sales',
      currentWorkspaceId,
      basePath,
    });

    const { getByText } = render(<>{result.content}</>);

    expect(getByText('dashboard')).toBeVisible();
    expect(getByText((_, element) => element?.textContent === 'Sales overview')).toBeVisible();
  });

  it('returns no items when there is no current workspace', () => {
    expect(
      searchRecentlyAccessed({
        items: [createItem('item', 'Item')],
        query: '',
        basePath,
      })
    ).toEqual([]);
  });

  it('navigates to the workspace-aware result URL', () => {
    const assignSpy = jest.spyOn(window.location, 'assign').mockImplementation(jest.fn());
    const [result] = searchRecentlyAccessed({
      items: [createItem('item', 'Item')],
      query: '',
      currentWorkspaceId,
      basePath,
    });

    result.execute();

    expect(assignSpy).toHaveBeenCalledWith(result.href);
    assignSpy.mockRestore();
  });
});
