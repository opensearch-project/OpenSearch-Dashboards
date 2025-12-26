/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ecommerceSpecProvider } from './index';
import { ubiEventsFieldMappings, ubiQueriesFieldMappings } from './field_mappings';

describe('ecommerce sample data UBI functionality', () => {
  const ecommerceSpec = ecommerceSpecProvider();

  describe('UBI data indices', () => {
    it('should include ubi_events data index with correct configuration', () => {
      const ubiEventsIndex = ecommerceSpec.dataIndices.find((index) => index.id === 'ubi_events');

      expect(ubiEventsIndex).toBeDefined();
      expect(ubiEventsIndex?.fields).toBe(ubiEventsFieldMappings);
      expect(ubiEventsIndex?.indexName).toBe('opensearch_dashboards_sample_ubi_events');
      expect(ubiEventsIndex?.timeFields).toEqual([]);
      expect(ubiEventsIndex?.preserveDayOfWeekTimeOfDay).toBe(false);
    });

    it('should include ubi_queries data index with correct configuration', () => {
      const ubiQueriesIndex = ecommerceSpec.dataIndices.find((index) => index.id === 'ubi_queries');

      expect(ubiQueriesIndex).toBeDefined();
      expect(ubiQueriesIndex?.fields).toBe(ubiQueriesFieldMappings);
      expect(ubiQueriesIndex?.indexName).toBe('opensearch_dashboards_sample_ubi_queries');
      expect(ubiQueriesIndex?.timeFields).toEqual([]);
      expect(ubiQueriesIndex?.preserveDayOfWeekTimeOfDay).toBe(false);
    });

    it('should have correct data paths for UBI indices', () => {
      const ubiEventsIndex = ecommerceSpec.dataIndices.find((index) => index.id === 'ubi_events');
      const ubiQueriesIndex = ecommerceSpec.dataIndices.find((index) => index.id === 'ubi_queries');

      expect(ubiEventsIndex?.dataPath).toContain('ubi_events.json.gz');
      expect(ubiQueriesIndex?.dataPath).toContain('ubi_queries.json.gz');
    });
  });

  describe('UBI saved objects integration', () => {
    it('should process UBI index patterns with data source integration', () => {
      const savedObjects = ecommerceSpec.getDataSourceIntegratedSavedObjects(
        'test-datasource',
        'TestDS'
      );

      const ubiQueriesPattern = savedObjects.find(
        (obj) => obj.id === 'test-datasource_ubi-queries-index-pattern'
      );
      const ubiEventsPattern = savedObjects.find(
        (obj) => obj.id === 'test-datasource_ubi-events-index-pattern'
      );

      expect(ubiQueriesPattern).toBeDefined();
      expect(ubiEventsPattern).toBeDefined();
      expect(ubiQueriesPattern?.type).toBe('index-pattern');
      expect(ubiEventsPattern?.type).toBe('index-pattern');
    });

    it('should process UBI visualizations with workspace integration', () => {
      const savedObjects = ecommerceSpec.getWorkspaceIntegratedSavedObjects('test-workspace');

      const ubiVisualization = savedObjects.find(
        (obj) => obj.id.includes('workspace') && obj.type === 'visualization'
      );
      expect(ubiVisualization?.id).toContain('test-workspace_');
    });
  });
});
