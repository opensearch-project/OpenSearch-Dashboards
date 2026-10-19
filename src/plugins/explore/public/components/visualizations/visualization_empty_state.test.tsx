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
