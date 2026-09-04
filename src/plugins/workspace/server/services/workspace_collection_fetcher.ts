/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  SavedObjectsClientContract,
  SavedObjectsFindOptions,
  SavedObjectsFindResult,
  WorkspaceAttribute,
  WORKSPACE_TYPE,
} from '../../../../core/server';
import { WORKSPACE_FETCH_ALL_PER_PAGE } from '../../common/constants';

/**
 * Find options accepted when exhaustively fetching workspaces. `type`, `page` and
 * `perPage` are managed by the fetcher and therefore omitted.
 */
export type FetchAllWorkspacesOptions = Omit<SavedObjectsFindOptions, 'type' | 'page' | 'perPage'>;

/**
 * Exhaustively fetches every workspace saved object matching the given options at a fixed
 * page size ({@link WORKSPACE_FETCH_ALL_PER_PAGE}). Use this on the server whenever the
 * full set of workspaces is needed, rather than guessing a single large `perPage`.
 *
 * The first page is fetched to learn the total count, then the remaining pages are
 * requested in parallel. Results are de-duplicated by workspace id, so a workspace that
 * shifts across a page boundary between requests is not counted twice.
 *
 * The provided client must be able to read the hidden `WORKSPACE_TYPE` (e.g. created with
 * `includedHiddenTypes: [WORKSPACE_TYPE]`).
 *
 * TODO: Support projected fields so callers that only need a subset (e.g. just the
 * workspace id) can pass the fields to fetch, reducing the payload transferred per page.
 */
export const fetchAllWorkspaces = async (
  client: SavedObjectsClientContract,
  options: FetchAllWorkspacesOptions = {}
): Promise<Array<SavedObjectsFindResult<WorkspaceAttribute>>> => {
  const findPage = (page: number) =>
    client.find<WorkspaceAttribute>({
      ...options,
      type: WORKSPACE_TYPE,
      page,
      perPage: WORKSPACE_FETCH_ALL_PER_PAGE,
    });

  const firstPage = await findPage(1);
  const savedObjects = [...firstPage.saved_objects];

  // Fan out the remaining pages in parallel based on the total reported by the first page.
  const totalPages = Math.ceil(firstPage.total / WORKSPACE_FETCH_ALL_PER_PAGE);
  if (totalPages > 1) {
    const remainingPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) => findPage(index + 2))
    );
    remainingPages.forEach((response) => savedObjects.push(...response.saved_objects));
  }

  // De-dup by workspace id, keeping the last occurrence, in case a workspace moved across
  // a page boundary while the parallel requests were in flight.
  const workspacesById = new Map<string, SavedObjectsFindResult<WorkspaceAttribute>>();
  for (const savedObject of savedObjects) {
    workspacesById.set(savedObject.id, savedObject);
  }

  return [...workspacesById.values()];
};
