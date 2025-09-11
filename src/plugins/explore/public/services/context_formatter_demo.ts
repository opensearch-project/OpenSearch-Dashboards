/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Demo of Explore Context Formatter
 *
 * This file demonstrates how the context formatter transforms raw URL-based
 * context data into structured, LLM-friendly format
 */

import { formatExploreContext } from './context_formatter';

// Example raw context data from the user's problem description
const exampleRawContext = {
  appId: 'explore/logs',
  timestamp: 1757568833603,
  data: {
    appId: 'explore/logs',
    url:
      "http://localhost:5601/w/LIRzvY/app/explore/logs/#/?_q=(dataset:(dataSource:(id:b6959920-7f1a-11f0-9eda-7d8a3aada760,title:test,type:OpenSearch),id:LIRzvY_b6959920-7f1a-11f0-9eda-7d8a3aada760_d3d7af60-4c81-11e8-b3d7-01146121b73d,timeFieldName:timestamp,title:opensearch_dashboards_sample_data_flights,type:INDEX_PATTERN),language:PPL,query:'')&_a=(legacy:(columns:!(_source),interval:auto,isDirty:!f,sort:!()),tab:(logs:(),patterns:(patternsField:'',usingRegexPatterns:!f)),ui:(activeTabId:logs,showHistogram:!t))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15w,to:now))&_v=(axesMapping:(value:'count()'),chartType:metric,styleOptions:(colorSchema:blues,customRanges:!((max:100,min:0)),fontSize:60,showTitle:!t,title:'',useColor:!f))",
    pathname: '/w/LIRzvY/app/explore/logs/',
    search: '',
    type: 'explore',
    capturePattern: 'hybrid',
    indexPattern: 'unknown',
    query: {
      query: '',
      language: 'kuery',
    },
    filters: [],
    columns: ['_source'],
    sort: [],
    timeRange: {
      from: 'now-15m',
      to: 'now',
    },
    expandedDocuments: [],
    selectedFields: {},
    interactionSummary: {
      totalExpanded: 0,
      totalFieldFilters: 0,
      hasMultipleExpanded: false,
      lastInteraction: 1757568833563,
      totalInteractions: 0,
      recentActivity: true,
    },
    metadata: {
      hasTransientState: false,
      stateComplexity: 'simple',
      lastInteraction: 1757568833563,
      customProperties: {
        capturePattern: 'hybrid',
        expandedDocumentCount: 0,
        selectedFieldCount: 0,
        totalInteractions: 0,
        isActiveSession: true,
      },
    },
    dataContext: {
      timeRange: {
        from: 'now-15m',
        to: 'now',
      },
      filters: [],
      query: {
        query: '',
        language: 'kuery',
      },
    },
  },
};

/**
 * Demo function to show the formatter in action
 */
export function demonstrateContextFormatter(): void {
  console.log('🔍 Explore Context Formatter Demo');
  console.log('=====================================\n');

  console.log('📥 Raw Context Input:');
  console.log(JSON.stringify(exampleRawContext, null, 2));
  console.log('\n' + '='.repeat(50) + '\n');

  console.log('📤 Formatted Context Output:');
  const formattedContext = formatExploreContext(exampleRawContext);
  console.log(formattedContext);

  console.log('\n' + '='.repeat(50) + '\n');
  console.log('✅ Demo completed! The LLM can now understand:');
  console.log('- Dataset: opensearch_dashboards_sample_data_flights');
  console.log('- Visualization: metric chart');
  console.log('- Query Language: PPL');
  console.log('- Current Query: (empty - needs to be created)');
  console.log('- Time Range: Last 15 weeks');
  console.log(
    '- Recommended Query: source = opensearch_dashboards_sample_data_flights | stats count()'
  );
}

/**
 * Expected output format for the user's question:
 * "Can you help me create a query that can show metric chart in explore using current data?"
 *
 * The LLM should now respond with:
 * "Based on your current context, you're working with the opensearch_dashboards_sample_data_flights dataset
 * and want to create a metric visualization. Here's the PPL query you need:
 *
 * source = opensearch_dashboards_sample_data_flights | stats count()
 *
 * This will:
 * 1. Use your current dataset (flights sample data)
 * 2. Count all records using the stats function
 * 3. Display as a metric chart (which you already have configured)
 * 4. Work with your current time range (last 15 weeks)"
 */

// Export the demo for testing
export { exampleRawContext };
