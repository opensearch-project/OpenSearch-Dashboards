/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

import { SavedObjectSchemaRegistry } from './schema_registry';
import { loadSavedObjectSchemas } from './index';

describe('SavedObjectSchemaRegistry', () => {
  let registry: SavedObjectSchemaRegistry;

  beforeAll(() => {
    registry = new SavedObjectSchemaRegistry();
  });

  describe('loading schemas', () => {
    it('should load all schema definitions', () => {
      const schemas = registry.getAllSchemas();
      expect(schemas.length).toBeGreaterThanOrEqual(4);
    });

    it('should expose all expected types', () => {
      const types = registry.getTypes();
      expect(types).toContain('dashboard');
      expect(types).toContain('visualization');
      expect(types).toContain('index-pattern');
      expect(types).toContain('search');
    });

    it('should return versions for a known type', () => {
      const versions = registry.getVersions('dashboard');
      expect(versions).toContain('v1');
    });

    it('should return an empty array for an unknown type', () => {
      const versions = registry.getVersions('nonexistent-type');
      expect(versions).toEqual([]);
    });

    it('should return a schema object for a known type and version', () => {
      const schema = registry.getSchema('dashboard', 'v1');
      expect(schema).toBeDefined();
      expect(schema!.title).toBe('OpenSearch Dashboards Dashboard Saved Object v1');
    });

    it('should return undefined for an unknown schema', () => {
      expect(registry.getSchema('dashboard', 'v999')).toBeUndefined();
      expect(registry.getSchema('nonexistent', 'v1')).toBeUndefined();
    });
  });

  describe('loadSavedObjectSchemas', () => {
    it('should return schemas and a commonSchema', () => {
      const result = loadSavedObjectSchemas();
      expect(result.commonSchema).toBeDefined();
      expect(result.commonSchema.$defs).toBeDefined();
      expect(result.schemas.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('schema versioning', () => {
    it('should resolve dashboard/v1', () => {
      const schema = registry.getSchema('dashboard', 'v1');
      expect(schema).toBeDefined();
    });

    it('should resolve visualization/v1', () => {
      const schema = registry.getSchema('visualization', 'v1');
      expect(schema).toBeDefined();
    });

    it('should resolve index-pattern/v1', () => {
      const schema = registry.getSchema('index-pattern', 'v1');
      expect(schema).toBeDefined();
    });

    it('should resolve search/v1', () => {
      const schema = registry.getSchema('search', 'v1');
      expect(schema).toBeDefined();
    });
  });

  describe('dashboard validation', () => {
    it('should validate a valid dashboard object', () => {
      const dashboard = {
        title: 'My Dashboard',
        description: 'A test dashboard',
        hits: 0,
        version: 1,
        panelsJSON: JSON.stringify([
          {
            panelIndex: '1',
            gridData: { x: 0, y: 0, w: 24, h: 15, i: '1' },
            type: 'visualization',
            id: 'vis-1',
            embeddableConfig: {},
            version: '2.0.0',
          },
        ]),
        optionsJSON: JSON.stringify({ useMargins: true, hidePanelTitles: false }),
        kibanaSavedObjectMeta: {
          searchSourceJSON: '{"query":{"query":"","language":"kuery"},"filter":[]}',
        },
        timeRestore: true,
        timeFrom: 'now-15m',
        timeTo: 'now',
        refreshInterval: {
          pause: true,
          value: 0,
        },
      };

      const result = registry.validate('dashboard', 'v1', dashboard);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate a minimal dashboard with only title', () => {
      const result = registry.validate('dashboard', 'v1', { title: 'Minimal' });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation when title is missing', () => {
      const result = registry.validate('dashboard', 'v1', {
        description: 'No title dashboard',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.path.includes('title') && e.message.includes('required'))).toBe(true);
    });

    it('should fail validation when title has wrong type', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 12345,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('title'))).toBe(true);
    });

    it('should fail validation when hits is not an integer', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        hits: 'not-a-number',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('hits'))).toBe(true);
    });

    it('should fail validation when timeRestore is not a boolean', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        timeRestore: 'yes',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('timeRestore'))).toBe(true);
    });

    it('should fail validation with extra fields not in schema', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        unknownField: 'should not be here',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('unknownField'))).toBe(true);
    });

    it('should validate a dashboard with empty panelsJSON array', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Empty Dashboard',
        panelsJSON: '[]',
      });
      expect(result.valid).toBe(true);
    });

    it('should validate a dashboard with refreshInterval missing optional fields', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        refreshInterval: {
          pause: false,
          value: 5000,
        },
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when refreshInterval is missing required pause field', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        refreshInterval: {
          value: 5000,
        },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('pause'))).toBe(true);
    });
  });

  describe('visualization validation', () => {
    it('should validate a valid visualization object', () => {
      const visualization = {
        title: 'My Visualization',
        description: 'A bar chart',
        version: 1,
        visState: JSON.stringify({
          title: 'My Visualization',
          type: 'histogram',
          params: {
            type: 'histogram',
            addLegend: true,
            addTooltip: true,
            legendPosition: 'right',
          },
          aggs: [
            {
              id: '1',
              enabled: true,
              type: 'count',
              schema: 'metric',
              params: {},
            },
            {
              id: '2',
              enabled: true,
              type: 'terms',
              schema: 'segment',
              params: {
                field: 'response.keyword',
                size: 5,
                order: 'desc',
                orderBy: '1',
              },
            },
          ],
        }),
        uiStateJSON: JSON.stringify({
          vis: { legendOpen: true },
        }),
        kibanaSavedObjectMeta: {
          searchSourceJSON: '{"index":"logs-*","query":{"query":"","language":"kuery"}}',
        },
      };

      const result = registry.validate('visualization', 'v1', visualization);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should validate a minimal visualization', () => {
      const result = registry.validate('visualization', 'v1', {
        title: 'Minimal Vis',
        visState: '{"type":"metric"}',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when title is missing from visualization', () => {
      const result = registry.validate('visualization', 'v1', {
        visState: '{"type":"metric"}',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('title'))).toBe(true);
    });

    it('should fail when visState is missing', () => {
      const result = registry.validate('visualization', 'v1', {
        title: 'Test Vis',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('visState'))).toBe(true);
    });

    it('should fail when visState is not a string', () => {
      const result = registry.validate('visualization', 'v1', {
        title: 'Test Vis',
        visState: { type: 'metric' },
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('visState'))).toBe(true);
    });

    it('should validate with savedSearchRefName', () => {
      const result = registry.validate('visualization', 'v1', {
        title: 'Vis with Search',
        visState: '{"type":"histogram"}',
        savedSearchRefName: 'search_0',
      });
      expect(result.valid).toBe(true);
    });

    it('should fail with extra properties on visualization', () => {
      const result = registry.validate('visualization', 'v1', {
        title: 'Test',
        visState: '{}',
        badProp: 123,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('badProp'))).toBe(true);
    });
  });

  describe('index-pattern validation', () => {
    it('should validate a valid index pattern', () => {
      const indexPattern = {
        title: 'logs-*',
        timeFieldName: '@timestamp',
        fields: JSON.stringify([
          {
            name: '@timestamp',
            type: 'date',
            esTypes: ['date'],
            searchable: true,
            aggregatable: true,
            readFromDocValues: true,
          },
          {
            name: 'message',
            type: 'string',
            esTypes: ['text'],
            searchable: true,
            aggregatable: false,
          },
        ]),
        sourceFilters: JSON.stringify([{ value: 'meta.*' }]),
      };

      const result = registry.validate('index-pattern', 'v1', indexPattern);
      expect(result.valid).toBe(true);
    });

    it('should validate a minimal index pattern with only title', () => {
      const result = registry.validate('index-pattern', 'v1', { title: 'simple-index' });
      expect(result.valid).toBe(true);
    });

    it('should fail when title is missing', () => {
      const result = registry.validate('index-pattern', 'v1', {
        timeFieldName: '@timestamp',
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('search validation', () => {
    it('should validate a valid saved search', () => {
      const search = {
        title: 'My Saved Search',
        description: 'A search for errors',
        columns: ['timestamp', 'message', 'level'],
        sort: [['timestamp', 'desc']],
        kibanaSavedObjectMeta: {
          searchSourceJSON: '{"index":"logs-*","query":{"query":"level:error","language":"kuery"}}',
        },
      };

      const result = registry.validate('search', 'v1', search);
      expect(result.valid).toBe(true);
    });

    it('should validate a minimal saved search', () => {
      const result = registry.validate('search', 'v1', { title: 'Minimal Search' });
      expect(result.valid).toBe(true);
    });

    it('should fail when title is missing from search', () => {
      const result = registry.validate('search', 'v1', {
        columns: ['message'],
      });
      expect(result.valid).toBe(false);
    });

    it('should validate search with empty columns array', () => {
      const result = registry.validate('search', 'v1', {
        title: 'Empty columns',
        columns: [],
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when columns contains non-string elements', () => {
      const result = registry.validate('search', 'v1', {
        title: 'Bad columns',
        columns: [123, true],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('columns'))).toBe(true);
    });
  });

  describe('unknown type handling', () => {
    it('should return an error for an unknown type', () => {
      const result = registry.validate('nonexistent-type', 'v1', { title: 'test' });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Unknown saved object schema');
      expect(result.errors[0].message).toContain('nonexistent-type');
    });

    it('should return an error for an unknown version of a known type', () => {
      const result = registry.validate('dashboard', 'v99', { title: 'test' });
      expect(result.valid).toBe(false);
      expect(result.errors[0].message).toContain('Unknown saved object schema');
    });
  });

  describe('partial validation (optional fields)', () => {
    it('should pass when all optional dashboard fields are omitted', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Sparse Dashboard',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass when all optional visualization fields are omitted', () => {
      const result = registry.validate('visualization', 'v1', {
        title: 'Sparse Vis',
        visState: '{"type":"markdown"}',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass when all optional search fields are omitted', () => {
      const result = registry.validate('search', 'v1', {
        title: 'Sparse Search',
      });
      expect(result.valid).toBe(true);
    });

    it('should pass when all optional index-pattern fields are omitted', () => {
      const result = registry.validate('index-pattern', 'v1', {
        title: 'simple-*',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle null values for non-nullable fields', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: null,
      });
      expect(result.valid).toBe(false);
    });

    it('should validate references array structure', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Dashboard with refs',
        references: [
          { name: 'panel_0', type: 'visualization', id: 'vis-abc-123' },
          { name: 'panel_1', type: 'search', id: 'search-def-456' },
        ],
      });
      expect(result.valid).toBe(true);
    });

    it('should fail when a reference is missing required fields', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Dashboard with bad refs',
        references: [{ name: 'panel_0' }],
      });
      expect(result.valid).toBe(false);
      expect(
        result.errors.some(
          (e) => e.path.includes('references') && e.message.includes('required')
        )
      ).toBe(true);
    });

    it('should validate kibanaSavedObjectMeta structure across types', () => {
      for (const type of ['dashboard', 'visualization', 'search']) {
        const attrs: Record<string, unknown> = {
          title: 'Test',
          kibanaSavedObjectMeta: {
            searchSourceJSON: '{}',
          },
        };
        if (type === 'visualization') {
          attrs.visState = '{"type":"metric"}';
        }
        const result = registry.validate(type, 'v1', attrs);
        expect(result.valid).toBe(true);
      }
    });

    it('should reject kibanaSavedObjectMeta with extra properties', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        kibanaSavedObjectMeta: {
          searchSourceJSON: '{}',
          extraField: 'not allowed',
        },
      });
      expect(result.valid).toBe(false);
    });

    it('should handle version as non-integer', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        version: 1.5,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('version'))).toBe(true);
    });

    it('should handle hits with negative value', () => {
      const result = registry.validate('dashboard', 'v1', {
        title: 'Test',
        hits: -1,
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.path.includes('hits'))).toBe(true);
    });
  });
});
