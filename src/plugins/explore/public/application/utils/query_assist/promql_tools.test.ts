/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { PROMQL_FRONTEND_TOOLS, isPromQLMetadataTool, PromQLToolName } from './promql_tools';

describe('promql_tools', () => {
  describe('PROMQL_FRONTEND_TOOLS', () => {
    it('should export an array with single consolidated tool', () => {
      expect(Array.isArray(PROMQL_FRONTEND_TOOLS)).toBe(true);
      expect(PROMQL_FRONTEND_TOOLS.length).toBe(1);
    });

    it('should include search_prometheus_metadata tool', () => {
      const tool = PROMQL_FRONTEND_TOOLS.find((t) => t.name === 'search_prometheus_metadata');
      expect(tool).toBeDefined();
      expect(tool?.description).toContain('Search Prometheus metadata');
      expect(tool?.description).toContain('metrics with their labels');
      expect(tool?.parameters.type).toBe('object');
      expect(tool?.parameters.properties).toHaveProperty('query');
      expect(tool?.parameters.properties).toHaveProperty('metricsLimit');
      expect(tool?.parameters.properties).toHaveProperty('labelsLimit');
      expect(tool?.parameters.properties).toHaveProperty('valuesLimit');
    });

    it('should have correct parameter schema for search_prometheus_metadata', () => {
      const tool = PROMQL_FRONTEND_TOOLS[0];
      expect(tool.name).toBe('search_prometheus_metadata');
      expect(tool.parameters.properties.query.type).toBe('string');
      expect(tool.parameters.properties.metricsLimit.type).toBe('number');
      expect(tool.parameters.properties.labelsLimit.type).toBe('number');
      expect(tool.parameters.properties.valuesLimit.type).toBe('number');
      expect(tool.parameters.required).toEqual([]);
    });

    it('should have correct parameter schema structure for all tools', () => {
      PROMQL_FRONTEND_TOOLS.forEach((tool) => {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool.parameters).toHaveProperty('type');
        expect(tool.parameters).toHaveProperty('properties');
        expect(tool.parameters).toHaveProperty('required');
        expect(Array.isArray(tool.parameters.required)).toBe(true);
      });
    });
  });

  describe('isPromQLMetadataTool', () => {
    it('should return true for search_prometheus_metadata', () => {
      expect(isPromQLMetadataTool('search_prometheus_metadata')).toBe(true);
    });

    it('should return false for old tool names', () => {
      expect(isPromQLMetadataTool('search_metrics')).toBe(false);
      expect(isPromQLMetadataTool('search_labels')).toBe(false);
      expect(isPromQLMetadataTool('search_label_values')).toBe(false);
    });

    it('should return false for unknown tool name', () => {
      expect(isPromQLMetadataTool('unknown_tool')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPromQLMetadataTool('')).toBe(false);
    });

    it('should return false for similar but incorrect names', () => {
      expect(isPromQLMetadataTool('search_prometheus')).toBe(false);
      expect(isPromQLMetadataTool('prometheus_metadata')).toBe(false);
      expect(isPromQLMetadataTool('searchPrometheusMetadata')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isPromQLMetadataTool('SEARCH_PROMETHEUS_METADATA')).toBe(false);
      expect(isPromQLMetadataTool('Search_Prometheus_Metadata')).toBe(false);
    });

    it('should serve as a type guard', () => {
      const toolName: string = 'search_prometheus_metadata';
      if (isPromQLMetadataTool(toolName)) {
        // TypeScript should recognize toolName as PromQLToolName here
        const typed: PromQLToolName = toolName;
        expect(typed).toBe('search_prometheus_metadata');
      }
    });
  });
});
