/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PROMQL_FRONTEND_TOOLS,
  PROMQL_TOOL_NAMES,
  isPromQLMetadataTool,
  PromQLToolName,
} from './promql_tools';

describe('promql_tools', () => {
  describe('PROMQL_FRONTEND_TOOLS', () => {
    it('should export an array of tools', () => {
      expect(Array.isArray(PROMQL_FRONTEND_TOOLS)).toBe(true);
      expect(PROMQL_FRONTEND_TOOLS.length).toBe(3);
    });

    it('should include search_metrics tool', () => {
      const searchMetrics = PROMQL_FRONTEND_TOOLS.find((t) => t.name === 'search_metrics');
      expect(searchMetrics).toBeDefined();
      expect(searchMetrics?.description).toContain('Search for available Prometheus metrics');
      expect(searchMetrics?.parameters.type).toBe('object');
      expect(searchMetrics?.parameters.properties).toHaveProperty('query');
      expect(searchMetrics?.parameters.properties).toHaveProperty('limit');
    });

    it('should include search_labels tool', () => {
      const searchLabels = PROMQL_FRONTEND_TOOLS.find((t) => t.name === 'search_labels');
      expect(searchLabels).toBeDefined();
      expect(searchLabels?.description).toContain('Search for available Prometheus labels');
      expect(searchLabels?.parameters.type).toBe('object');
      expect(searchLabels?.parameters.properties).toHaveProperty('metric');
    });

    it('should include search_label_values tool', () => {
      const searchLabelValues = PROMQL_FRONTEND_TOOLS.find((t) => t.name === 'search_label_values');
      expect(searchLabelValues).toBeDefined();
      expect(searchLabelValues?.description).toContain('Search for possible values');
      expect(searchLabelValues?.parameters.type).toBe('object');
      expect(searchLabelValues?.parameters.properties).toHaveProperty('label');
      expect(searchLabelValues?.parameters.properties).toHaveProperty('metric');
      expect(searchLabelValues?.parameters.required).toContain('label');
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

  describe('PROMQL_TOOL_NAMES', () => {
    it('should contain all tool names', () => {
      expect(PROMQL_TOOL_NAMES).toEqual(['search_metrics', 'search_labels', 'search_label_values']);
    });

    it('should match PROMQL_FRONTEND_TOOLS names', () => {
      const toolNames = PROMQL_FRONTEND_TOOLS.map((t) => t.name);
      expect(PROMQL_TOOL_NAMES).toEqual(toolNames);
    });
  });

  describe('isPromQLMetadataTool', () => {
    it('should return true for search_metrics', () => {
      expect(isPromQLMetadataTool('search_metrics')).toBe(true);
    });

    it('should return true for search_labels', () => {
      expect(isPromQLMetadataTool('search_labels')).toBe(true);
    });

    it('should return true for search_label_values', () => {
      expect(isPromQLMetadataTool('search_label_values')).toBe(true);
    });

    it('should return false for unknown tool name', () => {
      expect(isPromQLMetadataTool('unknown_tool')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isPromQLMetadataTool('')).toBe(false);
    });

    it('should return false for similar but incorrect names', () => {
      expect(isPromQLMetadataTool('search_metric')).toBe(false);
      expect(isPromQLMetadataTool('search_label')).toBe(false);
      expect(isPromQLMetadataTool('searchMetrics')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isPromQLMetadataTool('SEARCH_METRICS')).toBe(false);
      expect(isPromQLMetadataTool('Search_Metrics')).toBe(false);
    });

    it('should serve as a type guard', () => {
      const toolName: string = 'search_metrics';
      if (isPromQLMetadataTool(toolName)) {
        // TypeScript should recognize toolName as PromQLToolName here
        const typed: PromQLToolName = toolName;
        expect(typed).toBe('search_metrics');
      }
    });
  });
});
