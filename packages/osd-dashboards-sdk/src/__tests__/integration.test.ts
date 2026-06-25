/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dashboard } from '../builders/dashboard';
import { Panel } from '../builders/panel';
import { Query } from '../builders/query';
import { DataSource } from '../builders/data_source';
import { Variable } from '../builders/variable';
import { Serializer } from '../output/serializer';
import { Validator } from '../validation/validator';
import { DashboardDefinition } from '../types';

describe('Integration Tests', () => {
  it('should build a complete realistic dashboard, serialize, validate, and round-trip', () => {
    // Build a realistic infrastructure monitoring dashboard
    const dashboard = Dashboard.create('infra-monitoring')
      .title('Infrastructure Monitoring')
      .description(
        'Real-time infrastructure monitoring dashboard for production services'
      )
      .labels({
        env: 'production',
        team: 'platform-engineering',
        tier: 'critical',
      })
      .annotation('owner', 'platform-team@example.com')
      .annotation('oncall', 'https://pagerduty.com/schedule/platform')
      .annotation('runbook', 'https://wiki.example.com/infra-monitoring')
      .timeRange('now-1h', 'now')
      .refreshInterval('30s');

    // CPU usage panel
    dashboard.addPanel(
      Panel.create('cpu-usage')
        .visualization('line')
        .gridPosition({ x: 0, y: 0, w: 12, h: 8 })
        .query(
          Query.ppl(
            'source = metrics | where metric_name = "cpu.usage" | stats avg(value) by host, @timestamp'
          )
        )
        .option('showLegend', true)
        .option('showGridLines', true)
        .option('yAxisLabel', 'CPU %')
        .option('thresholds', [
          { value: 80, color: 'yellow' },
          { value: 95, color: 'red' },
        ])
    );

    // Memory usage panel
    dashboard.addPanel(
      Panel.create('memory-usage')
        .visualization('area')
        .gridPosition({ x: 12, y: 0, w: 12, h: 8 })
        .query(
          Query.ppl(
            'source = metrics | where metric_name = "memory.usage" | stats avg(value) by host, @timestamp'
          )
        )
        .option('showLegend', true)
        .option('fillOpacity', 0.3)
    );

    // Request rate panel
    dashboard.addPanel(
      Panel.create('request-rate')
        .visualization('bar')
        .gridPosition({ x: 0, y: 8, w: 8, h: 8 })
        .query(
          Query.sql(
            'SELECT host, COUNT(*) as request_count FROM access_logs WHERE timestamp > NOW() - INTERVAL 1 HOUR GROUP BY host'
          )
        )
        .option('showLegend', false)
        .option('colorScheme', 'cool')
    );

    // Error rate pie chart
    dashboard.addPanel(
      Panel.create('error-distribution')
        .visualization('pie')
        .gridPosition({ x: 8, y: 8, w: 8, h: 8 })
        .query(
          Query.lucene('status:>=400 AND status:<600')
        )
        .option('showLabels', true)
    );

    // Status codes gauge
    dashboard.addPanel(
      Panel.create('success-rate')
        .visualization('gauge')
        .gridPosition({ x: 16, y: 8, w: 8, h: 8 })
        .query(
          Query.dql('http.status_code >= 200 AND http.status_code < 300')
        )
        .option('min', 0)
        .option('max', 100)
        .option('unit', '%')
    );

    // Metrics summary table
    dashboard.addPanel(
      Panel.create('metrics-table')
        .visualization('table')
        .gridPosition({ x: 0, y: 16, w: 16, h: 8 })
        .query(
          Query.ppl(
            'source = metrics | stats avg(value) as avg_val, max(value) as max_val, min(value) as min_val by host, metric_name'
          )
        )
        .option('sortColumn', 'max_val')
        .option('sortDirection', 'desc')
    );

    // Current metric value
    dashboard.addPanel(
      Panel.create('active-hosts')
        .visualization('metric')
        .gridPosition({ x: 16, y: 16, w: 8, h: 4 })
        .query(
          Query.ppl('source = metrics | dedup host | stats count() as active_hosts')
        )
        .option('fontSize', 'large')
    );

    // Markdown notes
    dashboard.addPanel(
      Panel.create('notes')
        .visualization('markdown')
        .gridPosition({ x: 16, y: 20, w: 8, h: 4 })
        .option(
          'content',
          '## Notes\n- Check [runbook](https://wiki.example.com/infra) for alerts\n- Contact platform-team for escalations'
        )
    );

    // Add data sources
    dashboard.addDataSource(
      DataSource.create('prod-opensearch')
        .type('opensearch')
        .default(true)
    );

    dashboard.addDataSource(
      DataSource.create('metrics-store')
        .type('prometheus')
        .default(false)
    );

    // Add template variables
    dashboard.addVariable(
      Variable.create('host')
        .type('query')
        .label('Host')
        .description('Select a host to filter')
        .query('source = metrics | dedup host | fields host')
        .multi(true)
    );

    dashboard.addVariable(
      Variable.create('interval')
        .type('interval')
        .label('Interval')
        .options(['1m', '5m', '15m', '1h'])
        .defaultValue('5m')
    );

    dashboard.addVariable(
      Variable.create('environment')
        .type('custom')
        .label('Environment')
        .options(['production', 'staging', 'development'])
        .defaultValue('production')
    );

    // Build the definition
    const definition = dashboard.build();

    // Validate
    const errors = Validator.validate(definition);
    expect(errors).toHaveLength(0);
    expect(Validator.isValid(definition)).toBe(true);

    // Verify structure
    expect(definition.apiVersion).toBe('dashboards.opensearch.org/v1alpha1');
    expect(definition.kind).toBe('Dashboard');
    expect(definition.metadata.name).toBe('infra-monitoring');
    expect(definition.metadata.labels.env).toBe('production');
    expect(definition.metadata.annotations.owner).toBe('platform-team@example.com');
    expect(definition.spec.title).toBe('Infrastructure Monitoring');
    expect(definition.spec.panels).toHaveLength(8);
    expect(definition.spec.dataSources).toHaveLength(2);
    expect(definition.spec.variables).toHaveLength(3);
    expect(definition.spec.timeRange).toEqual({ from: 'now-1h', to: 'now' });
    expect(definition.spec.refreshInterval).toBe('30s');

    // Verify panel details
    const cpuPanel = definition.spec.panels.find((p) => p.name === 'cpu-usage');
    expect(cpuPanel).toBeDefined();
    expect(cpuPanel!.visualization).toBe('line');
    expect(cpuPanel!.query?.language).toBe('PPL');
    expect(cpuPanel!.options.showLegend).toBe(true);

    const markdownPanel = definition.spec.panels.find((p) => p.name === 'notes');
    expect(markdownPanel).toBeDefined();
    expect(markdownPanel!.visualization).toBe('markdown');

    // Verify variables
    const hostVar = definition.spec.variables.find((v) => v.name === 'host');
    expect(hostVar).toBeDefined();
    expect(hostVar!.type).toBe('query');
    expect(hostVar!.multi).toBe(true);

    const intervalVar = definition.spec.variables.find((v) => v.name === 'interval');
    expect(intervalVar).toBeDefined();
    expect(intervalVar!.options).toEqual(['1m', '5m', '15m', '1h']);
    expect(intervalVar!.defaultValue).toBe('5m');

    // Serialize to JSON
    const json = Serializer.toJSON(definition);
    expect(() => JSON.parse(json)).not.toThrow();

    // Round-trip: serialize -> parse -> compare
    const roundTripped: DashboardDefinition = JSON.parse(json);
    expect(roundTripped.apiVersion).toBe(definition.apiVersion);
    expect(roundTripped.kind).toBe(definition.kind);
    expect(roundTripped.metadata.name).toBe(definition.metadata.name);
    expect(roundTripped.spec.title).toBe(definition.spec.title);
    expect(roundTripped.spec.panels).toHaveLength(definition.spec.panels.length);
    expect(roundTripped.spec.dataSources).toHaveLength(definition.spec.dataSources.length);
    expect(roundTripped.spec.variables).toHaveLength(definition.spec.variables.length);

    // Verify JSON has sorted keys
    const topLevelKeys = Object.keys(roundTripped);
    expect(topLevelKeys).toEqual([...topLevelKeys].sort());

    // Serialize to YAML
    const yaml = Serializer.toYAML(definition);
    expect(yaml).toContain('apiVersion:');
    expect(yaml).toContain('kind: Dashboard');
    expect(yaml).toContain('Infrastructure Monitoring');
    expect(yaml).toContain('cpu-usage');
  });

  it('should build a minimal valid dashboard', () => {
    const def = Dashboard.create('minimal')
      .title('Minimal')
      .addPanel(
        Panel.create('single-panel')
          .visualization('metric')
          .gridPosition({ x: 0, y: 0, w: 24, h: 8 })
      )
      .build();

    const errors = Validator.validate(def);
    expect(errors).toHaveLength(0);

    const json = Serializer.toJSON(def);
    const parsed = JSON.parse(json);
    expect(parsed.spec.panels).toHaveLength(1);
    expect(parsed.spec.dataSources).toEqual([]);
    expect(parsed.spec.variables).toEqual([]);
  });

  it('should detect validation errors in an invalid dashboard', () => {
    const def = Dashboard.create('bad')
      .title('')
      .build();

    const errors = Validator.validate(def);
    // Should have at least title error and panels error
    expect(errors.length).toBeGreaterThanOrEqual(2);
    expect(errors.some((e) => e.path === 'spec.title')).toBe(true);
    expect(errors.some((e) => e.path === 'spec.panels')).toBe(true);
  });

  it('should serialize and deserialize preserving all panel types', () => {
    const vizTypes = [
      'line', 'bar', 'pie', 'heatmap', 'table', 'metric', 'markdown', 'area', 'gauge',
    ] as const;

    const dashboard = Dashboard.create('all-types').title('All Types');

    vizTypes.forEach((type, i) => {
      dashboard.addPanel(
        Panel.create(`panel-${type}`)
          .visualization(type)
          .gridPosition({ x: 0, y: i * 8, w: 24, h: 8 })
      );
    });

    const def = dashboard.build();
    const json = Serializer.toJSON(def);
    const parsed: DashboardDefinition = JSON.parse(json);

    vizTypes.forEach((type) => {
      const panel = parsed.spec.panels.find((p) => p.name === `panel-${type}`);
      expect(panel).toBeDefined();
      expect(panel!.visualization).toBe(type);
    });
  });

  it('should use toJSON and toYAML directly from the dashboard builder', () => {
    const dashboard = Dashboard.create('direct')
      .title('Direct Serialization')
      .addPanel(
        Panel.create('p1')
          .visualization('line')
          .gridPosition({ x: 0, y: 0, w: 24, h: 12 })
      );

    const json = dashboard.toJSON();
    expect(() => JSON.parse(json)).not.toThrow();
    expect(JSON.parse(json).spec.title).toBe('Direct Serialization');

    const yaml = dashboard.toYAML();
    expect(yaml).toContain('Direct Serialization');
    expect(yaml).toContain('kind: Dashboard');
  });
});
