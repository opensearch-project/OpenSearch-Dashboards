/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  buildUnassignedWorkspaceFilter,
  countUnassignedAssets,
  findUnassignedAssets,
  loadMigratableAssetTypes,
} from './utils';

describe('buildUnassignedWorkspaceFilter', () => {
  it('should build a negated exists clause for a single type', () => {
    expect(buildUnassignedWorkspaceFilter(['dashboard'])).toBe('not (dashboard.workspaces: *)');
  });

  it('should OR one clause per type inside a single negation', () => {
    expect(buildUnassignedWorkspaceFilter(['dashboard', 'index-pattern'])).toBe(
      'not (dashboard.workspaces: * or index-pattern.workspaces: *)'
    );
  });

  it('should emit exactly one clause per requested type', () => {
    const types = ['dashboard', 'visualization', 'search', 'index-pattern'];
    const filter = buildUnassignedWorkspaceFilter(types)!;

    expect(filter.match(/\.workspaces: \*/g)).toHaveLength(types.length);
    types.forEach((type) => {
      expect(filter).toContain(`${type}.workspaces: *`);
    });
  });

  it('should deduplicate types so the clause count still matches the distinct type set', () => {
    expect(buildUnassignedWorkspaceFilter(['dashboard', 'dashboard'])).toBe(
      'not (dashboard.workspaces: *)'
    );
  });

  it('should return undefined for an empty type list rather than an always-true filter', () => {
    expect(buildUnassignedWorkspaceFilter([])).toBeUndefined();
  });

  it('should ignore empty type names', () => {
    expect(buildUnassignedWorkspaceFilter(['', 'dashboard'])).toBe('not (dashboard.workspaces: *)');
    expect(buildUnassignedWorkspaceFilter(['', ''])).toBeUndefined();
  });
});

describe('loadMigratableAssetTypes', () => {
  const httpReporting = (types: string[]) =>
    ({ get: jest.fn().mockResolvedValue({ types }) }) as any;

  it('should narrow what saved objects management reports', async () => {
    const http = httpReporting(['config', 'dashboard']);

    await expect(loadMigratableAssetTypes(http)).resolves.toEqual(['dashboard']);
    expect(http.get).toHaveBeenCalledWith(
      '/api/opensearch-dashboards/management/saved_objects/_allowed_types'
    );
  });

  it('should keep types a workspace may own', async () => {
    await expect(
      loadMigratableAssetTypes(httpReporting(['dashboard', 'visualization', 'index-pattern']))
    ).resolves.toEqual(['dashboard', 'visualization', 'index-pattern']);
  });

  it('should drop per-user and global UI state types', async () => {
    await expect(
      loadMigratableAssetTypes(httpReporting(['config', 'homepage', 'dashboard']))
    ).resolves.toEqual(['dashboard']);
  });

  it('should drop data source and data connection types', async () => {
    await expect(
      loadMigratableAssetTypes(httpReporting(['data-source', 'data-connection', 'search']))
    ).resolves.toEqual(['search']);
  });

  it('should return an empty list when every type is excluded', async () => {
    await expect(loadMigratableAssetTypes(httpReporting(['config', 'homepage']))).resolves.toEqual(
      []
    );
  });
});

describe('countUnassignedAssets', () => {
  it('should request a count only, never the objects', async () => {
    const client = { find: jest.fn().mockResolvedValue({ total: 42, savedObjects: [] }) } as any;

    await expect(countUnassignedAssets(client, ['dashboard'])).resolves.toBe(42);

    const [findOptions, prependOptions] = client.find.mock.calls[0];
    expect(findOptions.perPage).toBe(0);
    expect(findOptions.fields).toBeUndefined();
    expect(findOptions.type).toEqual(['dashboard']);
    expect(findOptions.filter).toBe('not (dashboard.workspaces: *)');
    expect(prependOptions).toEqual({ withoutClientBasePath: true });
  });

  it('should return zero without querying when there are no migratable types', async () => {
    const client = { find: jest.fn() } as any;

    await expect(countUnassignedAssets(client, [])).resolves.toBe(0);
    expect(client.find).not.toHaveBeenCalled();
  });

  it('should treat a missing total as zero', async () => {
    const client = { find: jest.fn().mockResolvedValue({}) } as any;

    await expect(countUnassignedAssets(client, ['dashboard'])).resolves.toBe(0);
  });
});

const makeSavedObject = (id: string, type: string, title?: string) => ({
  id,
  type,
  get: (field: string) => (field === 'title' ? title : undefined),
});

describe('findUnassignedAssets', () => {
  const migratableTypes = ['dashboard', 'visualization'];

  const findMock = (savedObjects: any[] = [], total = savedObjects.length) =>
    jest.fn().mockResolvedValue({ total, savedObjects });

  /**
   * The filter is built from one `<type>.workspaces: *` clause per type, so it must be derived from
   * the exact same list as the `type` param -- any divergence silently changes the result set. A
   * multi-type request can only sort on a root property, so grouping by type is the whole ordering.
   */
  it('sends the same type list to `type` and the filter, with sortField type for a multi-type query', async () => {
    const client = { find: findMock() } as any;

    await findUnassignedAssets(client, migratableTypes, { page: 2, perPage: 100 });

    const [options, prepend] = client.find.mock.calls[0];
    expect(options.type).toEqual(['dashboard', 'visualization']);
    expect(options.filter).toBe('not (dashboard.workspaces: * or visualization.workspaces: *)');
    expect(options.sortField).toBe('type');
    expect(options.fields).toEqual(['title']);
    expect(options.page).toBe(2);
    expect(options.perPage).toBe(100);
    expect(prepend).toEqual({ withoutClientBasePath: true });
  });

  it('omits sortField for a single-type query', async () => {
    const client = { find: findMock() } as any;

    await findUnassignedAssets(client, ['dashboard'], { page: 1, perPage: 100 });

    expect(client.find.mock.calls[0][0].sortField).toBeUndefined();
  });

  // Search is opt-in: the core find route needs an explicit prefix pattern and searchFields, so
  // neither may be sent when the caller supplied no search.
  it('sends no search or searchFields when no search is given', async () => {
    const client = { find: findMock() } as any;

    await findUnassignedAssets(client, ['dashboard'], { page: 1, perPage: 100 });

    const options = client.find.mock.calls[0][0];
    expect(options.search).toBeUndefined();
    expect(options.searchFields).toBeUndefined();
  });

  it('turns a given search into a title prefix query', async () => {
    const client = { find: findMock() } as any;

    await findUnassignedAssets(client, ['dashboard'], { page: 1, perPage: 100, search: 'sales' });

    const options = client.find.mock.calls[0][0];
    expect(options.search).toBe('sales*');
    expect(options.searchFields).toEqual(['title']);
  });

  it('treats a blank search as no search', async () => {
    const client = { find: findMock() } as any;

    await findUnassignedAssets(client, ['dashboard'], { page: 1, perPage: 100, search: '   ' });

    const options = client.find.mock.calls[0][0];
    expect(options.search).toBeUndefined();
    expect(options.searchFields).toBeUndefined();
  });

  it('issues no request at all for an empty migratable type list', async () => {
    const client = { find: jest.fn() } as any;

    await expect(findUnassignedAssets(client, [], { page: 1, perPage: 100 })).resolves.toEqual({
      total: 0,
      assets: [],
    });
    expect(client.find).not.toHaveBeenCalled();
  });

  it('maps the page to assets, falling back to the id when a title is missing', async () => {
    const client = {
      find: findMock(
        [makeSavedObject('d1', 'dashboard', 'Sales'), makeSavedObject('v1', 'visualization')],
        9
      ),
    } as any;

    await expect(
      findUnassignedAssets(client, migratableTypes, { page: 1, perPage: 100 })
    ).resolves.toEqual({
      total: 9,
      assets: [
        { id: 'd1', type: 'dashboard', title: 'Sales' },
        { id: 'v1', type: 'visualization', title: 'v1' },
      ],
    });
  });
});
