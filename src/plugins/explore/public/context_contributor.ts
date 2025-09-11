/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { SavedObjectsClientContract } from '../../../core/public';
import {
  StatefulContextContributor,
  ContextCapturePattern,
  DocumentExpansionContext
} from '../../context_provider/public';
import { formatExploreContext } from './services/context_formatter';

/**
 * Explore Context Contributor - demonstrates HYBRID context capture pattern
 * 
 * This combines:
 * 1. URL-based context (index pattern, query, filters, time range)
 * 2. Transient UI action context (document expansions, field selections)
 * 
 * Key Features:
 * - Tracks multiple expanded documents simultaneously
 * - Captures document details and interaction history
 * - Maintains state not reflected in URL
 * - Demonstrates action-based context capture
 */
export class ExploreContextContributor implements StatefulContextContributor {
  appId = 'explore'; // This should match the app registration
  
  // Also handle explore sub-apps like explore/logs, explore/traces, etc.
  canHandleApp(appId: string): boolean {
    return appId === this.appId || appId.startsWith('explore/');
  }
  capturePattern = ContextCapturePattern.HYBRID;
  
  // Define UI Actions this contributor monitors
  contextTriggerActions = [
    'DOCUMENT_EXPAND',
    'DOCUMENT_COLLAPSE', 
    'FIELD_FILTER_ADD',
    'FIELD_FILTER_REMOVE',
    'TABLE_ROW_SELECT'
  ];
  
  // Transient state management (not in URL)
  private expandedDocuments = new Map<string, DocumentExpansionContext>();
  private selectedFields = new Map<string, any>();
  private lastInteractionTime = Date.now();
  private interactionCount = 0;
  
  constructor(
    private savedObjects: SavedObjectsClientContract
  ) {}

  /**
   * Initialize the contributor - set up any required state
   */
  initialize(): void {
    console.log('🔧 Explore Context Contributor initialized');
    this.clearTransientState();
  }

  /**
   * Capture static context combining URL state + transient state
   */
  async captureStaticContext(): Promise<Record<string, any>> {
    console.log('🔍 Explore: Capturing hybrid context (URL + transient state)');
    
    try {
      // 1. Parse URL-based context
      const urlContext = this.parseUrlState();
      
      // 2. Get transient state
      const transientState = this.getTransientState();
      
      // 3. Get metadata about current state
      const stateMetadata = this.getStateMetadata();
      
      const context = {
        type: 'explore',
        capturePattern: this.capturePattern,
        
        // URL-based context (standard Discover-like state)
        indexPattern: urlContext.indexPattern,
        query: urlContext.query,
        filters: urlContext.filters,
        columns: urlContext.columns,
        sort: urlContext.sort,
        timeRange: urlContext.timeRange,
        
        // Transient state (not in URL)
        expandedDocuments: transientState.expandedDocuments,
        selectedFields: transientState.selectedFields,
        interactionSummary: transientState.interactionSummary,
        
        // Context metadata
        metadata: {
          ...stateMetadata,
          urlKeys: Object.keys(urlContext),
          transientKeys: Object.keys(transientState)
        },
        
        timestamp: Date.now()
      };

      console.log(`✅ Explore: Context captured with ${this.expandedDocuments.size} expanded documents`);
      return context;
      
    } catch (error) {
      console.error('❌ Explore: Error capturing context:', error);
      return {
        type: 'explore',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Get formatted context for LLM consumption
   */
  async getFormattedContext(): Promise<string> {
    try {
      const rawContext = await this.captureStaticContext();
      const contextWithUrl = {
        ...rawContext,
        data: {
          ...rawContext,
          url: window.location.href,
          appId: this.appId
        }
      };
      return formatExploreContext(contextWithUrl);
    } catch (error) {
      console.error('❌ Error formatting Explore context:', error);
      return `# Explore Context Error\n\nFailed to format context: ${error.message}`;
    }
  }

  /**
   * Parse URL state (similar to Discover)
   */
  parseUrlState(): Record<string, any> {
    const urlParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    
    // Parse _a (app state) and _g (global state) parameters
    const appState = this.parseStateParam(urlParams.get('_a'));
    const globalState = this.parseStateParam(urlParams.get('_g'));
    
    return {
      indexPattern: appState?.index || 'unknown',
      query: appState?.query || { query: '', language: 'kuery' },
      filters: globalState?.filters || [],
      columns: appState?.columns || ['_source'],
      sort: appState?.sort || [],
      timeRange: globalState?.time || { from: 'now-15m', to: 'now' },
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: hash
    };
  }

  /**
   * Parse URL state parameter (handles URL encoding)
   */
  private parseStateParam(param: string | null): Record<string, any> | null {
    if (!param) return null;
    
    try {
      const decoded = decodeURIComponent(param);
      return JSON.parse(decoded);
    } catch (error) {
      console.warn('Could not parse state parameter:', param, error);
      return null;
    }
  }

  /**
   * Capture dynamic context when UI actions occur
   */
  captureDynamicContext(trigger: string, data: any): Record<string, any> {
    console.log(`⚡ Explore: Capturing dynamic context for trigger: ${trigger}`, data);
    
    this.lastInteractionTime = Date.now();
    this.interactionCount++;
    
    switch (trigger) {
      case 'DOCUMENT_EXPAND':
        return this.handleDocumentExpand(data);
      case 'DOCUMENT_COLLAPSE':
        return this.handleDocumentCollapse(data);
      case 'FIELD_FILTER_ADD':
        return this.handleFieldFilterAdd(data);
      case 'FIELD_FILTER_REMOVE':
        return this.handleFieldFilterRemove(data);
      case 'TABLE_ROW_SELECT':
        return this.handleTableRowSelect(data);
      default:
        return {
          type: 'explore_dynamic',
          trigger,
          timestamp: Date.now(),
          data,
          message: `Unhandled trigger: ${trigger}`
        };
    }
  }

  /**
   * Handle document expansion
   */
  private handleDocumentExpand(data: any): Record<string, any> {
    const documentId = data.documentId || data.rowId || `doc_${Date.now()}`;
    
    const expansionContext: DocumentExpansionContext = {
      documentId,
      documentData: data.documentData || data.rowData || {},
      expandedAt: Date.now(),
      interactionCount: this.interactionCount,
      fieldSelections: []
    };
    
    this.expandedDocuments.set(documentId, expansionContext);
    
    console.log(`📄 Document expanded: ${documentId} (Total: ${this.expandedDocuments.size})`);
    
    return {
      type: 'explore_dynamic',
      trigger: 'DOCUMENT_EXPAND',
      timestamp: Date.now(),
      data: {
        documentId,
        documentData: expansionContext.documentData,
        totalExpanded: this.expandedDocuments.size,
        isMultipleExpanded: this.expandedDocuments.size > 1
      }
    };
  }

  /**
   * Handle document collapse
   */
  private handleDocumentCollapse(data: any): Record<string, any> {
    const documentId = data.documentId || data.rowId;
    
    if (documentId && this.expandedDocuments.has(documentId)) {
      this.expandedDocuments.delete(documentId);
      console.log(`📄 Document collapsed: ${documentId} (Remaining: ${this.expandedDocuments.size})`);
    }
    
    return {
      type: 'explore_dynamic',
      trigger: 'DOCUMENT_COLLAPSE',
      timestamp: Date.now(),
      data: {
        documentId,
        totalExpanded: this.expandedDocuments.size,
        remainingDocuments: Array.from(this.expandedDocuments.keys())
      }
    };
  }

  /**
   * Handle field filter addition
   */
  private handleFieldFilterAdd(data: any): Record<string, any> {
    const fieldName = data.fieldName || data.field;
    const filterValue = data.filterValue || data.value;
    
    if (fieldName) {
      this.selectedFields.set(fieldName, {
        value: filterValue,
        addedAt: Date.now(),
        interactionCount: this.interactionCount
      });
      
      console.log(`🔍 Field filter added: ${fieldName} = ${filterValue}`);
    }
    
    return {
      type: 'explore_dynamic',
      trigger: 'FIELD_FILTER_ADD',
      timestamp: Date.now(),
      data: {
        fieldName,
        filterValue,
        totalFilters: this.selectedFields.size,
        allFilters: Object.fromEntries(this.selectedFields)
      }
    };
  }

  /**
   * Handle field filter removal
   */
  private handleFieldFilterRemove(data: any): Record<string, any> {
    const fieldName = data.fieldName || data.field;
    
    if (fieldName && this.selectedFields.has(fieldName)) {
      this.selectedFields.delete(fieldName);
      console.log(`🔍 Field filter removed: ${fieldName}`);
    }
    
    return {
      type: 'explore_dynamic',
      trigger: 'FIELD_FILTER_REMOVE',
      timestamp: Date.now(),
      data: {
        fieldName,
        totalFilters: this.selectedFields.size,
        remainingFilters: Object.fromEntries(this.selectedFields)
      }
    };
  }

  /**
   * Handle table row selection (can trigger document expansion)
   */
  private handleTableRowSelect(data: any): Record<string, any> {
    const rowData = data.rowData || {};
    const rowIndex = data.rowIndex || 0;
    
    // If this row selection leads to expansion, we'll handle it in handleDocumentExpand
    console.log(`📋 Table row selected: index ${rowIndex}`);
    
    return {
      type: 'explore_dynamic',
      trigger: 'TABLE_ROW_SELECT',
      timestamp: Date.now(),
      data: {
        rowIndex,
        rowData,
        hasExpandedDocs: this.expandedDocuments.size > 0,
        totalExpanded: this.expandedDocuments.size
      }
    };
  }

  /**
   * Get current transient state
   */
  getTransientState(): Record<string, any> {
    return {
      expandedDocuments: Array.from(this.expandedDocuments.entries()).map(([id, context]) => ({
        documentId: id,
        documentData: context.documentData,
        expandedAt: context.expandedAt,
        interactionCount: context.interactionCount,
        fieldSelections: context.fieldSelections
      })),
      selectedFields: Object.fromEntries(this.selectedFields),
      interactionSummary: {
        totalExpanded: this.expandedDocuments.size,
        totalFieldFilters: this.selectedFields.size,
        hasMultipleExpanded: this.expandedDocuments.size > 1,
        lastInteraction: this.lastInteractionTime,
        totalInteractions: this.interactionCount,
        recentActivity: Date.now() - this.lastInteractionTime < 30000
      }
    };
  }

  /**
   * Update transient state based on UI actions
   */
  updateTransientState(trigger: string, data: any): void {
    // This is called automatically by captureDynamicContext
    // but can be used for additional state management if needed
    this.lastInteractionTime = Date.now();
  }

  /**
   * Clear all transient state
   */
  clearTransientState(): void {
    console.log('🧹 Explore: Clearing transient state');
    this.expandedDocuments.clear();
    this.selectedFields.clear();
    this.lastInteractionTime = Date.now();
    this.interactionCount = 0;
  }

  /**
   * Get metadata about current state complexity
   */
  getStateMetadata(): {
    hasTransientState: boolean;
    stateComplexity: 'simple' | 'moderate' | 'complex';
    lastInteraction: number;
    customProperties: Record<string, any>;
  } {
    const hasTransientState = this.expandedDocuments.size > 0 || this.selectedFields.size > 0;
    
    let stateComplexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (this.expandedDocuments.size > 0 || this.selectedFields.size > 0) {
      stateComplexity = 'moderate';
    }
    if (this.expandedDocuments.size > 3 || this.selectedFields.size > 5) {
      stateComplexity = 'complex';
    }
    
    return {
      hasTransientState,
      stateComplexity,
      lastInteraction: this.lastInteractionTime,
      customProperties: {
        capturePattern: this.capturePattern,
        expandedDocumentCount: this.expandedDocuments.size,
        selectedFieldCount: this.selectedFields.size,
        totalInteractions: this.interactionCount,
        isActiveSession: Date.now() - this.lastInteractionTime < 300000 // 5 minutes
      }
    };
  }

  /**
   * Get available actions this contributor can execute
   */
  getAvailableActions(): string[] {
    return [
      'EXPAND_DOCUMENT',
      'COLLAPSE_DOCUMENT',
      'COLLAPSE_ALL_DOCUMENTS',
      'ADD_FIELD_FILTER',
      'REMOVE_FIELD_FILTER',
      'CLEAR_ALL_FILTERS',
      'REFRESH_EXPLORE_DATA'
    ];
  }

  /**
   * Execute actions specific to Explore
   */
  async executeAction(actionType: string, params: any): Promise<any> {
    console.log(`🎯 Explore: Executing action ${actionType}`, params);
    
    switch (actionType) {
      case 'EXPAND_DOCUMENT':
        return this.expandDocument(params);
      case 'COLLAPSE_DOCUMENT':
        return this.collapseDocument(params);
      case 'COLLAPSE_ALL_DOCUMENTS':
        return this.collapseAllDocuments();
      case 'ADD_FIELD_FILTER':
        return this.addFieldFilter(params);
      case 'REMOVE_FIELD_FILTER':
        return this.removeFieldFilter(params);
      case 'CLEAR_ALL_FILTERS':
        return this.clearAllFilters();
      case 'REFRESH_EXPLORE_DATA':
        return this.refreshExploreData();
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Programmatically expand a document
   */
  private async expandDocument(params: any): Promise<any> {
    const documentId = params.documentId;
    if (!documentId) {
      throw new Error('Document ID required for expansion');
    }
    
    // Simulate document expansion
    this.handleDocumentExpand({
      documentId,
      documentData: params.documentData || {},
      source: 'programmatic'
    });
    
    return {
      success: true,
      action: 'EXPAND_DOCUMENT',
      documentId,
      totalExpanded: this.expandedDocuments.size
    };
  }

  /**
   * Programmatically collapse a document
   */
  private async collapseDocument(params: any): Promise<any> {
    const documentId = params.documentId;
    if (!documentId) {
      throw new Error('Document ID required for collapse');
    }
    
    this.handleDocumentCollapse({ documentId, source: 'programmatic' });
    
    return {
      success: true,
      action: 'COLLAPSE_DOCUMENT',
      documentId,
      totalExpanded: this.expandedDocuments.size
    };
  }

  /**
   * Collapse all expanded documents
   */
  private async collapseAllDocuments(): Promise<any> {
    const collapsedCount = this.expandedDocuments.size;
    this.expandedDocuments.clear();
    
    console.log(`📄 All documents collapsed (${collapsedCount} documents)`);
    
    return {
      success: true,
      action: 'COLLAPSE_ALL_DOCUMENTS',
      collapsedCount,
      totalExpanded: 0
    };
  }

  /**
   * Add a field filter
   */
  private async addFieldFilter(params: any): Promise<any> {
    if (!params.fieldName || !params.filterValue) {
      throw new Error('Field name and filter value required');
    }
    
    this.handleFieldFilterAdd({
      fieldName: params.fieldName,
      filterValue: params.filterValue,
      source: 'programmatic'
    });
    
    return {
      success: true,
      action: 'ADD_FIELD_FILTER',
      fieldName: params.fieldName,
      filterValue: params.filterValue,
      totalFilters: this.selectedFields.size
    };
  }

  /**
   * Remove a field filter
   */
  private async removeFieldFilter(params: any): Promise<any> {
    if (!params.fieldName) {
      throw new Error('Field name required for filter removal');
    }
    
    this.handleFieldFilterRemove({
      fieldName: params.fieldName,
      source: 'programmatic'
    });
    
    return {
      success: true,
      action: 'REMOVE_FIELD_FILTER',
      fieldName: params.fieldName,
      totalFilters: this.selectedFields.size
    };
  }

  /**
   * Clear all field filters
   */
  private async clearAllFilters(): Promise<any> {
    const clearedCount = this.selectedFields.size;
    this.selectedFields.clear();
    
    console.log(`🧹 All field filters cleared (${clearedCount} filters)`);
    
    return {
      success: true,
      action: 'CLEAR_ALL_FILTERS',
      clearedCount,
      totalFilters: 0
    };
  }

  /**
   * Refresh Explore data
   */
  private async refreshExploreData(): Promise<any> {
    console.log('🔄 Refreshing Explore data');
    
    // In a real implementation, this would trigger data refresh
    // For now, we'll just update the interaction timestamp
    this.lastInteractionTime = Date.now();
    
    return {
      success: true,
      action: 'REFRESH_EXPLORE_DATA',
      timestamp: this.lastInteractionTime
    };
  }

  /**
   * Cleanup when contributor is unregistered
   */
  cleanup(): void {
    console.log('🧹 Explore Context Contributor cleanup');
    this.clearTransientState();
  }
}