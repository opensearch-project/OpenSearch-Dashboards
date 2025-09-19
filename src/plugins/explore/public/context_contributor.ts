/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
  DocumentExpansionContext,
  GlobalInteraction,
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
    'TABLE_ROW_SELECT',
  ];

  // Transient state management (not in URL)
  private expandedDocuments = new Map<string, DocumentExpansionContext>();
  private selectedFields = new Map<string, any>();
  private lastInteractionTime = Date.now();
  private interactionCount = 0;

  constructor(private savedObjects: SavedObjectsClientContract) {}

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
    console.log('🔥 DEBUG: Current expandedDocuments size:', this.expandedDocuments.size);
    console.log(
      '🔥 DEBUG: expandedDocuments Map contents:',
      Array.from(this.expandedDocuments.entries())
    );

    try {
      // 1. Parse URL-based context
      const urlContext = this.parseUrlState();

      // 2. Get transient state
      const transientState = this.getTransientState();
      console.log('🔥 DEBUG: transientState keys:', Object.keys(transientState));
      console.log('🔥 DEBUG: transientState.expandedDocuments:', transientState.expandedDocuments);
      console.log('🔥 DEBUG: transientState.userActivity:', transientState.userActivity);

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

        // Transient state (not in URL) - Enhanced with direct access
        expandedDocuments: transientState.expandedDocuments,
        selectedFields: transientState.selectedFields,
        interactionSummary: transientState.interactionSummary,
        userActivity: transientState.userActivity, // 🔧 FIX: Add userActivity to context

        // Context metadata
        metadata: {
          ...stateMetadata,
          urlKeys: Object.keys(urlContext),
          transientKeys: Object.keys(transientState),
        },

        timestamp: Date.now(),
      };

      // Set the index pattern globally for MCP tools to access
      if (context.indexPattern && context.indexPattern !== 'unknown') {
        (global as any).staticContext = {
          ...(global as any).staticContext,
          indexPattern: context.indexPattern,
        };
        console.log('🔧 DEBUG: Set global static context with indexPattern:', context.indexPattern);
      }

      console.log('� DEBUG: Final context keys:', Object.keys(context));
      console.log('🔥 DEBUG: Final context.expandedDocuments:', context.expandedDocuments);
      console.log('🔥 DEBUG: Final context.userActivity:', context.userActivity);
      console.log('🔥 DEBUG: Final context.indexPattern:', context.indexPattern);
      console.log(
        `✅ Explore: Context captured with ${this.expandedDocuments.size} expanded documents`
      );
      return context;
    } catch (error) {
      console.error('❌ Explore: Error capturing context:', error);
      return {
        type: 'explore',
        error: error.message,
        timestamp: Date.now(),
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
          appId: this.appId,
        },
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

    // Also parse _q (query state) which contains dataset information
    const queryState = this.parseStateParam(urlParams.get('_q'));

    console.log('🔍 DEBUG: URL parsing results:', {
      appState,
      globalState,
      queryState,
      url: window.location.href,
    });

    // Extract index pattern from multiple possible sources
    let indexPattern = 'unknown';

    // Try to get from query state dataset (most reliable for Explore)
    if (queryState?.dataset?.title) {
      indexPattern = queryState.dataset.title;
      console.log('🔍 DEBUG: Found index pattern from queryState.dataset.title:', indexPattern);
    } else if (queryState?.dataset?.id) {
      // Extract from dataset ID if title not available
      const datasetId = queryState.dataset.id;
      // Dataset ID format: "3mN8Jy_d2303840-7f1d-11f0-9eda-7d8a3aada760_90943e30-9a47-11e8-b64d-95841ca0b247"
      // Extract the meaningful part after the workspace ID
      const parts = datasetId.split('_');
      if (parts.length > 2) {
        // Try to find a meaningful index name in the parts
        for (let i = parts.length - 1; i >= 0; i--) {
          if (
            parts[i].includes('sample') ||
            parts[i].includes('logs') ||
            parts[i].includes('data')
          ) {
            indexPattern = parts[i];
            break;
          }
        }
      }
      console.log('🔍 DEBUG: Extracted index pattern from dataset ID:', indexPattern);
    } else if (appState?.index) {
      indexPattern = appState.index;
      console.log('🔍 DEBUG: Found index pattern from appState.index:', indexPattern);
    }

    // If still unknown, try to extract from URL path or hash
    if (indexPattern === 'unknown') {
      const urlMatch = window.location.href.match(/title:([^,&)]+)/);
      if (urlMatch) {
        indexPattern = decodeURIComponent(urlMatch[1]);
        console.log('🔍 DEBUG: Extracted index pattern from URL match:', indexPattern);
      }
    }

    console.log('🔍 DEBUG: Final index pattern:', indexPattern);

    return {
      indexPattern,
      query: queryState?.query || appState?.query || { query: '', language: 'kuery' },
      filters: globalState?.filters || [],
      columns: appState?.columns || ['_source'],
      sort: appState?.sort || [],
      timeRange: globalState?.time || { from: 'now-15m', to: 'now' },
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash,
      // Include raw parsed states for debugging
      rawStates: {
        appState,
        globalState,
        queryState,
      },
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
    console.log(`🔍 DEBUG: Current expanded documents count: ${this.expandedDocuments.size}`);
    console.log(`🔍 DEBUG: Interaction count: ${this.interactionCount}`);

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
          message: `Unhandled trigger: ${trigger}`,
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
      fieldSelections: [],
    };

    this.expandedDocuments.set(documentId, expansionContext);

    console.log(`📄 Document expanded: ${documentId} (Total: ${this.expandedDocuments.size})`);
    console.log(`🔍 DEBUG: Document data keys:`, Object.keys(expansionContext.documentData));
    console.log(
      `🔍 DEBUG: Document data sample:`,
      JSON.stringify(expansionContext.documentData, null, 2).substring(0, 500)
    );

    return {
      type: 'explore_dynamic',
      trigger: 'DOCUMENT_EXPAND',
      timestamp: Date.now(),
      data: {
        documentId,
        documentData: expansionContext.documentData,
        totalExpanded: this.expandedDocuments.size,
        isMultipleExpanded: this.expandedDocuments.size > 1,
      },
    };
  }

  /**
   * Handle document collapse
   */
  private handleDocumentCollapse(data: any): Record<string, any> {
    const documentId = data.documentId || data.rowId;

    if (documentId && this.expandedDocuments.has(documentId)) {
      this.expandedDocuments.delete(documentId);
      console.log(
        `📄 Document collapsed: ${documentId} (Remaining: ${this.expandedDocuments.size})`
      );
    }

    return {
      type: 'explore_dynamic',
      trigger: 'DOCUMENT_COLLAPSE',
      timestamp: Date.now(),
      data: {
        documentId,
        totalExpanded: this.expandedDocuments.size,
        remainingDocuments: Array.from(this.expandedDocuments.keys()),
      },
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
        interactionCount: this.interactionCount,
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
        allFilters: Object.fromEntries(this.selectedFields),
      },
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
        remainingFilters: Object.fromEntries(this.selectedFields),
      },
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
        totalExpanded: this.expandedDocuments.size,
      },
    };
  }

  /**
   * Get current transient state with enhanced document preview
   */
  getTransientState(): Record<string, any> {
    console.log(
      '🔥 DEBUG: getTransientState called, expandedDocuments.size:',
      this.expandedDocuments.size
    );

    const documentPreview = this.getDocumentPreview();
    console.log('🔥 DEBUG: documentPreview result:', documentPreview);
    console.log(
      '🔥 DEBUG: documentPreview.expandedDocuments length:',
      documentPreview.expandedDocuments?.length || 0
    );

    const transientState = {
      // Enhanced document information with LLM-friendly format
      expandedDocuments: documentPreview.expandedDocuments,

      // Field filter information
      selectedFields: Object.fromEntries(this.selectedFields),

      // Interaction summary with context
      interactionSummary: {
        totalExpanded: this.expandedDocuments.size,
        totalFieldFilters: this.selectedFields.size,
        hasMultipleExpanded: this.expandedDocuments.size > 1,
        lastInteraction: this.lastInteractionTime,
        totalInteractions: this.interactionCount,
        recentActivity: Date.now() - this.lastInteractionTime < 30000,
      },

      // User activity context for LLM
      userActivity: {
        currentFocus: documentPreview.hasCurrentExpansions
          ? `User is examining ${documentPreview.totalExpanded} expanded document(s)`
          : 'No documents currently expanded',
        lastAction: new Date(this.lastInteractionTime).toISOString(),
        contextNote: documentPreview.contextNote,
        recentDocuments: documentPreview.expandedDocuments.slice(-3), // Last 3 for context
      },
    };

    console.log('🔥 DEBUG: Final transientState keys:', Object.keys(transientState));
    console.log(
      '🔥 DEBUG: Final transientState.expandedDocuments:',
      transientState.expandedDocuments
    );

    return transientState;
  }

  /**
   * Get document preview for LLM consumption
   * Provides structured summary of expanded documents with trigger context
   */
  getDocumentPreview(): Record<string, any> {
    console.log(
      '🔥 DEBUG: getDocumentPreview called, expandedDocuments.size:',
      this.expandedDocuments.size
    );
    console.log(
      '🔥 DEBUG: expandedDocuments entries:',
      Array.from(this.expandedDocuments.entries())
    );

    const expandedDocs = Array.from(this.expandedDocuments.entries()).map(([id, context]) => {
      console.log('🔥 DEBUG: Processing document:', id);
      console.log('🔥 DEBUG: Document context:', context);

      // Extract meaningful fields from document data
      const docData = context.documentData || {};
      console.log('🔥 DEBUG: docData keys:', Object.keys(docData));
      console.log('🔥 DEBUG: docData.docTableField exists:', !!docData.docTableField);
      console.log('🔥 DEBUG: docData.docTableField value:', docData.docTableField);

      const preview: Record<string, any> = {
        documentId: id,
        expandedAt: new Date(context.expandedAt).toISOString(),
        triggerType: 'DOCUMENT_EXPAND',
        triggerComment: 'User expanded this document to view detailed content',
      };

      // 🔧 FIX: Handle docTableField format from Explore plugin
      if (docData.docTableField) {
        console.log('🔥 DEBUG: Found docTableField, parsing...');
        // Parse the docTableField string which contains formatted log data
        const docTableField = docData.docTableField;
        preview.rawDocumentContent = docTableField;

        // Extract key-value pairs from the formatted string
        const extractedFields = this.parseDocTableField(docTableField);
        Object.assign(preview, extractedFields);

        console.log('🔍 DEBUG: Parsed docTableField result:', extractedFields);
        console.log('🔥 DEBUG: Final preview after docTableField parsing:', preview);
      } else if (docData._source) {
        console.log('🔥 DEBUG: Using _source format');
        // Handle standard _source format
        const source = docData._source;

        // Common log fields
        if (source.message) preview.message = source.message;
        if (source.timestamp) preview.timestamp = source.timestamp;
        if (source.level || source.severity) preview.level = source.level || source.severity;
        if (source.host) preview.host = source.host;
        if (source.url) preview.url = source.url;
        if (source.referer) preview.referer = source.referer;
        if (source.request) preview.request = source.request;
        if (source.response) preview.response = source.response;
        if (source.bytes) preview.bytes = source.bytes;
        if (source.clientip) preview.clientip = source.clientip;

        // Add any other significant fields (limit to prevent overwhelming LLM)
        const otherFields = Object.keys(source)
          .filter(
            (key) =>
              ![
                'message',
                'timestamp',
                'level',
                'severity',
                'host',
                'url',
                'referer',
                'request',
                'response',
                'bytes',
                'clientip',
              ].includes(key)
          )
          .slice(0, 5); // Limit to 5 additional fields

        if (otherFields.length > 0) {
          preview.additionalFields = {};
          otherFields.forEach((field) => {
            preview.additionalFields[field] = source[field];
          });
        }
      } else {
        // Fallback: use raw document data
        const significantFields = Object.keys(docData)
          .filter(
            (key) => !key.startsWith('_') && docData[key] !== null && docData[key] !== undefined
          )
          .slice(0, 8); // Limit fields for readability

        significantFields.forEach((field) => {
          preview[field] = docData[field];
        });
      }

      return preview;
    });

    return {
      expandedDocuments: expandedDocs,
      totalExpanded: this.expandedDocuments.size,
      hasCurrentExpansions: this.expandedDocuments.size > 0,
      lastInteraction: new Date(this.lastInteractionTime).toISOString(),
      contextNote:
        'These are documents the user has expanded to examine in detail. This represents their current focus and investigation area.',
    };
  }

  /**
   * Parse docTableField string to extract key-value pairs
   * Format: "referer:http://twitter.com/success/wendy-lawrence request:/opensearch/opensearch-1.0.0.deb agent:Mozilla/5.0..."
   */
  private parseDocTableField(docTableField: string): Record<string, any> {
    console.log('🔥 DEBUG: parseDocTableField called with:', docTableField);
    const fields: Record<string, any> = {};

    try {
      // Split by spaces but handle URLs and complex values
      const parts = docTableField.split(' ');
      console.log('🔥 DEBUG: Split into parts:', parts.length, 'parts');

      let currentKey = '';
      let currentValue = '';

      for (const part of parts) {
        if (part.includes(':') && !part.startsWith('http') && !part.startsWith('https')) {
          // Save previous key-value pair if exists
          if (currentKey && currentValue) {
            fields[currentKey] = currentValue.trim();
            console.log('🔥 DEBUG: Added field:', currentKey, '=', currentValue.trim());
          }

          // Start new key-value pair
          const colonIndex = part.indexOf(':');
          currentKey = part.substring(0, colonIndex);
          currentValue = part.substring(colonIndex + 1);
          console.log('🔥 DEBUG: New key-value pair started:', currentKey, ':', currentValue);
        } else {
          // Continue building current value
          if (currentValue) {
            currentValue += ' ' + part;
          } else {
            currentValue = part;
          }
        }
      }

      // Save the last key-value pair
      if (currentKey && currentValue) {
        fields[currentKey] = currentValue.trim();
        console.log('🔥 DEBUG: Added final field:', currentKey, '=', currentValue.trim());
      }

      console.log('🔥 DEBUG: Extracted fields before cleanup:', fields);

      // Clean up and format specific fields
      if (fields.message) {
        // Extract IP and HTTP request from message if present
        const messageMatch = fields.message.match(/^(\d+\.\d+\.\d+\.\d+).*?"([^"]+)"/);
        if (messageMatch) {
          fields.clientip = messageMatch[1];
          fields.httpRequest = messageMatch[2];
          console.log(
            '🔥 DEBUG: Extracted from message - clientip:',
            fields.clientip,
            'httpRequest:',
            fields.httpRequest
          );
        }
      }

      // Convert numeric fields
      if (fields.bytes) fields.bytes = parseInt(fields.bytes.replace(/,/g, '')) || fields.bytes;
      if (fields.response) fields.response = parseInt(fields.response) || fields.response;

      console.log('🔥 DEBUG: Final parsed fields:', fields);
    } catch (error) {
      console.warn('Error parsing docTableField:', error);
      // Fallback: just include the raw content
      fields.rawContent = docTableField;
    }

    return fields;
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
        isActiveSession: Date.now() - this.lastInteractionTime < 300000, // 5 minutes
      },
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
      'REFRESH_EXPLORE_DATA',
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
      source: 'programmatic',
    });

    return {
      success: true,
      action: 'EXPAND_DOCUMENT',
      documentId,
      totalExpanded: this.expandedDocuments.size,
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
      totalExpanded: this.expandedDocuments.size,
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
      totalExpanded: 0,
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
      source: 'programmatic',
    });

    return {
      success: true,
      action: 'ADD_FIELD_FILTER',
      fieldName: params.fieldName,
      filterValue: params.filterValue,
      totalFilters: this.selectedFields.size,
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
      source: 'programmatic',
    });

    return {
      success: true,
      action: 'REMOVE_FIELD_FILTER',
      fieldName: params.fieldName,
      totalFilters: this.selectedFields.size,
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
      totalFilters: 0,
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
      timestamp: this.lastInteractionTime,
    };
  }

  /**
   * Cleanup when contributor is unregistered
   */
  /**
   * Handle global interactions routed from Global Interaction Interceptor
   */
  handleGlobalInteraction(interaction: GlobalInteraction): void {
    console.log('🔍 Explore handling global interaction:', interaction);
    console.log('🔍 Interaction type:', interaction.interactionType);
    console.log('🔍 Test subject:', interaction.testSubj);

    switch (interaction.interactionType) {
      case 'DOCUMENT_EXPAND':
        this.handleDocumentExpand({
          documentId: interaction.documentId || `doc_${Date.now()}`,
          documentData: interaction.documentData || {},
          source: 'global_capture',
        });
        break;

      case 'FILTER_ACTION':
        this.handleFieldFilterAdd({
          fieldName: interaction.fieldName || 'unknown_field',
          filterValue: interaction.filterValue || 'unknown_value',
          source: 'global_capture',
        });
        break;

      case 'BUTTON_CLICK':
        // Handle generic button clicks
        console.log('🔘 Button clicked:', interaction.buttonText);
        this.updateTransientState('BUTTON_INTERACTION', {
          buttonText: interaction.buttonText,
          testSubj: interaction.testSubj,
          timestamp: interaction.timestamp,
        });
        break;

      case 'NAVIGATION_CLICK':
        // Handle navigation clicks
        console.log('🧭 Navigation clicked:', interaction.linkText);
        this.updateTransientState('NAVIGATION_INTERACTION', {
          linkText: interaction.linkText,
          href: interaction.href,
          testSubj: interaction.testSubj,
          timestamp: interaction.timestamp,
        });
        break;

      default:
        // Store generic interaction with test subject
        console.log('📝 Generic interaction captured:', interaction.testSubj);
        this.updateTransientState('GENERIC_INTERACTION', {
          type: interaction.type,
          testSubj: interaction.testSubj,
          className: interaction.className,
          tagName: interaction.tagName,
          text: interaction.text,
          timestamp: interaction.timestamp,
        });
    }
  }

  cleanup(): void {
    console.log('🧹 Explore Context Contributor cleanup');
    this.clearTransientState();
  }
}
