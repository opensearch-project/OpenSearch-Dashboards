/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { ContextContributor } from '../../context_provider/public';

/**
 * Discover Context Contributor - demonstrates simple URL-based context capture
 * 
 * This shows the "Simple URL-based Context" approach where the plugin
 * only needs to declare which URL parameters it cares about and provide
 * a parsing function. The Context Provider handles all the URL monitoring.
 */
export class DiscoverContextContributor implements ContextContributor {
  appId = 'discover';
  
  // Simple approach: Just declare which URL state keys we care about
  urlStateKeys = ['_g', '_a', '_q'];
  
  /**
   * Parse URL state into meaningful context
   * This is called by Context Provider when URL state changes
   */
  parseUrlState(urlState: Record<string, any>): Record<string, any> {
    console.log('📋 Discover: Parsing URL state...', urlState);
    
    const context = {
      type: 'discover',
      timeRange: urlState._g?.time,
      filters: urlState._g?.filters || [],
      refreshInterval: urlState._g?.refreshInterval,
      query: urlState._q?.query,
      dataset: urlState._q?.dataset,
      columns: urlState._a?.columns || ['_source'],
      sort: urlState._a?.sort,
      interval: urlState._a?.interval,
      timestamp: Date.now()
    };

    console.log('✅ Discover: Context parsed:', context);
    return context;
  }

  /**
   * Get available actions for Discover
   */
  getAvailableActions(): string[] {
    return [
      'addFilter',
      'removeFilter',
      'setTimeRange',
      'addColumn',
      'removeColumn',
      'changeSort',
      'runQuery'
    ];
  }

  /**
   * Execute Discover-specific actions
   */
  async executeAction(actionType: string, params: any): Promise<any> {
    console.log(`🎯 Discover: Executing action ${actionType}`, params);
    
    switch (actionType) {
      case 'runQuery':
        // This would integrate with Discover's query execution
        return { success: true, message: 'Query executed' };
        
      case 'addFilter':
        // This would add a filter to the current search
        return { success: true, message: 'Filter added', filter: params.filter };
        
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }
}