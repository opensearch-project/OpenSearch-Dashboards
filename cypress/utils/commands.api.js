/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import initCommandNamespace from './command_namespace';
import { DATASOURCE_NAME } from './constants';

initCommandNamespace(cy, 'api');

const DEFAULT_OPTIONS = {
  workspace: {
    title: `workspace-${Date.now()}`,
    description: 'Workspace for testing',
    type: 'observability',
  },
  datasource: {
    title: DATASOURCE_NAME,
    url: Cypress.env('openSearchUrl'),
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

cy.api.add('createWorkspace', (options = {}) => {
  const { title, description, type } = { ...DEFAULT_OPTIONS.workspace, ...options };

  cy.request({
    method: 'POST',
    url: '/api/saved_objects/workspace',
    headers: { 'osd-xsrf': true },
    body: {
      attributes: {
        title,
        description,
        type,
      },
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const workspaceId = response.body.id;
    cy.wrap(workspaceId).as('WORKSPACE_ID');
    return cy.wrap(workspaceId);
  });
});

cy.api.add('createDataSource', (options = {}) => {
  const { title, url, authType } = { ...DEFAULT_OPTIONS.datasource, ...options };

  cy.request({
    method: 'POST',
    url: '/api/saved_objects/data-source',
    headers: { 'osd-xsrf': true },
    body: {
      attributes: {
        title,
        endpoint: url,
        auth: { type: authType },
        status: { phase: 'success' },
      },
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const datasourceId = response.body.id;
    cy.wrap(datasourceId).as('DATASOURCE_ID');
    return cy.wrap(datasourceId);
  });
});

cy.api.add('addDatasourcesToWorkspace', (datasourceIds) => {
  if (!Array.isArray(datasourceIds)) {
    datasourceIds = [datasourceIds];
  }

  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    const promises = datasourceIds.map((datasourceId) => {
      return cy
        .request({
          method: 'PUT',
          url: `/api/workspaces/${workspaceId}/data-sources/${datasourceId}`,
          headers: { 'osd-xsrf': true },
        })
        .then((response) => {
          expect(response.status).to.eq(200);
        });
    });

    return cy.wrap(Promise.all(promises));
  });
});

cy.api.add('createDataset', (options) => {
  const { index, timeField } = { ...DEFAULT_OPTIONS.dataset, ...options };

  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    cy.get('@DATASOURCE_ID').then((datasourceId) => {
      cy.request({
        method: 'POST',
        url: '/api/saved_objects/index-pattern',
        headers: { 'osd-xsrf': true },
        body: {
          attributes: {
            title: index,
            timeFieldName: timeField,
            dataSource: {
              id: datasourceId,
              title: DATASOURCE_NAME,
            },
            fieldAttrs: '{}',
            fieldFormats: '{}',
            fields: '[]',
          },
          references: [
            {
              name: 'workspace',
              type: 'workspace',
              id: workspaceId,
            },
          ],
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

cy.api.add('buildDatasetQuery', (options = {}) => {
  const {
    index,
    timeFieldName = 'timestamp',
    type = 'INDEX_PATTERN',
    language = 'PPL',
    query = '',
  } = options;

  return cy.get('@DATASOURCE_ID').then((datasourceId) => {
    return `_q=(dataset:(dataSource:(id:'${datasourceId}',title:${DATASOURCE_NAME},type:OpenSearch),id:'${index}',timeFieldName:${timeFieldName},title:'${index}',type:${type}),language:${language},query:'${query}')`;
  });
});

cy.api.add('setupTestResources', (options = {}) => {
  const { index, baseDir = DEFAULT_OPTIONS.fixture.baseDir } = options;

  const mappingPath = `cypress/fixtures/${baseDir}/${index}.mapping.json`;
  const dataPath = `cypress/fixtures/${baseDir}/${index}.data.ndjson`;

  cy.osd.setupTestData(DEFAULT_OPTIONS.datasource.url, [mappingPath], [dataPath]);

  cy.api.createDataSource();
  cy.api.createWorkspace().then(() => {
    cy.get('@DATASOURCE_ID').then((datasourceId) => {
      cy.api.addDatasourcesToWorkspace(datasourceId);
      cy.api.createDataset({ index });
    });
  });
});

cy.api.add('cleanupTestResources', (options = {}) => {
  const { index } = options;

  cy.get('@WORKSPACE_ID').then((workspaceId) => {
    cy.request({
      method: 'DELETE',
      url: `/api/saved_objects/workspace/${workspaceId}?force=true`,
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
