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
jest.mock('../services', () => ({ getServices: () => ({ mock: 'services' }) }));

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
  });

  it('has OpenSearch built in, owning index patterns and any unclaimed dataset type', () => {
    expect(registry.getAll().map((s) => s.id)).toEqual([OPENSEARCH_SOURCE_TYPE_ID]);
    expect(registry.getForDataset({ type: 'INDEX_PATTERN' }).id).toBe(OPENSEARCH_SOURCE_TYPE_ID);
    expect(registry.getForDataset({ type: 'PROMETHEUS' }).id).toBe(OPENSEARCH_SOURCE_TYPE_ID);
    expect(registry.getForDataset(undefined).id).toBe(OPENSEARCH_SOURCE_TYPE_ID);
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
  });
});
