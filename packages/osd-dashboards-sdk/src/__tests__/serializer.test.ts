/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from 'fs';
import * as path from 'path';
import { Serializer } from '../output/serializer';
import { Dashboard } from '../builders/dashboard';
import { Panel } from '../builders/panel';
import { Query } from '../builders/query';
import { DataSource } from '../builders/data_source';
import { DashboardDefinition } from '../types';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Serializer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedFs.existsSync.mockReturnValue(true);
  });

  function buildSampleDashboard(): DashboardDefinition {
    return Dashboard.create('sample')
      .title('Sample Dashboard')
      .description('A sample')
      .labels({ env: 'test' })
      .annotation('owner', 'tester')
      .timeRange('now-1h', 'now')
      .refreshInterval('30s')
      .addPanel(
        Panel.create('panel-1')
          .visualization('line')
          .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
          .query(Query.ppl('source = metrics'))
          .option('showLegend', true)
      )
      .addDataSource(DataSource.create('cluster').type('opensearch').default(true))
      .build();
  }

  describe('toJSON', () => {
    it('should produce deterministic JSON with sorted keys', () => {
      const def = buildSampleDashboard();
      const json = Serializer.toJSON(def);
      const parsed = JSON.parse(json);

      // Top-level keys should be sorted
      const topKeys = Object.keys(parsed);
      expect(topKeys).toEqual([...topKeys].sort());

      // Metadata keys should be sorted
      const metaKeys = Object.keys(parsed.metadata);
      expect(metaKeys).toEqual([...metaKeys].sort());

      // Spec keys should be sorted
      const specKeys = Object.keys(parsed.spec);
      expect(specKeys).toEqual([...specKeys].sort());
    });

    it('should produce valid parseable JSON', () => {
      const def = buildSampleDashboard();
      const json = Serializer.toJSON(def);
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should write to file when filepath is provided', () => {
      const def = buildSampleDashboard();
      Serializer.toJSON(def, '/tmp/test-dashboard.json');

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-dashboard.json'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should return JSON string even when writing to file', () => {
      const def = buildSampleDashboard();
      const json = Serializer.toJSON(def, '/tmp/test.json');
      expect(typeof json).toBe('string');
      expect(JSON.parse(json).kind).toBe('Dashboard');
    });
  });

  describe('toYAML', () => {
    it('should produce YAML with key structural elements', () => {
      const def = buildSampleDashboard();
      const yaml = Serializer.toYAML(def);

      expect(yaml).toContain('apiVersion:');
      expect(yaml).toContain('kind: Dashboard');
      expect(yaml).toContain('title: Sample Dashboard');
      expect(yaml).toContain('showLegend: true');
    });

    it('should write to file when filepath is provided', () => {
      const def = buildSampleDashboard();
      Serializer.toYAML(def, '/tmp/test-dashboard.yaml');

      expect(mockedFs.writeFileSync).toHaveBeenCalledTimes(1);
      expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-dashboard.yaml'),
        expect.any(String),
        'utf-8'
      );
    });

    it('should return YAML string even when writing to file', () => {
      const def = buildSampleDashboard();
      const yaml = Serializer.toYAML(def, '/tmp/test.yaml');
      expect(typeof yaml).toBe('string');
      expect(yaml).toContain('Dashboard');
    });
  });

  describe('complex nested objects', () => {
    it('should serialize nested objects correctly in JSON', () => {
      const def = buildSampleDashboard();
      const json = Serializer.toJSON(def);
      const parsed = JSON.parse(json);

      expect(parsed.spec.panels[0].query.language).toBe('PPL');
      expect(parsed.spec.panels[0].gridPosition.w).toBe(24);
    });

    it('should handle empty arrays', () => {
      const def = Dashboard.create('empty').title('Empty').build();
      const json = Serializer.toJSON(def);
      const parsed = JSON.parse(json);

      expect(parsed.spec.panels).toEqual([]);
      expect(parsed.spec.dataSources).toEqual([]);
      expect(parsed.spec.variables).toEqual([]);
    });
  });

  describe('special characters', () => {
    it('should escape special characters in JSON', () => {
      const def = Dashboard.create('special')
        .title('Dashboard with "quotes" and \\ backslashes')
        .description('Line1\nLine2')
        .addPanel(
          Panel.create('p1')
            .visualization('line')
            .gridPosition({ x: 0, y: 0, w: 12, h: 8 })
        )
        .build();

      const json = Serializer.toJSON(def);
      expect(() => JSON.parse(json)).not.toThrow();
      const parsed = JSON.parse(json);
      expect(parsed.spec.title).toBe('Dashboard with "quotes" and \\ backslashes');
      expect(parsed.spec.description).toBe('Line1\nLine2');
    });

    it('should handle special characters in YAML', () => {
      const def = Dashboard.create('special')
        .title('Title: with colon')
        .addPanel(
          Panel.create('p1')
            .visualization('line')
            .gridPosition({ x: 0, y: 0, w: 12, h: 8 })
        )
        .build();

      const yaml = Serializer.toYAML(def);
      // The colon-containing string should be quoted
      expect(yaml).toContain('"Title: with colon"');
    });
  });

  describe('directory creation', () => {
    it('should create directories when they do not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);
      const def = buildSampleDashboard();
      Serializer.toJSON(def, '/tmp/nested/dir/dashboard.json');

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });
  });
});
