/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { savedObjectsClientMock } from '../../../../core/server/mocks';
import { WORKSPACE_TYPE } from '../../../../core/server';
import { WORKSPACE_FETCH_ALL_PER_PAGE } from '../../common/constants';
import { fetchAllWorkspaces } from './workspace_collection_fetcher';

const savedObject = (id: string) => ({
  id,
  type: WORKSPACE_TYPE,
  score: 1,
  attributes: {},
  references: [],
});

const makePage = (page: number, ids: string[], total: number) => ({
  total,
  per_page: WORKSPACE_FETCH_ALL_PER_PAGE,
  page,
  saved_objects: ids.map(savedObject),
});

// A page of unique ids of the given size.
const fullPage = (page: number, total: number) =>
  makePage(
    page,
    new Array(WORKSPACE_FETCH_ALL_PER_PAGE).fill(0).map((_, i) => `page${page}-${i}`),
    total
  );

describe('fetchAllWorkspaces', () => {
  it('fetches a single page at WORKSPACE_FETCH_ALL_PER_PAGE when the total fits on one page', async () => {
    const client = savedObjectsClientMock.create();
    client.find.mockResolvedValueOnce(makePage(1, ['a', 'b', 'c'], 3));

    const result = await fetchAllWorkspaces(client);

    expect(client.find).toHaveBeenCalledTimes(1);
    expect(client.find).toHaveBeenCalledWith(
      expect.objectContaining({
        type: WORKSPACE_TYPE,
        page: 1,
        perPage: WORKSPACE_FETCH_ALL_PER_PAGE,
      })
    );
    expect(result).toHaveLength(3);
  });

  it('fans out the remaining pages in parallel based on the total from the first page', async () => {
    const total = WORKSPACE_FETCH_ALL_PER_PAGE * 2 + 5;
    const client = savedObjectsClientMock.create();
    client.find.mockImplementation(async ({ page }) => {
      if (page === 3) {
        return makePage(3, ['tail-0', 'tail-1', 'tail-2', 'tail-3', 'tail-4'], total);
      }
      return fullPage(page as number, total);
    });

    const result = await fetchAllWorkspaces(client);

    // Page 1 fetched to learn the total, then pages 2 and 3 requested.
    expect(client.find).toHaveBeenCalledTimes(3);
    expect(client.find).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
    expect(client.find).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
    expect(result).toHaveLength(total);
  });

  it('de-duplicates workspaces by id across pages', async () => {
    const total = WORKSPACE_FETCH_ALL_PER_PAGE + 2;
    const client = savedObjectsClientMock.create();
    client.find.mockImplementation(async ({ page }) => {
      if (page === 2) {
        // `dup` also appears on page 1, simulating a workspace that shifted across the
        // page boundary between the parallel requests.
        return makePage(2, ['dup', 'unique-2'], total);
      }
      return makePage(
        1,
        ['dup', ...new Array(WORKSPACE_FETCH_ALL_PER_PAGE - 1).fill(0).map((_, i) => `p1-${i}`)],
        total
      );
    });

    const result = await fetchAllWorkspaces(client);

    const ids = result.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.filter((id) => id === 'dup')).toHaveLength(1);
    expect(ids).toContain('unique-2');
  });

  it('forwards the given find options', async () => {
    const client = savedObjectsClientMock.create();
    client.find.mockResolvedValueOnce(makePage(1, [], 0));

    await fetchAllWorkspaces(client, { workspaces: null, ACLSearchParams: { principals: {} } });

    expect(client.find).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaces: null,
        ACLSearchParams: { principals: {} },
      })
    );
  });
});
