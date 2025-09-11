/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

e;

/**
 * Test file for Context Formatter with real URL data
 */

import { ExploreContextFormatter } from './context_formatter';

// Test with the actual URL from user
const testURL =
  "http://localhost:5601/w/LIRzvY/app/explore/logs/#/?_q=(dataset:(dataSource:(id:b6959920-7f1a-11f0-9eda-7d8a3aada760,title:test,type:OpenSearch),id:LIRzvY_b6959920-7f1a-11f0-9eda-7d8a3aada760_90943e30-9a47-11e8-b64d-95841ca0b247,timeFieldName:timestamp,title:opensearch_dashboards_sample_data_logs,type:INDEX_PATTERN),language:PPL,query:'source%20%3D%20opensearch_dashboards_sample_data_logs%20%7C%20stats%20count()%20')&_a=(legacy:(columns:!(_source),interval:auto,isDirty:!f,sort:!()),tab:(logs:(),patterns:(usingRegexPatterns:!f)),ui:(activeTabId:explore_visualization_tab,showHistogram:!t))&_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now-15d,to:now))&_v=(axesMapping:(value:'count()'),chartType:metric,styleOptions:(colorSchema:blues,customRanges:!((max:100,min:0)),fontSize:60,showTitle:!t,title:'',useColor:!f))";

const mockContext = {
  data: {
    url: testURL,
    appId: 'explore',
  },
};

console.log('🧪 Testing Context Formatter with real URL...');
console.log('URL:', testURL);
console.log('\n📋 Formatted Context:');

try {
  const formatted = ExploreContextFormatter.formatContext(mockContext);
  console.log(formatted);
} catch (error) {
  console.error('❌ Error formatting context:', error);
}

// Export for use in other files
export { testURL, mockContext };
