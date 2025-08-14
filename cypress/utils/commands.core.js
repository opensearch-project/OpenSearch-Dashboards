/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import initCommandNamespace from './command_namespace';
import { PATHS, DATASOURCE_NAME } from './constants';
import { ADMIN_AUTH } from './commands';

initCommandNamespace(cy, 'core');

const DEFAULT_OPTIONS = {
  workspace: {
    title: `workspace-${Date.now()}-rocky`,
    description: 'Workspace for testing',
    type: 'observability',
  },
  datasource: {
    title: DATASOURCE_NAME,
    url: PATHS.ENGINE,
    authType: 'no_auth',
  },
  dataset: {
    timeField: 'timestamp',
    type: 'INDEX_PATTERN',
  },
  fixture: {
    baseDir: 'query_enhancements/data_logs_1',
  },
};

cy.core.add('createWorkspace', (options = {}) => {
  const { title, description } = { ...DEFAULT_OPTIONS.workspace, ...options };

  cy.request({
    method: 'POST',
    url: '/api/workspaces',
    headers: { 'osd-xsrf': true },
    body: {
      attributes: {
        name: title,
        description,
        features: ['use-case-observability'],
      },
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    expect(response.body.success).to.eq(true);
    const workspaceId = response.body.result.id;
    cy.wrap(workspaceId).as('WORKSPACE_ID');
    return cy.wrap(workspaceId);
  });
});

cy.core.add(
  'createDataSource',
  ({
    title = 'Test data source',
    description = 'Is the local datasource',
    endpoint = PATHS.ENGINE,
    auth = { type: 'no_auth' },
    dataSourceVersion = '2.14.0',
    dataSourceEngineType = 'OpenSearch',
  } = {}) => {
    return cy
      .request({
        method: 'POST',
        url: '/api/saved_objects/data-source',
        headers: {
          'osd-xsrf': true,
        },
        auth: ADMIN_AUTH,
        body: {
          attributes: {
            title,
            description,
            endpoint,
            auth,
            dataSourceVersion,
            dataSourceEngineType,
          },
        },
      })
      .then((resp) => {
        if (resp && resp.body && resp.body.id) {
          const dataSourceId = resp.body.id;
          cy.wrap(dataSourceId).as('DATASOURCE_ID');
          return cy.wrap([dataSourceId, title]);
        }
      });
  }
);

cy.core.add('associateDataSourcesToWorkspaces', (workspaceId, datasourceIds) => {
  // Always ensure datasourceIds is an array
  const dataSourceIdsArray = Array.isArray(datasourceIds) ? datasourceIds : [datasourceIds];

  const savedObjects = dataSourceIdsArray.map((id) => ({ id, type: 'data-source' }));

  cy.request({
    method: 'POST',
    url: `/w/${workspaceId}/api/workspaces/_associate`,
    headers: { 'osd-xsrf': true },
    body: {
      savedObjects,
      workspaceId,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    return cy.wrap(response);
  });
});

cy.core.add('createDataset', (options) => {
  const { index, timeField } = { ...DEFAULT_OPTIONS.dataset, ...options };

  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    cy.get('@DATASOURCE_ID').then((datasourceId) => {
      cy.request({
        method: 'POST',
        url: `/w/${workspaceId}/api/saved_objects/index-pattern`,
        headers: {
          'osd-xsrf': 'osd-fetch',
        },
        body: {
          attributes: {
            title: index,
            timeFieldName: timeField,
            fieldAttrs: '{}',
            fieldFormats: '{}',
            fields: JSON.stringify([
              {
                count: 0,
                name: '_id',
                type: 'string',
                esTypes: ['_id'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: false,
              },
              {
                count: 0,
                name: '_index',
                type: 'string',
                esTypes: ['_index'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: false,
              },
              {
                count: 0,
                name: '_score',
                type: 'number',
                scripted: false,
                searchable: false,
                aggregatable: false,
                readFromDocValues: false,
              },
              {
                count: 0,
                name: '_source',
                type: '_source',
                esTypes: ['_source'],
                scripted: false,
                searchable: false,
                aggregatable: false,
                readFromDocValues: false,
              },
              {
                count: 0,
                name: 'bytes_transferred',
                type: 'number',
                esTypes: ['long'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'category',
                type: 'string',
                esTypes: ['keyword'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'event_sequence_number',
                type: 'number',
                esTypes: ['long'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'event_time',
                type: 'date',
                esTypes: ['date'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'request_url',
                type: 'string',
                esTypes: ['keyword'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'response_time',
                type: 'number',
                esTypes: ['float'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'service_endpoint',
                type: 'string',
                esTypes: ['keyword'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'status_code',
                type: 'number',
                esTypes: ['integer'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
              {
                count: 0,
                name: 'timestamp',
                type: 'date',
                esTypes: ['date'],
                scripted: false,
                searchable: true,
                aggregatable: true,
                readFromDocValues: true,
              },
            ]),
          },
          references: [{ name: 'dataSource', type: 'data-source', id: datasourceId }],
          workspaces: [workspaceId],
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        const indexPatternId = response.body.id;
        cy.wrap(indexPatternId).as('INDEX_PATTERN_ID');
        return cy.wrap(indexPatternId);
      });
    });
  });
});

cy.core.add('buildDatasetQuery', (options = {}) => {
  const {
    index,
    timeFieldName = 'timestamp',
    type = 'INDEX_PATTERN',
    language = 'PPL',
    query = '',
  } = options;

  return cy.get('@DATASOURCE_ID').then((datasourceId) => {
    return cy.get('@INDEX_PATTERN_ID').then((indexPatternId) => {
      return `_q=(dataset:(dataSource:(id:'${datasourceId}',title:${DATASOURCE_NAME},type:OpenSearch),id:'${indexPatternId}',timeFieldName:${timeFieldName},title:'${index}',type:${type}),language:${language},query:'${query}')`;
    });
  });
});

cy.core.add('setUiSettings', (settings = {}) => {
  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    cy.request({
      method: 'POST',
      url: `/w/${workspaceId}/api/opensearch-dashboards/settings`,
      headers: {
        'osd-xsrf': 'osd-fetch',
      },
      body: {
        changes: settings,
      },
    }).then((response) => {
      expect(response.status).to.eq(200);
      return cy.wrap(response);
    });
  });
});

cy.core.add('setupTestResources', (options = {}) => {
  const { index, baseDir = DEFAULT_OPTIONS.fixture.baseDir } = options;

  const mappingPath = `cypress/fixtures/${baseDir}/${index}.mapping.json`;
  const dataPath = `cypress/fixtures/${baseDir}/${index}.data.ndjson`;

  // Step 1: Setup test data
  cy.osd.setupTestData(DEFAULT_OPTIONS.datasource.url, [mappingPath], [dataPath]);

  // Use proper chaining with return to ensure commands complete in sequence
  return cy.core
    .createDataSource()
    .then(([dataSourceId]) => {
      cy.wrap(dataSourceId).as('DATASOURCE_ID');
      return cy.core.createWorkspace();
    })
    .then((workspaceId) => {
      cy.wrap(workspaceId).as('WORKSPACE_ID');
      return cy.get('@DATASOURCE_ID').then((dataSourceId) => {
        cy.core.setUiSettings({
          defaultWorkspace: workspaceId,
          defaultDataSource: dataSourceId,
        });
        cy.core.associateDataSourcesToWorkspaces(workspaceId, [dataSourceId]);
        return cy.core.createDataset({ index });
      });
    })
    .then((indexPatternId) => {
      cy.wrap(indexPatternId).as('INDEX_PATTERN_ID');

      cy.core.setUiSettings({
        defaultIndex: indexPatternId,
      });
    });
});

cy.core.add('cleanupTestResources', (options = {}) => {
  const { index } = options;

  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    cy.request({
      method: 'DELETE',
      url: `/api/workspaces/${workspaceId}`,
      headers: { 'osd-xsrf': true },
      failOnStatusCode: false,
    });
  });

  cy.get('@DATASOURCE_ID').then((datasourceId) => {
    cy.request({
      method: 'DELETE',
      url: `/api/saved_objects/data-source/${datasourceId}?force=true`,
      headers: { 'osd-xsrf': true },
      failOnStatusCode: false,
    });
  });

  cy.osd.deleteIndex(index);
});
