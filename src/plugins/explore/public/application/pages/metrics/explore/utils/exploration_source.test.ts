/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ExploreFlavor } from '../../../../../../common';
import {
  SourceTypeDefinition,
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../../../../services/source_type_registry';
import { BUILT_IN_LANGUAGE_GUIDES } from '../../../../../services/source_type_registry/built_in_language_guides';
import { getExplorationSource, getNoMetricsBody } from './exploration_source';

const mySource = (overrides: Partial<SourceTypeDefinition> = {}): SourceTypeDefinition => ({
  id: 'my-metrics',
  label: 'My Store',
  flavorLabels: { [ExploreFlavor.Metrics]: 'My Metrics' },
  datasetTypes: ['MY_METRICS'],
  flavors: [ExploreFlavor.Metrics],
  resolveDefaultDataset: async () => undefined,
  metricsResourceClientId: 'my-metrics',
  ...overrides,
});

describe('getExplorationSource', () => {
  let registry: SourceTypeRegistryService;
  beforeEach(() => {
    registry = new SourceTypeRegistryService();
    setSourceTypeRegistry(registry);
  });

  it('introduces the built-in source as Prometheus, with its advice and samples', () => {
    for (const dataset of [undefined, { type: 'PROMETHEUS' }]) {
      expect(getExplorationSource(dataset)).toEqual({
        label: 'Prometheus',
        emptyHint: 'Try adjusting the time range or verify the data source is scraping targets.',
        sampleQueries: BUILT_IN_LANGUAGE_GUIDES.PROMQL.sampleQueries,
        codeLanguage: 'promql',
      });
    }
  });

  it('introduces a registered source by its Metrics label, advice and PromQL samples', () => {
    const samples = [{ label: 'Up targets', query: 'up{job="mine"}' }];
    registry.register(
      mySource({
        metricsEmptyHint: 'Only some metrics are listed here.',
        languageSettings: { PROMQL: { sampleQueries: samples } },
      })
    );
    expect(getExplorationSource({ type: 'MY_METRICS' })).toEqual({
      label: 'My Metrics',
      emptyHint: 'Only some metrics are listed here.',
      sampleQueries: samples,
      codeLanguage: undefined,
    });
  });

  it('never offers the built-in samples or advice for a registered source', () => {
    registry.register(mySource({ languageSettings: { PROMQL: {} } }));
    const source = getExplorationSource({ type: 'MY_METRICS' });
    expect(source.sampleQueries).toEqual([]);
    expect(source.emptyHint).toBeUndefined();
  });

  it('follows a label the deployment sets', () => {
    registry.setLabel('opensearch', 'Managed Prometheus', ExploreFlavor.Metrics);
    expect(getExplorationSource({ type: 'PROMETHEUS' }).label).toBe('Managed Prometheus');
  });
});

describe('getNoMetricsBody', () => {
  it('names the source, then gives its advice', () => {
    expect(getNoMetricsBody({ label: 'My Metrics', emptyHint: 'Only some are listed.' })).toBe(
      'The selected My Metrics data source returned no metrics for the current time range. Only some are listed.'
    );
  });

  it('reads as before for Prometheus', () => {
    expect(
      getNoMetricsBody({
        label: 'Prometheus',
        emptyHint: 'Try adjusting the time range or verify the data source is scraping targets.',
      })
    ).toBe(
      'The selected Prometheus data source returned no metrics for the current time range. Try adjusting the time range or verify the data source is scraping targets.'
    );
  });

  it("gives generic advice without the source's own, and names no source without a label", () => {
    expect(getNoMetricsBody({ label: 'My Metrics', emptyHint: '  ' })).toBe(
      'The selected My Metrics data source returned no metrics for the current time range. Try adjusting the time range.'
    );
    expect(getNoMetricsBody({ label: ' ' })).toBe(
      'The selected data source returned no metrics for the current time range. Try adjusting the time range.'
    );
    expect(getNoMetricsBody()).toBe(
      'The selected data source returned no metrics for the current time range. Try adjusting the time range.'
    );
  });
});
