/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { MemoExoticComponent } from 'react';
import { ISearchResult, QueryState } from '../../application/utils/state_management/slices';
import { QueryExecutionStatus } from '../../application/utils/state_management/types';
import { Query } from '../../../../data/common';

/**
 * Props passed to tab components
 */
export interface TabComponentProps {
  query: QueryState;
  results: Record<string, unknown>;
  status: QueryExecutionStatus;
  error: Error | null;
  cacheKey: string;
}

/**
 * Definition of a tab in the Explore plugin
 */
export interface TabDefinition {
  id: string;
  label: string;
  flavor: string[];
  order?: number;

  // Language-aware query handling
  supportedLanguages: string[];

  // Transform query string for cache key generation
  prepareQuery?: (query: Query) => string;

  // Handle query results
  handleQueryResult?: (results: ISearchResult, error: any | null) => Promise<void>;

  // Optional results processor for raw results
  resultsProcessor?: (rawResults: any, indexPattern: any, includeHistogram?: boolean) => any;

  // UI Components
  component: (() => React.JSX.Element | null) | MemoExoticComponent<() => React.JSX.Element>;

  // Optional lifecycle hooks
  onActive?: () => void;
  onInactive?: () => void;
}

/**
 * Service for registering and retrieving tabs
 */
export class TabRegistryService {
  private tabs: Map<string, TabDefinition> = new Map();

  /**
   * Register a new tab
   */
  public registerTab(tabDefinition: TabDefinition): void {
    this.tabs.set(tabDefinition.id, tabDefinition);
  }

  /**
   * Get a tab by ID
   */
  public getTab(id: string): TabDefinition | undefined {
    return this.tabs.get(id);
  }

  /**
   * Get all registered tabs, sorted by order
   */
  public getAllTabs(): TabDefinition[] {
    return Array.from(this.tabs.values()).sort((a, b) => {
      return (a.order || 100) - (b.order || 100);
    });
  }
}
