/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Query } from '../../../../data/common';
import { ResultStatus } from '../../application/legacy/discover/application/view_components/utils/use_search';

/**
 * Props passed to tab components
 */
export interface TabComponentProps {
  query: Query;
  results: Record<string, unknown>;
  status: ResultStatus;
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

  // Transform complete query object instead of just string (now optional)
  prepareQuery?: (query: Query) => Query;

  // Optional results processor for raw results
  resultsProcessor?: (rawResults: any, indexPattern: any, includeHistogram?: boolean) => any;

  // UI Components
  component: React.ComponentType<TabComponentProps>;

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
