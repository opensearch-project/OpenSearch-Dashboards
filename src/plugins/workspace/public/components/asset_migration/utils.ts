/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { HttpSetup, SavedObjectsStart } from 'opensearch-dashboards/public';
import { WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES } from '../../../common/constants';

/** Saved objects management owns the list of types the Assets page can display. */
const ALLOWED_TYPES_URL = '/api/opensearch-dashboards/management/saved_objects/_allowed_types';

/**
 * Types kept out of asset migration. `config` and `homepage` hold per-user or global UI state that a
 * workspace must not own, and data sources are connected to the new workspace at creation time.
 */
const MIGRATION_EXCLUDED_TYPES = [
  'config',
  'homepage',
  ...WORKSPACE_DATA_SOURCE_AND_CONNECTION_OBJECT_TYPES,
];

export const formatError = (e: any): string => e?.body?.message || e?.message || String(e);

export const loadMigratableAssetTypes = async (http: HttpSetup): Promise<string[]> => {
  const { types } = await http.get<{ types: string[] }>(ALLOWED_TYPES_URL);
  return types.filter((type) => !MIGRATION_EXCLUDED_TYPES.includes(type));
};

/**
 * Build a KQL `filter` matching only objects whose `workspaces` field is absent.
 *
 * @param types saved object types to search, identical to the find request `type` param
 * @returns a KQL filter expression, or undefined when `types` is empty
 */
export const buildUnassignedWorkspaceFilter = (types: string[]): string | undefined => {
  const uniqueTypes = [...new Set(types)].filter(Boolean);
  if (!uniqueTypes.length) {
    return undefined;
  }
  return `not (${uniqueTypes.map((type) => `${type}.workspaces: *`).join(' or ')})`;
};

export interface UnassignedAsset {
  id: string;
  type: string;
  title: string;
}

export interface UnassignedAssetQuery {
  page: number;
  perPage: number;
  search?: string;
}

/**
 * Count the unassigned saved objects of the given types, transferring none of them.
 *
 * `perPage: 0` reaches the saved objects repository as an OpenSearch `size: 0`, which returns the hit
 * total and zero documents.
 */
export const countUnassignedAssets = async (
  client: SavedObjectsStart['client'],
  types: string[]
): Promise<number> => {
  const filter = buildUnassignedWorkspaceFilter(types);
  if (!filter) {
    return 0;
  }

  const response = await client.find(
    { type: types, filter, perPage: 0, page: 1 },
    { withoutClientBasePath: true }
  );
  return response?.total ?? 0;
};

/**
 * Fetch one page of saved objects that belong to no workspace.
 *
 * Paging and search are resolved by the server, so no caller has to hold the whole set in memory and
 * the reported `total` always describes the same result set as the returned page.
 */
export const findUnassignedAssets = async (
  client: SavedObjectsStart['client'],
  migratableTypes: string[],
  query: UnassignedAssetQuery
): Promise<{ total: number; assets: UnassignedAsset[] }> => {
  const filter = buildUnassignedWorkspaceFilter(migratableTypes);
  if (!filter) {
    return { total: 0, assets: [] };
  }

  const search = query.search?.trim();
  const response = await client.find<{ title?: string }>(
    {
      type: migratableTypes,
      fields: ['title'],
      filter,
      perPage: query.perPage,
      page: query.page,
      ...(migratableTypes.length > 1 ? { sortField: 'type' } : {}),
      ...(search ? { search: `${search}*`, searchFields: ['title'] } : {}),
    },
    { withoutClientBasePath: true }
  );

  return {
    total: response?.total ?? 0,
    assets: (response?.savedObjects ?? []).map((savedObject) => ({
      id: savedObject.id,
      type: savedObject.type,
      title: savedObject.get('title') || savedObject.id,
    })),
  };
};
