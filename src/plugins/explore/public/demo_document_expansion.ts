/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

/**
 * Demo script showing how to trigger document expansion context capture
 * This demonstrates the hybrid context capture pattern for the Explore plugin
 */

/**
 * Simulate document expansion by triggering the appropriate UI action
 */
export function simulateDocumentExpansion(documentId: string, documentData: any) {
  console.log('🧪 Demo: Simulating document expansion for:', documentId);
  
  // Get the context provider
  const contextProvider = (window as any).contextProvider;
  if (!contextProvider) {
    console.error('❌ Context Provider not available');
    return;
  }
  
  // Trigger the DOCUMENT_EXPAND action
  const expansionData = {
    documentId,
    documentData,
    source: 'demo_simulation',
    timestamp: Date.now()
  };
  
  // This will be routed to the ExploreContextContributor
  contextProvider.captureDynamicContext?.('DOCUMENT_EXPAND', expansionData);
  
  console.log('✅ Document expansion triggered');
}

/**
 * Simulate document collapse
 */
export function simulateDocumentCollapse(documentId: string) {
  console.log('🧪 Demo: Simulating document collapse for:', documentId);
  
  const contextProvider = (window as any).contextProvider;
  if (!contextProvider) {
    console.error('❌ Context Provider not available');
    return;
  }
  
  const collapseData = {
    documentId,
    source: 'demo_simulation',
    timestamp: Date.now()
  };
  
  contextProvider.captureDynamicContext?.('DOCUMENT_COLLAPSE', collapseData);
  
  console.log('✅ Document collapse triggered');
}

/**
 * Simulate multiple document expansions to test the "multiple expanded documents" scenario
 */
export function simulateMultipleDocumentExpansions() {
  console.log('🧪 Demo: Simulating multiple document expansions');
  
  const sampleDocuments = [
    {
      id: 'doc_001',
      data: {
        '@timestamp': '2024-01-15T10:30:00Z',
        'host.name': 'web-server-01',
        'response.keyword': '200',
        'bytes': 1024,
        'url.keyword': '/api/products'
      }
    },
    {
      id: 'doc_002', 
      data: {
        '@timestamp': '2024-01-15T10:31:00Z',
        'host.name': 'web-server-02',
        'response.keyword': '404',
        'bytes': 512,
        'url.keyword': '/api/users'
      }
    },
    {
      id: 'doc_003',
      data: {
        '@timestamp': '2024-01-15T10:32:00Z',
        'host.name': 'web-server-01',
        'response.keyword': '500',
        'bytes': 256,
        'url.keyword': '/api/orders'
      }
    }
  ];
  
  // Expand documents with delays to simulate user interaction
  sampleDocuments.forEach((doc, index) => {
    setTimeout(() => {
      simulateDocumentExpansion(doc.id, doc.data);
    }, index * 1000); // 1 second delay between expansions
  });
  
  // After 5 seconds, collapse the first document
  setTimeout(() => {
    simulateDocumentCollapse('doc_001');
  }, 5000);
  
  console.log('✅ Multiple document expansion simulation started');
}

/**
 * Simulate field filter actions
 */
export function simulateFieldFilter(fieldName: string, filterValue: any, action: 'add' | 'remove' = 'add') {
  console.log(`🧪 Demo: Simulating field filter ${action} for:`, fieldName, '=', filterValue);
  
  const contextProvider = (window as any).contextProvider;
  if (!contextProvider) {
    console.error('❌ Context Provider not available');
    return;
  }
  
  const filterData = {
    fieldName,
    filterValue,
    source: 'demo_simulation',
    timestamp: Date.now()
  };
  
  const triggerAction = action === 'add' ? 'FIELD_FILTER_ADD' : 'FIELD_FILTER_REMOVE';
  contextProvider.captureDynamicContext?.(triggerAction, filterData);
  
  console.log(`✅ Field filter ${action} triggered`);
}

/**
 * Simulate table row selection
 */
export function simulateTableRowSelect(rowIndex: number, rowData: any) {
  console.log('🧪 Demo: Simulating table row selection for row:', rowIndex);
  
  const contextProvider = (window as any).contextProvider;
  if (!contextProvider) {
    console.error('❌ Context Provider not available');
    return;
  }
  
  const selectionData = {
    rowIndex,
    rowData,
    source: 'demo_simulation',
    timestamp: Date.now()
  };
  
  contextProvider.captureDynamicContext?.('TABLE_ROW_SELECT', selectionData);
  
  console.log('✅ Table row selection triggered');
}

/**
 * Complete demo scenario: User explores data with multiple interactions
 */
export function runCompleteExploreDemo() {
  console.log('🎬 Starting complete Explore context capture demo...');
  
  // Step 1: Select a table row
  setTimeout(() => {
    simulateTableRowSelect(0, {
      '@timestamp': '2024-01-15T10:30:00Z',
      'host.name': 'web-server-01',
      'response.keyword': '200'
    });
  }, 1000);
  
  // Step 2: Expand the document
  setTimeout(() => {
    simulateDocumentExpansion('doc_selected_001', {
      '@timestamp': '2024-01-15T10:30:00Z',
      'host.name': 'web-server-01',
      'response.keyword': '200',
      'bytes': 1024,
      'url.keyword': '/api/products',
      'user.name': 'john.doe',
      'source.ip': '192.168.1.100'
    });
  }, 2000);
  
  // Step 3: Add field filters based on the expanded document
  setTimeout(() => {
    simulateFieldFilter('host.name', 'web-server-01', 'add');
  }, 3000);
  
  setTimeout(() => {
    simulateFieldFilter('response.keyword', '200', 'add');
  }, 4000);
  
  // Step 4: Expand another document
  setTimeout(() => {
    simulateDocumentExpansion('doc_selected_002', {
      '@timestamp': '2024-01-15T10:31:00Z',
      'host.name': 'web-server-01',
      'response.keyword': '200',
      'bytes': 2048,
      'url.keyword': '/api/orders'
    });
  }, 5000);
  
  // Step 5: Check current context
  setTimeout(() => {
    console.log('📊 Getting current context after all interactions...');
    const contextProvider = (window as any).contextProvider;
    if (contextProvider) {
      contextProvider.getCurrentContext().then((context: any) => {
        console.log('🎯 Final context state:', context);
        console.log('📈 Context summary:', {
          expandedDocuments: context?.data?.expandedDocuments?.length || 0,
          selectedFields: Object.keys(context?.data?.selectedFields || {}).length,
          hasMultipleExpanded: context?.data?.interactionSummary?.hasMultipleExpanded,
          totalInteractions: context?.data?.interactionSummary?.totalInteractions
        });
      });
    }
  }, 6000);
  
  console.log('🎬 Demo scenario started - watch the console for context updates!');
}

/**
 * Test the programmatic actions available through the context contributor
 */
export function testProgrammaticActions() {
  console.log('🧪 Testing programmatic actions...');
  
  const exploreContributor = (window as any).exploreContextContributor;
  if (!exploreContributor) {
    console.error('❌ Explore Context Contributor not available');
    return;
  }
  
  // Test expanding a document programmatically
  exploreContributor.executeAction('EXPAND_DOCUMENT', {
    documentId: 'programmatic_doc_001',
    documentData: {
      '@timestamp': '2024-01-15T12:00:00Z',
      'message': 'Programmatically expanded document',
      'level': 'INFO'
    }
  }).then((result: any) => {
    console.log('✅ Programmatic document expansion result:', result);
  });
  
  // Test adding a field filter programmatically
  setTimeout(() => {
    exploreContributor.executeAction('ADD_FIELD_FILTER', {
      fieldName: 'level',
      filterValue: 'INFO'
    }).then((result: any) => {
      console.log('✅ Programmatic field filter result:', result);
    });
  }, 1000);
  
  // Test getting current state
  setTimeout(() => {
    const transientState = exploreContributor.getTransientState();
    console.log('📊 Current transient state:', transientState);
    
    const stateMetadata = exploreContributor.getStateMetadata();
    console.log('📈 State metadata:', stateMetadata);
  }, 2000);
}

/**
 * Debug function to check if everything is properly connected
 */
export function debugContextProvider() {
  console.log('🔍 DEBUG: Checking Context Provider setup...');
  
  const contextProvider = (window as any).contextProvider;
  const exploreContributor = (window as any).exploreContextContributor;
  
  console.log('📊 Context Provider available:', !!contextProvider);
  console.log('📊 Explore Contributor available:', !!exploreContributor);
  
  if (contextProvider) {
    console.log('📖 Context Provider methods:', Object.keys(contextProvider));
  }
  
  if (exploreContributor) {
    console.log('📖 Explore Contributor appId:', exploreContributor.appId);
    console.log('📖 Explore Contributor trigger actions:', exploreContributor.contextTriggerActions);
  }
  
  // Test getting current context
  if (contextProvider) {
    contextProvider.getCurrentContext().then((context: any) => {
      console.log('📊 Current context:', context);
    }).catch((error: any) => {
      console.error('❌ Error getting context:', error);
    });
  }
}

/**
 * Simple test to verify document expansion works
 */
export function testDocumentExpansion() {
  console.log('🧪 Testing document expansion...');
  
  const contextProvider = (window as any).contextProvider;
  if (!contextProvider) {
    console.error('❌ Context Provider not available');
    return;
  }
  
  // Simulate a document expansion
  const testData = {
    documentId: 'test_doc_001',
    documentData: {
      '@timestamp': '2024-01-15T10:30:00Z',
      'host.name': 'test-server',
      'response.keyword': '200',
      'message': 'Test log message'
    },
    source: 'manual_test',
    timestamp: Date.now()
  };
  
  console.log('📄 Triggering DOCUMENT_EXPAND with data:', testData);
  
  // This should route to our ExploreContextContributor
  contextProvider.captureDynamicContext('DOCUMENT_EXPAND', testData);
  
  // Wait a moment then check context
  setTimeout(() => {
    contextProvider.getCurrentContext().then((context: any) => {
      console.log('📊 Context after expansion:', context);
      console.log('📈 Expanded documents:', context?.data?.expandedDocuments?.length || 0);
    });
  }, 1000);
}

// Make functions globally available for browser console testing
(window as any).exploreDemo = {
  simulateDocumentExpansion,
  simulateDocumentCollapse,
  simulateMultipleDocumentExpansions,
  simulateFieldFilter,
  simulateTableRowSelect,
  runCompleteExploreDemo,
  testProgrammaticActions,
  debugContextProvider,
  testDocumentExpansion
};

console.log('🌐 Explore demo functions available at window.exploreDemo');
console.log('📖 Available demo functions:', Object.keys((window as any).exploreDemo || {}));
console.log('🔍 Run window.exploreDemo.debugContextProvider() to check setup');
console.log('🧪 Run window.exploreDemo.testDocumentExpansion() to test expansion');