/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Dashboard } from '../builders/dashboard';
import { Panel } from '../builders/panel';
import { Query } from '../builders/query';
import { DataSource } from '../builders/data_source';
import { Validator } from '../validation/validator';
import { DashboardDefinition } from '../types';

describe('Validator', () => {
  function buildValidDashboard(): DashboardDefinition {
    return Dashboard.create('valid-dashboard')
      .title('Valid Dashboard')
      .description('A valid dashboard')
      .addPanel(
        Panel.create('panel-1')
          .visualization('line')
          .gridPosition({ x: 0, y: 0, w: 12, h: 8 })
          .query(Query.ppl('source = metrics'))
      )
      .build();
  }

  it('should pass validation for a valid dashboard', () => {
    const def = buildValidDashboard();
    const errors = Validator.validate(def);
    expect(errors).toHaveLength(0);
    expect(Validator.isValid(def)).toBe(true);
  });

  it('should fail when title is missing', () => {
    const def = Dashboard.create('test')
      .title('')
      .addPanel(
        Panel.create('p1')
          .visualization('line')
          .gridPosition({ x: 0, y: 0, w: 12, h: 8 })
      )
      .build();

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.path === 'spec.title')).toBe(true);
    expect(Validator.isValid(def)).toBe(false);
  });

  it('should fail when no panels are present', () => {
    const def = Dashboard.create('test').title('Test').build();
    const errors = Validator.validate(def);

    expect(errors.some((e) => e.path === 'spec.panels')).toBe(true);
  });

  it('should detect overlapping panels', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .addPanel(
        Panel.create('p1')
          .visualization('line')
          .gridPosition({ x: 0, y: 0, w: 12, h: 8 })
      )
      .addPanel(
        Panel.create('p2')
          .visualization('bar')
          .gridPosition({ x: 6, y: 4, w: 12, h: 8 })
      )
      .build();

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.message.includes('overlaps'))).toBe(true);
  });

  it('should not report overlapping when panels are adjacent', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .addPanel(
        Panel.create('p1')
          .visualization('line')
          .gridPosition({ x: 0, y: 0, w: 12, h: 8 })
      )
      .addPanel(
        Panel.create('p2')
          .visualization('bar')
          .gridPosition({ x: 12, y: 0, w: 12, h: 8 })
      )
      .build();

    const errors = Validator.validate(def);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid visualization type', () => {
    const def = buildValidDashboard();
    // Force an invalid visualization type
    (def.spec.panels[0] as any).visualization = 'sparkline';

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.path.includes('visualization'))).toBe(true);
    expect(errors.some((e) => e.message.includes('sparkline'))).toBe(true);
  });

  it('should reject invalid query language', () => {
    const def = buildValidDashboard();
    // Force an invalid query language
    (def.spec.panels[0].query as any).language = 'GraphQL';

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.path.includes('query.language'))).toBe(true);
    expect(errors.some((e) => e.message.includes('GraphQL'))).toBe(true);
  });

  it('should reject empty query string', () => {
    const def = buildValidDashboard();
    // Force an empty query string
    def.spec.panels[0].query = { language: 'PPL', query: '' };

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.path.includes('query.query'))).toBe(true);
  });

  it('should validate a complex dashboard with many panels', () => {
    const dashboard = Dashboard.create('complex')
      .title('Complex Dashboard')
      .description('A complex dashboard with many panels')
      .labels({ env: 'prod', team: 'platform' })
      .annotation('owner', 'admin@example.com')
      .timeRange('now-7d', 'now')
      .refreshInterval('1m');

    // Add panels in a 2-column grid
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 2; col++) {
        dashboard.addPanel(
          Panel.create(`panel-${row}-${col}`)
            .visualization('line')
            .gridPosition({ x: col * 12, y: row * 8, w: 12, h: 8 })
            .query(Query.ppl(`source = metrics_${row}_${col}`))
        );
      }
    }

    dashboard.addDataSource(DataSource.create('prod-cluster').type('opensearch').default(true));

    const def = dashboard.build();
    const errors = Validator.validate(def);

    expect(errors).toHaveLength(0);
    expect(def.spec.panels).toHaveLength(10);
  });

  it('should report negative grid position values', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .addPanel(
        Panel.create('p1')
          .visualization('line')
          .gridPosition({ x: -1, y: 0, w: 12, h: 8 })
      )
      .build();

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.path.includes('gridPosition'))).toBe(true);
  });

  it('should report zero width or height', () => {
    const def = Dashboard.create('test')
      .title('Test')
      .addPanel(
        Panel.create('p1')
          .visualization('line')
          .gridPosition({ x: 0, y: 0, w: 0, h: 8 })
      )
      .build();

    const errors = Validator.validate(def);
    expect(errors.some((e) => e.path.includes('gridPosition'))).toBe(true);
  });
});
