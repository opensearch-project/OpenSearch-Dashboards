/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

const mockConvertFiltersToWhereClause = jest.fn(() => '');
const mockGetTimeFilterWhereClause = jest.fn(() => "WHERE `ts` >= '1' AND `ts` <= '2'");

jest.mock('../search/filters', () => ({
  PPLFilterUtils: {
    // Real behavior: splice the where-clause in after the first command.
    insertWhereCommand: (query: string, whereCommand: string) => {
      if (!whereCommand) return query;
      const commands = query.split('|');
      commands.splice(1, 0, whereCommand);
      return commands.map((c) => c.trim()).join(' | ');
    },
    convertFiltersToWhereClause: (...args: unknown[]) => mockConvertFiltersToWhereClause(...args),
    getTimeFilterWhereClause: (...args: unknown[]) => mockGetTimeFilterWhereClause(...args),
  },
}));

import { createExplainQueryPreparer } from './explain_query_preparer';

const makeServices = (overrides: {
  query?: any;
  appId?: string;
  filters?: unknown[];
  hideDatePicker?: boolean;
}) => {
  const query = overrides.query ?? {
    language: 'PPL',
    query: '',
    dataset: { id: 'ds', title: 'logs', type: 'INDEX_PATTERN', timeFieldName: 'ts' },
  };
  const data = {
    query: {
      queryString: {
        getQuery: () => query,
        getDatasetService: () => ({
          getType: () => ({
            languageOverrides: {
              PPL: { hideDatePicker: overrides.hideDatePicker ?? true },
            },
          }),
        }),
      },
      filterManager: { getFilters: () => overrides.filters ?? [] },
      timefilter: { timefilter: { getTime: () => ({ from: 'now-15m', to: 'now' }) } },
    },
    indexPatterns: { getByTitle: () => undefined },
  } as any;
  return {
    data,
    uiSettings: { get: () => false } as any,
    getAppId: () => overrides.appId,
  };
};

describe('createExplainQueryPreparer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConvertFiltersToWhereClause.mockReturnValue('');
  });

  it('prepends source to a leading-pipe query and keeps the time clause out of the cache key', () => {
    const prepare = createExplainQueryPreparer(makeServices({ appId: 'dashboards' }));
    const { query, cacheKey } = prepare('| where LIKE(body, "%error%")');

    // Source prepended (INDEX_PATTERN title is backtick-wrapped).
    expect(cacheKey).toBe('source = `logs` | where LIKE(body, "%error%")');
    // The explained query additionally carries the time filter...
    expect(query).toContain("WHERE `ts` >= '1'");
    // ...but the cache key does NOT.
    expect(cacheKey).not.toContain('`ts` >=');
  });

  it('folds dashboard filters into both query and cache key (pills can change the plan)', () => {
    mockConvertFiltersToWhereClause.mockReturnValue('WHERE `status` = 500');
    const prepare = createExplainQueryPreparer(
      makeServices({ appId: 'dashboards', filters: [{ any: true }] })
    );
    const { query, cacheKey } = prepare('source = logs');

    expect(cacheKey).toContain('WHERE `status` = 500');
    expect(query).toContain('WHERE `status` = 500');
  });

  it('does not fold dashboard filters outside a filter-manager app', () => {
    const prepare = createExplainQueryPreparer(
      makeServices({ appId: 'explore/logs', filters: [{ any: true }] })
    );
    prepare('source = logs');
    expect(mockConvertFiltersToWhereClause).not.toHaveBeenCalled();
  });

  it('backtick-wraps an existing unquoted source for an index-pattern dataset (no double source)', () => {
    // Mirrors addPPLSourceClause's hasSource branch: the host executes the
    // backticked form, so the explained query must match it (sql#4444/#4445).
    const prepare = createExplainQueryPreparer(
      makeServices({
        appId: 'dashboards',
        query: {
          language: 'PPL',
          query: 'source = logs | stats count()',
          dataset: { id: 'ds', title: 'logs', type: 'INDEX_PATTERN' },
        },
      })
    );
    const { cacheKey } = prepare('source = logs | stats count()');
    expect(cacheKey).toBe('source = `logs` | stats count()');
  });

  it('leaves an already-backticked source and non-index datasets unchanged', () => {
    const prepareIndex = createExplainQueryPreparer(
      makeServices({
        appId: 'dashboards',
        query: {
          language: 'PPL',
          query: 'source = `logs` | stats count()',
          dataset: { id: 'ds', title: 'logs', type: 'INDEX_PATTERN' },
        },
      })
    );
    expect(prepareIndex('source = `logs` | stats count()').cacheKey).toBe(
      'source = `logs` | stats count()'
    );

    const prepareS3 = createExplainQueryPreparer(
      makeServices({
        appId: 'dashboards',
        query: {
          language: 'PPL',
          query: 'source = catalog.db.table | stats count()',
          dataset: { id: 'ds', title: 'catalog.db.table', type: 'S3' },
        },
      })
    );
    expect(prepareS3('source = catalog.db.table | stats count()').cacheKey).toBe(
      'source = catalog.db.table | stats count()'
    );
  });

  it('does not touch field comparisons named source after the first pipe', () => {
    const prepare = createExplainQueryPreparer(
      makeServices({
        appId: 'dashboards',
        query: {
          language: 'PPL',
          query: 'source = logs | where source=prod',
          dataset: { id: 'ds', title: 'logs', type: 'INDEX_PATTERN' },
        },
      })
    );
    expect(prepare('source = logs | where source=prod').cacheKey).toBe(
      'source = `logs` | where source=prod'
    );
  });

  it('does not add filters to a non-search query (describe)', () => {
    const prepare = createExplainQueryPreparer(
      makeServices({
        appId: 'dashboards',
        filters: [{ any: true }],
        query: {
          language: 'PPL',
          query: 'describe logs',
          dataset: { id: 'ds', title: 'logs', type: 'INDEX_PATTERN' },
        },
      })
    );
    const { query, cacheKey } = prepare('describe logs');
    expect(query).toBe('describe logs');
    expect(cacheKey).toBe('describe logs');
    expect(mockConvertFiltersToWhereClause).not.toHaveBeenCalled();
  });

  it('reports how many where commands it injected (dashboard + time)', () => {
    mockConvertFiltersToWhereClause.mockReturnValue('WHERE `status` = 500');
    const prepare = createExplainQueryPreparer(
      makeServices({ appId: 'dashboards', filters: [{ any: true }] })
    );
    // Dashboard filter + time filter (dataset has timeFieldName) = 2.
    expect(prepare('source = logs').injectedWhereCount).toBe(2);
  });

  it('reports zero injected where commands when nothing is folded in', () => {
    const prepare = createExplainQueryPreparer(
      makeServices({
        appId: 'explore/logs',
        query: {
          language: 'PPL',
          query: 'source = logs',
          dataset: { id: 'ds', title: 'logs', type: 'INDEX_PATTERN' },
        },
      })
    );
    // Not a filter-manager app and no time field: nothing injected.
    expect(prepare('source = logs').injectedWhereCount).toBe(0);
  });

  it('skips the time filter when the dataset has no time field', () => {
    const prepare = createExplainQueryPreparer(
      makeServices({
        appId: 'dashboards',
        query: {
          language: 'PPL',
          query: 'source = logs',
          dataset: { id: 'ds', title: 'logs', type: 'INDEX_PATTERN' },
        },
      })
    );
    prepare('source = logs');
    expect(mockGetTimeFilterWhereClause).not.toHaveBeenCalled();
  });
});
