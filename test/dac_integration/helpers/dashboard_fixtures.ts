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

/**
 * Prefix used for all DaC integration test objects to enable easy cleanup.
 */
export const DAC_TEST_PREFIX = 'dac-it-';

/**
 * Generate a unique ID for a test object, using the shared prefix.
 */
export function dacTestId(suffix: string): string {
  return `${DAC_TEST_PREFIX}${suffix}`;
}

/**
 * A minimal valid dashboard: just a title and a single panel.
 */
export function minimalDashboard(idSuffix: string = 'minimal') {
  return {
    type: 'dashboard',
    id: dacTestId(idSuffix),
    attributes: {
      title: `DaC Minimal Dashboard ${idSuffix}`,
      description: '',
      panelsJSON: JSON.stringify([
        {
          gridData: { x: 0, y: 0, w: 24, h: 15, i: 'panel_1' },
          panelIndex: 'panel_1',
          embeddableConfig: {},
          version: '3.0.0',
          type: 'visualization',
          id: dacTestId(`vis-${idSuffix}`),
        },
      ]),
      optionsJSON: JSON.stringify({
        hidePanelTitles: false,
        useMargins: true,
      }),
      timeRestore: false,
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: { query: '', language: 'kuery' },
          filter: [],
        }),
      },
    },
    references: [
      {
        type: 'visualization',
        id: dacTestId(`vis-${idSuffix}`),
        name: 'panel_1',
      },
    ],
  };
}

/**
 * A complex dashboard with multiple panels, time range, refresh interval, etc.
 */
export function complexDashboard(idSuffix: string = 'complex') {
  return {
    type: 'dashboard',
    id: dacTestId(idSuffix),
    attributes: {
      title: `DaC Complex Dashboard ${idSuffix}`,
      description: 'A complex dashboard used for integration testing of Dashboards-as-Code.',
      panelsJSON: JSON.stringify([
        {
          gridData: { x: 0, y: 0, w: 24, h: 15, i: 'panel_1' },
          panelIndex: 'panel_1',
          embeddableConfig: { vis: { legendOpen: true } },
          version: '3.0.0',
          type: 'visualization',
          id: dacTestId(`vis-area-${idSuffix}`),
        },
        {
          gridData: { x: 24, y: 0, w: 24, h: 15, i: 'panel_2' },
          panelIndex: 'panel_2',
          embeddableConfig: {},
          version: '3.0.0',
          type: 'visualization',
          id: dacTestId(`vis-metric-${idSuffix}`),
        },
        {
          gridData: { x: 0, y: 15, w: 48, h: 15, i: 'panel_3' },
          panelIndex: 'panel_3',
          embeddableConfig: {},
          version: '3.0.0',
          type: 'search',
          id: dacTestId(`search-${idSuffix}`),
        },
      ]),
      optionsJSON: JSON.stringify({
        hidePanelTitles: false,
        useMargins: true,
      }),
      timeRestore: true,
      timeTo: 'now',
      timeFrom: 'now-7d',
      refreshInterval: JSON.stringify({
        pause: false,
        value: 60000,
      }),
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: { query: 'response:200', language: 'kuery' },
          filter: [
            {
              meta: {
                index: 'logstash-*',
                negate: false,
                disabled: false,
                alias: null,
                type: 'phrase',
                key: 'extension',
                value: 'css',
              },
              query: { match_phrase: { extension: 'css' } },
            },
          ],
        }),
      },
    },
    references: [
      {
        type: 'visualization',
        id: dacTestId(`vis-area-${idSuffix}`),
        name: 'panel_1',
      },
      {
        type: 'visualization',
        id: dacTestId(`vis-metric-${idSuffix}`),
        name: 'panel_2',
      },
      {
        type: 'search',
        id: dacTestId(`search-${idSuffix}`),
        name: 'panel_3',
      },
    ],
  };
}

/**
 * An invalid dashboard (missing title, which is required).
 */
export function invalidDashboard(idSuffix: string = 'invalid') {
  return {
    type: 'dashboard',
    id: dacTestId(idSuffix),
    attributes: {
      // title is intentionally omitted
      description: 'This dashboard is missing its required title field.',
      panelsJSON: JSON.stringify([]),
      optionsJSON: JSON.stringify({}),
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: { query: '', language: 'kuery' },
          filter: [],
        }),
      },
    },
    references: [],
  };
}

/**
 * A dashboard with all commonly-used field types for comprehensive validation.
 */
export function comprehensiveDashboard(idSuffix: string = 'comprehensive') {
  return {
    type: 'dashboard',
    id: dacTestId(idSuffix),
    attributes: {
      title: `DaC Comprehensive Dashboard ${idSuffix}`,
      description: 'A dashboard exercising all commonly-used field types.',
      hits: 0,
      panelsJSON: JSON.stringify([
        {
          gridData: { x: 0, y: 0, w: 12, h: 10, i: 'panel_1' },
          panelIndex: 'panel_1',
          embeddableConfig: {},
          version: '3.0.0',
          type: 'visualization',
          id: dacTestId(`vis-${idSuffix}`),
        },
      ]),
      optionsJSON: JSON.stringify({
        hidePanelTitles: false,
        useMargins: true,
      }),
      timeRestore: true,
      timeTo: 'now',
      timeFrom: 'now-30d',
      refreshInterval: JSON.stringify({
        pause: true,
        value: 300000,
      }),
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: { query: '', language: 'kuery' },
          filter: [],
        }),
      },
    },
    references: [
      {
        type: 'visualization',
        id: dacTestId(`vis-${idSuffix}`),
        name: 'panel_1',
      },
    ],
  };
}

/**
 * A minimal valid visualization object.
 */
export function minimalVisualization(idSuffix: string = 'vis-minimal') {
  return {
    type: 'visualization',
    id: dacTestId(idSuffix),
    attributes: {
      title: `DaC Test Visualization ${idSuffix}`,
      visState: JSON.stringify({
        title: `DaC Test Visualization ${idSuffix}`,
        type: 'metric',
        params: { fontSize: 60 },
        aggs: [{ id: '1', enabled: true, type: 'count', schema: 'metric', params: {} }],
      }),
      uiStateJSON: '{}',
      description: '',
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: { query: '', language: 'kuery' },
          filter: [],
        }),
      },
    },
    references: [],
  };
}

/**
 * A minimal valid search (saved search) object.
 */
export function minimalSearch(idSuffix: string = 'search-minimal') {
  return {
    type: 'search',
    id: dacTestId(idSuffix),
    attributes: {
      title: `DaC Test Search ${idSuffix}`,
      description: '',
      columns: ['_source'],
      sort: [],
      kibanaSavedObjectMeta: {
        searchSourceJSON: JSON.stringify({
          query: { query: '', language: 'kuery' },
          filter: [],
          highlightAll: true,
          version: true,
        }),
      },
    },
    references: [],
  };
}
