/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Component, ReactNode } from 'react';
import type { Dataset } from '../../../../data/common';
import type { DataPublicPluginStart } from '../../../../data/public';
import type { ExploreFlavor } from '../../../common';
import {
  getSourceTypeRegistry,
  SourceTypeEmptyStateLocation,
} from '../../services/source_type_registry';

interface BoundaryProps {
  /** What to show when the source's empty state throws: Explore's own content. */
  fallback: ReactNode;
  children: ReactNode;
}

/** Keeps a source's failing empty state from taking the page down: Explore's content instead. */
class SourceEmptyStateBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('Explore: a source type empty state failed to render', error);
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface SourceEmptyStateProps {
  location: SourceTypeEmptyStateLocation;
  /** The query's dataset; without one, or for a source with no `emptyState`, `children` as is. */
  dataset?: Dataset;
  data: DataPublicPluginStart;
  flavor?: ExploreFlavor | null;
  onRefresh: () => void;
  /** Explore's own content here. */
  children: ReactNode;
}

/**
 * Explore's content at `location`, wrapped in the active dataset's source type `emptyState` when it
 * has one. If that component throws, Explore's content shows instead.
 */
export const SourceEmptyState = ({
  location,
  dataset,
  children,
  ...rest
}: SourceEmptyStateProps) => {
  const EmptyState = dataset
    ? getSourceTypeRegistry().getForDataset(dataset).emptyState
    : undefined;
  if (!EmptyState || !dataset) return <>{children}</>;
  return (
    // Keyed by dataset: a failure in one dataset's state doesn't stick to the next.
    <SourceEmptyStateBoundary key={`${dataset.type}::${dataset.id}`} fallback={children}>
      <EmptyState location={location} dataset={dataset} {...rest}>
        {children}
      </EmptyState>
    </SourceEmptyStateBoundary>
  );
};
