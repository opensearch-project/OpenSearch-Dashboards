/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';

import { VisualizationEmptyState } from './visualization_empty_state';
import {
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../services/source_type_registry';
import { setServices } from '../../services/services';
import type { ExploreServices } from '../../types';

describe('VisualizationEmptyState', () => {
  it('renders empty state with title and tabs', () => {
    render(<VisualizationEmptyState />);

    expect(
      screen.getByText('Select a visualization type and fields to get started')
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Sample queries' })).toBeInTheDocument();
  });

  it('displays help content by default', () => {
    render(<VisualizationEmptyState />);

    expect(screen.getByText('Reference documentations')).toBeInTheDocument();
  });

  it('displays sample queries when tab is selected', () => {
    render(<VisualizationEmptyState />);

    const sampleTab = screen.getByRole('tab', { name: 'Sample queries' });
    sampleTab.click();

    expect(screen.getByText('Top services with faults')).toBeInTheDocument();
    expect(screen.getByText('Top slow services')).toBeInTheDocument();
  });

  describe('per language', () => {
    afterEach(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

    it("shows a language's own samples instead of PPL's", () => {
      render(<VisualizationEmptyState language="PROMQL" dataset={{ type: 'PROMETHEUS' }} />);
      expect(screen.getByText('HTTP request rate by status code')).toBeInTheDocument();
      expect(screen.queryByText('Top services with faults')).not.toBeInTheDocument();
    });

    it("uses a registered source's samples and docs for its language", () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'other',
        label: 'Other',
        datasetTypes: ['OTHER'],
        resolveDefaultDataset: async () => undefined,
        languageSettings: {
          OtherQL: {
            sampleQueries: [{ label: 'Busiest queues', query: 'SELECT busiest' }],
            docLink: { title: 'OtherQL docs', url: 'https://other.test/docs' },
          },
        },
      });
      setSourceTypeRegistry(registry);
      render(<VisualizationEmptyState language="OtherQL" dataset={{ type: 'OTHER' }} />);
      expect(screen.getByText('Busiest queues')).toBeInTheDocument();
      expect(screen.getByText('Reference documentations').closest('a')).toHaveAttribute(
        'href',
        'https://other.test/docs'
      );
      expect(screen.queryByText('Top services with faults')).not.toBeInTheDocument();
    });

    it('still links to the docs of a language that has docs but no samples', () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'other',
        label: 'Other',
        datasetTypes: ['OTHER'],
        resolveDefaultDataset: async () => undefined,
        languageSettings: {
          OtherQL: { docLink: { title: 'OtherQL docs', url: 'https://other.test/docs' } },
        },
      });
      setSourceTypeRegistry(registry);
      render(<VisualizationEmptyState language="OtherQL" dataset={{ type: 'OTHER' }} />);
      expect(screen.queryByRole('tab', { name: 'Sample queries' })).not.toBeInTheDocument();
      expect(screen.getByText('Reference documentations').closest('a')).toHaveAttribute(
        'href',
        'https://other.test/docs'
      );
    });

    it("keeps the caller's dataset when only the language falls back to the active query", () => {
      const registry = new SourceTypeRegistryService();
      registry.register({
        id: 'other',
        label: 'Other',
        datasetTypes: ['OTHER'],
        resolveDefaultDataset: async () => undefined,
        languageSettings: {
          PPL: { sampleQueries: [{ label: 'Other PPL sample', query: 'source = x' }] },
        },
      });
      setSourceTypeRegistry(registry);
      // The active query (a dashboard's, say) is PPL on an index pattern. The caller passes only
      // its dataset: the language comes from the active query, the dataset stays the caller's.
      setServices({
        data: {
          query: {
            queryString: {
              getQuery: () => ({ language: 'PPL', dataset: { type: 'INDEX_PATTERN' } }),
            },
          },
        },
      } as unknown as ExploreServices);
      render(<VisualizationEmptyState dataset={{ type: 'OTHER' }} />);
      expect(screen.getByText('Other PPL sample')).toBeInTheDocument();
      expect(screen.queryByText('Top services with faults')).not.toBeInTheDocument();
      setServices(undefined as unknown as ExploreServices);
    });

    it('shows no samples for a language that has none, rather than PPL ones', () => {
      render(<VisualizationEmptyState language="SQL" dataset={{ type: 'INDEX_PATTERN' }} />);
      expect(
        screen.getByText('Select a visualization type and fields to get started')
      ).toBeInTheDocument();
      expect(screen.queryByRole('tab', { name: 'Sample queries' })).not.toBeInTheDocument();
      expect(screen.queryByText('Top services with faults')).not.toBeInTheDocument();
    });
  });
});
