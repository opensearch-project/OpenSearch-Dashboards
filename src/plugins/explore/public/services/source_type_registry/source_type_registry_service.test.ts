/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreFlavor } from '../../../common';
import { datasetFitsFlavor } from './opensearch_source_type';
import {
  OPENSEARCH_SOURCE_TYPE_ID,
  SourceTypeDefinition,
  SourceTypeDependencies,
  SourceTypeRegistryService,
} from './source_type_registry_service';
import { DataPublicPluginStart } from '../../../../data/public';

const mockFetchFirstAvailableDataset = jest.fn();
jest.mock('../../application/utils/state_management/utils/redux_persistence', () => ({
  fetchFirstAvailableDataset: (...args: unknown[]) => mockFetchFirstAvailableDataset(...args),
}));
let mockServices: object = { mock: 'services' };
jest.mock('../services', () => ({ getServices: () => mockServices }));

const logsPattern = { id: 'logs-*', title: 'logs-*', type: 'INDEX_PATTERN', signalType: 'logs' };
const spansPattern = {
  id: 'otel-v1-apm-span*',
  title: 'otel-v1-apm-span*',
  type: 'INDEX_PATTERN',
  signalType: 'traces',
};
const dataWithDefault = (defaultDataset?: object) =>
  ({
    query: {
      queryString: { getDatasetService: () => ({ getDefault: () => defaultDataset }) },
    },
  }) as unknown as DataPublicPluginStart;

const fakeSource = (overrides: Partial<SourceTypeDefinition> = {}): SourceTypeDefinition => ({
  id: 'fake',
  label: 'Fake',
  datasetTypes: ['FAKE'],
  resolveDefaultDataset: async () => undefined,
  ...overrides,
});

describe('SourceTypeRegistryService', () => {
  let registry: SourceTypeRegistryService;

  beforeEach(() => {
    registry = new SourceTypeRegistryService();
    mockServices = { mock: 'services' };
  });

  it('has OpenSearch built in, owning index patterns and any unclaimed dataset type', () => {
    expect(registry.getAll().map((s) => s.id)).toEqual([OPENSEARCH_SOURCE_TYPE_ID]);
    expect(registry.getForDataset({ type: 'INDEX_PATTERN' }).id).toBe(OPENSEARCH_SOURCE_TYPE_ID);
    expect(registry.getForDataset({ type: 'PROMETHEUS' }).id).toBe(OPENSEARCH_SOURCE_TYPE_ID);
    expect(registry.getForDataset(undefined).id).toBe(OPENSEARCH_SOURCE_TYPE_ID);
  });

  it('labels OpenSearch as Prometheus on the Metrics flavor', () => {
    const openSearch = registry.get(OPENSEARCH_SOURCE_TYPE_ID)!;
    expect(registry.getLabel(openSearch, ExploreFlavor.Metrics)).toBe('Prometheus');
    expect(registry.getLabel(openSearch, ExploreFlavor.Logs)).toBe('OpenSearch');
    expect(registry.getLabel(fakeSource(), ExploreFlavor.Metrics)).toBe('Fake');
  });

  it('lets a plugin name a source the way its deployment knows it', () => {
    const setup = registry.setup();
    setup.register(fakeSource({ flavorLabels: { [ExploreFlavor.Logs]: 'Fake logs' } }));
    const openSearch = registry.get(OPENSEARCH_SOURCE_TYPE_ID)!;

    setup.setLabel(OPENSEARCH_SOURCE_TYPE_ID, 'My Prometheus', ExploreFlavor.Metrics);
    expect(registry.getLabel(openSearch, ExploreFlavor.Metrics)).toBe('My Prometheus');
    expect(registry.getLabel(openSearch, ExploreFlavor.Logs)).toBe('OpenSearch');

    // Without a flavor it replaces the label, but a flavor's own label still wins on that flavor.
    setup.setLabel('fake', 'My Fake');
    expect(registry.getLabel(registry.get('fake')!, ExploreFlavor.Metrics)).toBe('My Fake');
    expect(registry.getLabel(registry.get('fake')!, ExploreFlavor.Logs)).toBe('Fake logs');
    expect(registry.getLabel(registry.get('fake')!)).toBe('My Fake');

    expect(() => setup.setLabel('missing', 'x')).toThrow(
      'Explore source type "missing" is not registered'
    );
  });

  it('tells whether a dataset belongs to a registered source offered on a flavor', () => {
    registry.setup().register(fakeSource({ flavors: [ExploreFlavor.Metrics] }));

    expect(registry.isRegisteredSourceDataset({ type: 'FAKE' }, ExploreFlavor.Metrics)).toBe(true);
    expect(registry.isRegisteredSourceDataset({ type: 'FAKE' }, ExploreFlavor.Logs)).toBe(false);
    expect(registry.isRegisteredSourceDataset({ type: 'PROMETHEUS' }, ExploreFlavor.Metrics)).toBe(
      false
    );
    expect(registry.isRegisteredSourceDataset(undefined, ExploreFlavor.Metrics)).toBe(false);
  });

  it('resolves a dataset to the registered source that owns its type', () => {
    registry.setup().register(fakeSource());

    expect(registry.getForDataset({ type: 'FAKE' }).id).toBe('fake');
  });

  it('rejects a duplicate id', () => {
    registry.register(fakeSource());

    expect(() => registry.register(fakeSource())).toThrow(
      'Explore source type "fake" is already registered'
    );
  });

  it('keeps the built-in Prometheus connections for the built-in source', () => {
    expect(() => registry.register(fakeSource({ datasetTypes: ['PROMETHEUS'] }))).toThrow(
      'Dataset type "PROMETHEUS" already belongs to Explore source type "opensearch"'
    );
    expect(registry.getForDataset({ type: 'PROMETHEUS' }).id).toBe(OPENSEARCH_SOURCE_TYPE_ID);
  });

  it("names a dataset's metrics resource client: Prometheus for the built-in source", () => {
    registry.register(
      fakeSource({
        id: 'browsable',
        datasetTypes: ['BROWSABLE'],
        metricsResourceClientId: 'my-metrics',
      })
    );
    registry.register(fakeSource({ id: 'queryOnly', datasetTypes: ['QUERY_ONLY'] }));
    expect(registry.getMetricsResourceClientId({ type: 'PROMETHEUS' })).toBe('prometheus');
    expect(registry.getMetricsResourceClientId(undefined)).toBe('prometheus');
    expect(registry.getMetricsResourceClientId({ type: 'BROWSABLE' })).toBe('my-metrics');
    expect(registry.getMetricsResourceClientId({ type: 'QUERY_ONLY' })).toBeUndefined();
  });

  it('treats PromQL and the languages Metrics sources list as metrics languages', () => {
    registry.register(
      fakeSource({ flavors: [ExploreFlavor.Metrics], languageSettings: { MY_SQL: {} } })
    );
    registry.register(
      fakeSource({ id: 'logs', datasetTypes: ['LOGS'], languageSettings: { MY_LOGS_QL: {} } })
    );

    expect(registry.isMetricsLanguage('PROMQL')).toBe(true);
    expect(registry.isMetricsLanguage('MY_SQL')).toBe(true);
    expect(registry.isMetricsLanguage('MY_LOGS_QL')).toBe(false);
    expect(registry.isMetricsLanguage('PPL')).toBe(false);
    expect(registry.isMetricsLanguage('SQL')).toBe(false);
    expect(registry.isMetricsLanguage(undefined)).toBe(false);
  });

  it('shows the PromQL rows only for PromQL on a source with a metrics resource client', () => {
    const MyEditor = () => null;
    registry.register(
      fakeSource({
        id: 'browsable',
        datasetTypes: ['BROWSABLE'],
        metricsResourceClientId: 'my-metrics',
        languageSettings: { MY_SQL: { metricsQueryEditor: MyEditor } },
      })
    );
    registry.register(fakeSource({ id: 'queryOnly', datasetTypes: ['QUERY_ONLY'] }));
    registry.register(
      fakeSource({
        id: 'ownEditor',
        datasetTypes: ['OWN_EDITOR'],
        metricsResourceClientId: 'my-metrics',
        languageSettings: { PROMQL: { metricsQueryEditor: MyEditor } },
      })
    );

    expect(registry.usesPromQLRows('PROMQL', { type: 'PROMETHEUS' })).toBe(true);
    expect(registry.usesPromQLRows('PROMQL', undefined)).toBe(true);
    expect(registry.usesPromQLRows('PROMQL', { type: 'BROWSABLE' })).toBe(true);
    expect(registry.usesPromQLRows('MY_SQL', { type: 'BROWSABLE' })).toBe(false);
    expect(registry.usesPromQLRows('PROMQL', { type: 'QUERY_ONLY' })).toBe(false);
    expect(registry.usesPromQLRows('PROMQL', { type: 'OWN_EDITOR' })).toBe(false);
  });

  it('rejects a dataset type another source already owns', () => {
    registry.register(fakeSource());

    expect(() => registry.register(fakeSource({ id: 'other' }))).toThrow(
      'Dataset type "FAKE" already belongs to Explore source type "fake"'
    );
  });

  it('offers a source on Logs only unless it names its flavors', () => {
    registry.register(fakeSource());

    expect(registry.getAll(ExploreFlavor.Logs).map((s) => s.id)).toContain('fake');
    expect(registry.getAll(ExploreFlavor.Metrics).map((s) => s.id)).toEqual([
      OPENSEARCH_SOURCE_TYPE_ID,
    ]);
    expect(registry.getAll(ExploreFlavor.Traces).map((s) => s.id)).toEqual([
      OPENSEARCH_SOURCE_TYPE_ID,
    ]);
  });

  it('filters by flavor and sorts by order', () => {
    registry.register(fakeSource({ id: 'late', order: 50, datasetTypes: ['LATE'] }));
    registry.register(fakeSource({ id: 'early', order: 5, datasetTypes: ['EARLY'] }));
    registry.register(
      fakeSource({ id: 'tracesOnly', datasetTypes: ['TRACES'], flavors: [ExploreFlavor.Traces] })
    );

    expect(registry.getAll(ExploreFlavor.Logs).map((s) => s.id)).toEqual([
      OPENSEARCH_SOURCE_TYPE_ID,
      'early',
      'late',
    ]);
    expect(registry.getAll(ExploreFlavor.Traces).map((s) => s.id)).toContain('tracesOnly');
  });

  describe('OpenSearch default dataset', () => {
    const resolve = (deps: object) =>
      (registry.get(OPENSEARCH_SOURCE_TYPE_ID) as SourceTypeDefinition).resolveDefaultDataset(
        deps as SourceTypeDependencies
      );

    beforeEach(() => mockFetchFirstAvailableDataset.mockReset());

    it("uses the workspace default when it fits the flavor, in Explore's default language", async () => {
      await expect(
        resolve({ data: dataWithDefault(logsPattern), flavor: ExploreFlavor.Logs })
      ).resolves.toEqual({ ...logsPattern, language: 'PPL' });
      expect(mockFetchFirstAvailableDataset).not.toHaveBeenCalled();
    });

    it('skips a traces default on the Logs flavor for the first logs dataset', async () => {
      mockFetchFirstAvailableDataset.mockResolvedValue(logsPattern);

      await expect(
        resolve({ data: dataWithDefault(spansPattern), flavor: ExploreFlavor.Logs })
      ).resolves.toEqual({ ...logsPattern, language: 'PPL' });
      expect(mockFetchFirstAvailableDataset).toHaveBeenCalledWith(
        { mock: 'services' },
        ExploreFlavor.Logs,
        undefined
      );
    });

    it('asks for the traces signal type on the Traces flavor', async () => {
      mockFetchFirstAvailableDataset.mockResolvedValue(spansPattern);

      await expect(
        resolve({ data: dataWithDefault(logsPattern), flavor: ExploreFlavor.Traces })
      ).resolves.toEqual({ ...spansPattern, language: 'PPL' });
      expect(mockFetchFirstAvailableDataset).toHaveBeenCalledWith(
        { mock: 'services' },
        ExploreFlavor.Traces,
        'traces'
      );
    });

    it('opens a Prometheus connection in PromQL on the Metrics flavor', async () => {
      const prometheus = { id: 'prom', title: 'prom', type: 'PROMETHEUS', signalType: 'metrics' };
      await expect(
        resolve({ data: dataWithDefault(prometheus), flavor: ExploreFlavor.Metrics })
      ).resolves.toEqual({ ...prometheus, language: 'PROMQL' });
    });

    it('resolves to undefined when no dataset fits', async () => {
      mockFetchFirstAvailableDataset.mockResolvedValue(undefined);

      await expect(
        resolve({ data: dataWithDefault(undefined), flavor: ExploreFlavor.Logs })
      ).resolves.toBeUndefined();
    });
  });

  it('matches datasets to flavors by signal type', () => {
    expect(datasetFitsFlavor(logsPattern, ExploreFlavor.Logs)).toBe(true);
    expect(
      datasetFitsFlavor({ id: 'x', title: 'x', type: 'INDEX_PATTERN' }, ExploreFlavor.Logs)
    ).toBe(true);
    expect(datasetFitsFlavor(spansPattern, ExploreFlavor.Logs)).toBe(false);
    expect(datasetFitsFlavor(spansPattern, ExploreFlavor.Traces)).toBe(true);
    expect(datasetFitsFlavor(logsPattern, ExploreFlavor.Metrics)).toBe(false);
  });

  describe('language settings', () => {
    beforeEach(() => {
      registry.register(
        fakeSource({
          id: 'cloud',
          datasetTypes: ['CLOUD'],
          flavors: [ExploreFlavor.Logs],
          languageSettings: {
            CloudQL: { tabs: ['logs', 'explore_statistics'] },
            // A built-in language listed by this source gets this source's settings only.
            PPL: { supportsHistogram: false, supportsVisualBuilder: false },
          },
        })
      );
    });

    it("applies a source's settings only while one of its datasets is active", () => {
      expect(registry.supportsHistogram('PPL', { type: 'CLOUD' })).toBe(false);
      expect(registry.supportsVisualBuilder('PPL', { type: 'CLOUD' })).toBe(false);
      expect(registry.supportsHistogram('PPL', { type: 'INDEX_PATTERN' })).toBe(true);
      expect(registry.supportsVisualBuilder('PPL', { type: 'INDEX_PATTERN' })).toBe(true);
    });

    it('turns histogram and builder off for a listed language unless it opts in', () => {
      expect(registry.supportsHistogram('CloudQL', { type: 'CLOUD' })).toBe(false);
      expect(registry.supportsVisualBuilder('CloudQL', { type: 'CLOUD' })).toBe(false);
      expect(registry.getLanguageSettings('CloudQL')).toEqual({
        tabs: ['logs', 'explore_statistics'],
      });
    });

    it("uses a source's settings for its language seen on another source's dataset", () => {
      expect(registry.supportsHistogram('CloudQL', { type: 'INDEX_PATTERN' })).toBe(false);
      expect(registry.supportsVisualBuilder('CloudQL', { type: 'INDEX_PATTERN' })).toBe(false);
    });

    it('tells which sources the visual builder can serve', () => {
      expect(registry.hasVisualBuilder(registry.get('cloud') as SourceTypeDefinition)).toBe(false);
      expect(
        registry.hasVisualBuilder(registry.get(OPENSEARCH_SOURCE_TYPE_ID) as SourceTypeDefinition)
      ).toBe(true);
    });

    it("ignores a source's settings for a built-in language when no dataset is active", () => {
      expect(registry.getLanguageSettings('PPL')).toBeUndefined();
      expect(registry.supportsHistogram('PPL')).toBe(true);
      expect(registry.supportsVisualBuilder('PPL')).toBe(true);
    });

    it('knows which languages Explore can run', () => {
      expect(registry.isExploreLanguage('PPL')).toBe(true);
      expect(registry.isExploreLanguage('CloudQL')).toBe(true);
      expect(registry.isExploreLanguage('kuery')).toBe(false);
    });

    it('keeps built-in behavior for languages no source lists', () => {
      expect(registry.supportsHistogram('SQL', { type: 'INDEX_PATTERN' })).toBe(true);
      expect(registry.supportsHistogram('PROMQL')).toBe(false);
      expect(registry.getLanguageSettings('SQL')).toBeUndefined();
    });

    it('lists languages per tab for the flavors the source is offered on', () => {
      expect(registry.getLanguagesForTab('logs', ExploreFlavor.Logs)).toEqual(['CloudQL', 'PPL']);
      expect(registry.getLanguagesForTab('explore_statistics', ExploreFlavor.Logs)).toEqual([
        'CloudQL',
      ]);
      expect(registry.getLanguagesForTab('logs', ExploreFlavor.Traces)).toEqual([]);
    });

    it("puts a language without tabs on the results tabs of the page's flavor", () => {
      registry.register(
        fakeSource({
          id: 'metricsAndLogs',
          datasetTypes: ['METRICS_AND_LOGS'],
          flavors: [ExploreFlavor.Logs, ExploreFlavor.Metrics],
          languageSettings: { MetricsQL: {} },
        })
      );
      expect(registry.getLanguagesForTab('metrics', ExploreFlavor.Metrics)).toEqual(['MetricsQL']);
      expect(
        registry.getLanguagesForTab('explore_visualization_tab', ExploreFlavor.Metrics)
      ).toEqual(['MetricsQL']);
      expect(registry.getLanguagesForTab('logs', ExploreFlavor.Metrics)).toEqual([]);
      expect(registry.getLanguagesForTab('logs', ExploreFlavor.Logs)).toContain('MetricsQL');
    });
  });

  describe('language guides', () => {
    beforeEach(() => {
      registry.register(
        fakeSource({
          id: 'cloud',
          datasetTypes: ['CLOUD'],
          languageSettings: {
            PROMQL: {
              tag: 'Recent metrics',
              description: 'Cloud PromQL',
              docLink: { title: 'Cloud docs', url: 'https://cloud.test' },
              sampleQueries: [{ label: 'up', query: 'up' }],
            },
            SQL: {},
          },
        })
      );
    });

    it('adds nothing visible for built-in languages on the built-in source', () => {
      // PromQL keeps the Metrics page's existing samples; no labels or descriptions are added.
      const guide = registry.getLanguageGuide('PROMQL', { type: 'PROMETHEUS' });
      expect(guide.label).toBeUndefined();
      expect(guide.description).toBeUndefined();
      expect(guide.docLink).toBeUndefined();
      expect(guide.sampleQueries?.length).toBeGreaterThan(0);
      expect(guide.codeLanguage).toBe('promql');
      expect(registry.getLanguageGuide('SQL')).toEqual({ codeLanguage: 'sql' });
      expect(registry.getLanguageGuide('PPL')).toEqual({});
    });

    it("uses a source's own guide on its datasets", () => {
      expect(registry.getLanguageGuide('PROMQL', { type: 'CLOUD' })).toEqual({
        tag: 'Recent metrics',
        description: 'Cloud PromQL',
        docLink: { title: 'Cloud docs', url: 'https://cloud.test' },
        sampleQueries: [{ label: 'up', query: 'up' }],
      });
    });

    it('never borrows the built-in wording for a language a source lists', () => {
      // OpenSearch's SQL description would misname another store's dialect.
      expect(registry.getLanguageGuide('SQL', { type: 'CLOUD' }).description).toBeUndefined();
    });

    it("labels a language by its source's label, else its registered title, else its id", () => {
      registry.register(
        fakeSource({
          id: 'labelled',
          datasetTypes: ['LABELLED'],
          languageSettings: { SQL: { label: 'Labelled SQL' } },
        })
      );
      mockServices = {
        data: {
          query: {
            queryString: {
              getLanguageService: () => ({
                getLanguage: (id: string) => (id === 'PROMQL' ? { title: 'PromQL' } : undefined),
              }),
            },
          },
        },
      };
      expect(registry.getLanguageLabel('SQL', { type: 'LABELLED' })).toBe('Labelled SQL');
      expect(registry.getLanguageLabel('PROMQL', undefined)).toBe('PromQL');
      expect(registry.getLanguageLabel('SQL', { type: 'CLOUD' })).toBe('SQL');
      expect(registry.getLanguageLabel('kuery', undefined)).toBe('kuery');
      expect(registry.getLanguageLabel(undefined, undefined)).toBe('');
    });

    it("passes a source guide's code language through", () => {
      registry.register(
        fakeSource({
          id: 'coded',
          datasetTypes: ['CODED'],
          languageSettings: { MyQL: { codeLanguage: 'sql' } },
        })
      );
      expect(registry.getLanguageGuide('MyQL', { type: 'CODED' }).codeLanguage).toBe('sql');
    });

    it('returns nothing for an unknown or missing language', () => {
      expect(registry.getLanguageGuide('kuery')).toEqual({});
      expect(registry.getLanguageGuide(undefined)).toEqual({});
    });
  });
});
