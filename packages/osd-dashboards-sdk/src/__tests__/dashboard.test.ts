/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dashboard } from '../builders/dashboard';
import { Panel } from '../builders/panel';
import { Query } from '../builders/query';
import { DataSource } from '../builders/data_source';
import { Variable } from '../builders/variable';
import { Validator } from '../validation/validator';

describe('Dashboard Builder', () => {
  it('should create a basic dashboard with title', () => {
    const def = Dashboard.create('test-dashboard').title('Test Dashboard').build();

    expect(def.apiVersion).toBe('dashboards.opensearch.org/v1alpha1');
    expect(def.kind).toBe('Dashboard');
    expect(def.metadata.name).toBe('test-dashboard');
    expect(def.spec.title).toBe('Test Dashboard');
  });

  it('should set description', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .description('A test dashboard')
      .build();

    expect(def.spec.description).toBe('A test dashboard');
  });

  it('should set labels', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .labels({ env: 'prod', team: 'infra' })
      .build();

    expect(def.metadata.labels).toEqual({ env: 'prod', team: 'infra' });
  });

  it('should merge labels on multiple calls', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .labels({ env: 'prod' })
      .labels({ team: 'infra' })
      .build();

    expect(def.metadata.labels).toEqual({ env: 'prod', team: 'infra' });
  });

  it('should set annotations', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .annotation('owner', 'jane@co.com')
      .annotation('version', '1.0')
      .build();

    expect(def.metadata.annotations).toEqual({
      owner: 'jane@co.com',
      version: '1.0',
    });
  });

  it('should set time range', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .timeRange('now-1h', 'now')
      .build();

    expect(def.spec.timeRange).toEqual({ from: 'now-1h', to: 'now' });
  });

  it('should set refresh interval', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .refreshInterval('30s')
      .build();

    expect(def.spec.refreshInterval).toBe('30s');
  });

  it('should not include timeRange when not set', () => {
    const def = Dashboard.create('test').title('Test').build();
    expect(def.spec.timeRange).toBeUndefined();
  });

  it('should not include refreshInterval when not set', () => {
    const def = Dashboard.create('test').title('Test').build();
    expect(def.spec.refreshInterval).toBeUndefined();
  });

  it('should add a single panel', () => {
    const panel = Panel.create('cpu-panel')
      .visualization('line')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 });

    const def = Dashboard.create('test').title('Test').addPanel(panel).build();

    expect(def.spec.panels).toHaveLength(1);
    expect(def.spec.panels[0].name).toBe('cpu-panel');
  });

  it('should add multiple panels', () => {
    const panel1 = Panel.create('panel-1').visualization('line').gridPosition({ x: 0, y: 0, w: 12, h: 8 });
    const panel2 = Panel.create('panel-2').visualization('bar').gridPosition({ x: 12, y: 0, w: 12, h: 8 });
    const panel3 = Panel.create('panel-3').visualization('pie').gridPosition({ x: 0, y: 8, w: 24, h: 8 });

    const def = Dashboard.create('test')
      .title('Test')
      .addPanel(panel1)
      .addPanel(panel2)
      .addPanel(panel3)
      .build();

    expect(def.spec.panels).toHaveLength(3);
    expect(def.spec.panels[0].name).toBe('panel-1');
    expect(def.spec.panels[1].name).toBe('panel-2');
    expect(def.spec.panels[2].name).toBe('panel-3');
  });

  it('should add data sources', () => {
    const ds = DataSource.create('my-cluster').type('opensearch').default(true);

    const def = Dashboard.create('test').title('Test').addDataSource(ds).build();

    expect(def.spec.dataSources).toHaveLength(1);
    expect(def.spec.dataSources[0].name).toBe('my-cluster');
    expect(def.spec.dataSources[0].default).toBe(true);
  });

  it('should add variables', () => {
    const variable = Variable.create('host')
      .type('query')
      .label('Host')
      .query('source = metrics | dedup host | fields host');

    const def = Dashboard.create('test').title('Test').addVariable(variable).build();

    expect(def.spec.variables).toHaveLength(1);
    expect(def.spec.variables[0].name).toBe('host');
    expect(def.spec.variables[0].type).toBe('query');
  });

  it('should build correct DashboardDefinition structure', () => {
    const panel = Panel.create('test-panel')
      .visualization('metric')
      .gridPosition({ x: 0, y: 0, w: 24, h: 8 })
      .query(Query.ppl('source = metrics | stats count()'));

    const def = Dashboard.create('my-dash')
      .title('My Dashboard')
      .description('Description')
      .labels({ env: 'staging' })
      .annotation('owner', 'team-a')
      .timeRange('now-24h', 'now')
      .refreshInterval('1m')
      .addPanel(panel)
      .addDataSource(DataSource.create('cluster-1').type('opensearch'))
      .build();

    expect(def).toEqual({
      apiVersion: 'dashboards.opensearch.org/v1alpha1',
      kind: 'Dashboard',
      metadata: {
        name: 'my-dash',
        labels: { env: 'staging' },
        annotations: { owner: 'team-a' },
      },
      spec: {
        title: 'My Dashboard',
        description: 'Description',
        timeRange: { from: 'now-24h', to: 'now' },
        refreshInterval: '1m',
        panels: [
          {
            name: 'test-panel',
            type: 'visualization',
            visualization: 'metric',
            gridPosition: { x: 0, y: 0, w: 24, h: 8 },
            query: { language: 'PPL', query: 'source = metrics | stats count()' },
            options: {},
          },
        ],
        dataSources: [{ name: 'cluster-1', type: 'opensearch', default: false }],
        variables: [],
      },
    });
  });

  it('should produce valid JSON with sorted keys via toJSON()', () => {
    const panel = Panel.create('p1')
      .visualization('line')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 });

    const json = Dashboard.create('test')
      .title('Test')
      .addPanel(panel)
      .toJSON();

    const parsed = JSON.parse(json);
    expect(parsed.apiVersion).toBe('dashboards.opensearch.org/v1alpha1');

    // Verify keys are sorted
    const topLevelKeys = Object.keys(parsed);
    const sortedKeys = [...topLevelKeys].sort();
    expect(topLevelKeys).toEqual(sortedKeys);
  });

  it('should produce valid YAML via toYAML()', () => {
    const panel = Panel.create('p1')
      .visualization('line')
      .gridPosition({ x: 0, y: 0, w: 24, h: 12 });

    const yaml = Dashboard.create('test')
      .title('Test')
      .addPanel(panel)
      .toYAML();

    expect(yaml).toContain('apiVersion:');
    expect(yaml).toContain('kind: Dashboard');
    expect(yaml).toContain('title: Test');
  });

  it('should support full fluent chaining', () => {
    const result = Dashboard.create('chained')
      .title('Chained Dashboard')
      .description('desc')
      .labels({ a: '1' })
      .annotation('b', '2')
      .timeRange('now-1h', 'now')
      .refreshInterval('10s')
      .addPanel(Panel.create('p').visualization('bar').gridPosition({ x: 0, y: 0, w: 12, h: 6 }))
      .addDataSource(DataSource.create('ds').type('opensearch'))
      .addVariable(Variable.create('v').type('custom'))
      .build();

    expect(result.metadata.name).toBe('chained');
    expect(result.spec.title).toBe('Chained Dashboard');
    expect(result.spec.panels).toHaveLength(1);
    expect(result.spec.dataSources).toHaveLength(1);
    expect(result.spec.variables).toHaveLength(1);
  });

  it('should fail validation with no panels', () => {
    const def = Dashboard.create('test').title('Test').build();
    const errors = Validator.validate(def);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.path === 'spec.panels')).toBe(true);
  });

  it('should fail validation with empty title', () => {
    const def = Dashboard.create('test')
      .title('')
      .addPanel(Panel.create('p').visualization('line').gridPosition({ x: 0, y: 0, w: 12, h: 8 }))
      .build();

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.path === 'spec.title')).toBe(true);
  });

  it('should correctly set labels as a record', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .labels({ env: 'prod', region: 'us-east-1' })
      .build();

    expect(def.metadata.labels.env).toBe('prod');
    expect(def.metadata.labels.region).toBe('us-east-1');
  });

  it('should correctly set annotations individually', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .annotation('owner', 'alice')
      .annotation('created-by', 'sdk')
      .build();

    expect(def.metadata.annotations.owner).toBe('alice');
    expect(def.metadata.annotations['created-by']).toBe('sdk');
  });
});
