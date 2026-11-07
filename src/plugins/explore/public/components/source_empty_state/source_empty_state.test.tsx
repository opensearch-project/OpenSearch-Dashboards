/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { render, screen } from '@testing-library/react';
import { ExploreFlavor } from '../../../common';
import {
  SourceTypeEmptyStateProps,
  SourceTypeRegistryService,
  setSourceTypeRegistry,
} from '../../services/source_type_registry';
import { SourceEmptyState } from './source_empty_state';

const sourceDataset = { id: 'source-dataset', title: 'Source dataset', type: 'TEST_SOURCE' };
const data = {} as any;

const register = (emptyState: (props: SourceTypeEmptyStateProps) => JSX.Element) => {
  const registry = new SourceTypeRegistryService();
  registry.register({
    id: 'test-source',
    label: 'Test source',
    datasetTypes: ['TEST_SOURCE'],
    resolveDefaultDataset: async () => undefined,
    emptyState,
  });
  setSourceTypeRegistry(registry);
};

const renderAt = (dataset?: Record<string, unknown>) =>
  render(
    <SourceEmptyState
      location="logsResults"
      dataset={dataset as any}
      data={data}
      flavor={ExploreFlavor.Logs}
      onRefresh={jest.fn()}
    >
      <div data-test-subj="exploreContent" />
    </SourceEmptyState>
  );

describe('SourceEmptyState', () => {
  afterAll(() => setSourceTypeRegistry(new SourceTypeRegistryService()));

  it("renders the source's empty state around Explore's content", () => {
    register(({ children }) => <div data-test-subj="sourceEmptyState">{children}</div>);
    renderAt(sourceDataset);
    expect(screen.getByTestId('sourceEmptyState')).toContainElement(
      screen.getByTestId('exploreContent')
    );
  });

  it("shows Explore's content alone without a dataset, or for another source's dataset", () => {
    register(() => <div data-test-subj="sourceEmptyState" />);
    renderAt(undefined);
    expect(screen.getByTestId('exploreContent')).toBeInTheDocument();
    renderAt({ id: 'logs-*', title: 'logs-*', type: 'INDEX_PATTERN' });
    expect(screen.queryByTestId('sourceEmptyState')).toBeNull();
    expect(screen.getAllByTestId('exploreContent')).toHaveLength(2);
  });

  it("falls back to Explore's content when the source's empty state throws", () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    register(() => {
      throw new Error('broken source');
    });
    renderAt(sourceDataset);
    expect(screen.getByTestId('exploreContent')).toBeInTheDocument();
    consoleError.mockRestore();
  });

  it('tries the next dataset again after a failure', () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    register(({ dataset, children }) => {
      if (dataset.id === 'broken') throw new Error('broken source');
      return <div data-test-subj="sourceEmptyState">{children}</div>;
    });
    const { rerender } = renderAt({ ...sourceDataset, id: 'broken' });
    expect(screen.queryByTestId('sourceEmptyState')).toBeNull();
    rerender(
      <SourceEmptyState
        location="logsResults"
        dataset={sourceDataset as any}
        data={data}
        flavor={ExploreFlavor.Logs}
        onRefresh={jest.fn()}
      >
        <div data-test-subj="exploreContent" />
      </SourceEmptyState>
    );
    expect(screen.getByTestId('sourceEmptyState')).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
