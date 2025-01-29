/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BASE_PATH } from './constants';
import { TestFixtureHandler } from '../lib/test_fixture_handler';
import initCommandNamespace from './command_namespace';

initCommandNamespace(cy, 'osd');

// This function does not delete all indices
Cypress.Commands.add('deleteAllIndices', () => {
  cy.log('Deleting all indices');
  cy.request(
    'DELETE',
    `${Cypress.env('openSearchUrl')}/index*,sample*,opensearch_dashboards*,test*,cypress*`
  );
});

// --- Typed commands --

Cypress.Commands.add('getElementByTestId', (testId, options = {}) => {
  return cy.get(`[data-test-subj="${testId}"]`, options);
});

Cypress.Commands.add('getElementByTestIdLike', (testId, options = {}) => {
  return cy.get(`[data-test-subj*="${testId}"]`, options);
});

Cypress.Commands.add('getElementsByTestIds', (testIds, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  return cy.get(selectors.join(','), options);
});

/**
 * Find element from previous chained element with a data-test-subj id containing the testId.
 * @param {string} subject DOM object to find within.
 * @param {string} testId data-test-subj value.
 * @param {object} options get options. Default: {}
 * @example
 * // returns all DOM elements that has a data-test-subj including the string 'table'
 * cy.findElementsByTestIdLike('table')
 */
Cypress.Commands.add(
  'findElementByTestIdLike',
  { prevSubject: true },
  (subject, partialTestId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj*="${partialTestId}"]`, options);
  }
);

/**
 * Find element from previous chained element by data-test-subj id.
 * @param {string} subject DOM object to find within.
 * @param {string} testId data-test-subj value.
 * @param {object} options get options. Default: {}
 */
Cypress.Commands.add(
  'findElementByTestId',
  { prevSubject: true },
  (subject, testId, options = {}) => {
    return cy.wrap(subject).find(`[data-test-subj="${testId}"]`, options);
  }
);

Cypress.Commands.add('whenTestIdNotFound', (testIds, callbackFn, options = {}) => {
  const selectors = [testIds].flat(Infinity).map((testId) => `[data-test-subj="${testId}"]`);
  cy.get('body', options).then(($body) => {
    if ($body.find(selectors.join(',')).length === 0) callbackFn();
  });
});

Cypress.Commands.add('createIndex', (index, policyID = null, settings = {}) => {
  cy.request('PUT', `${Cypress.env('openSearchUrl')}/${index}`, settings);
  if (policyID != null) {
    const body = { policy_id: policyID };

    cy.request('POST', `${Cypress.env('openSearchUrl')}${IM_API.ADD_POLICY_BASE}/${index}`, body);
  }
});

Cypress.Commands.add('deleteIndex', (indexName, options = {}) => {
  cy.request({
    method: 'DELETE',
    url: `${Cypress.env('openSearchUrl')}/${indexName}`,
    failOnStatusCode: false,
    ...options,
  });
});

Cypress.Commands.add('getIndices', (index = null, settings = {}) => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('openSearchUrl')}/_cat/indices/${index ? index : ''}`,
    failOnStatusCode: false,
    ...settings,
  });
});

// TODO: Impliment chunking
Cypress.Commands.add('bulkUploadDocs', (fixturePath, index) => {
  const sendBulkAPIRequest = (ndjson) => {
    const url = index
      ? `${Cypress.env('openSearchUrl')}/${index}/_bulk`
      : `${Cypress.env('openSearchUrl')}/_bulk`;
    cy.log('bulkUploadDocs')
      .request({
        method: 'POST',
        url,
        headers: {
          'content-type': 'application/json;charset=UTF-8',
          'osd-xsrf': true,
        },
        body: ndjson,
      })
      .then((response) => {
        if (response.body.errors) {
          console.error(response.body.items);
          throw new Error('Bulk upload failed');
        }
      });
  };

  cy.fixture(fixturePath, 'utf8').then((ndjson) => {
    sendBulkAPIRequest(ndjson);
  });

  cy.request({
    method: 'POST',
    url: `${Cypress.env('openSearchUrl')}/_all/_refresh`,
  });
});

Cypress.Commands.add('importSavedObjects', (fixturePath, overwrite = true) => {
  const sendImportRequest = (ndjson) => {
    const url = `/api/saved_objects/_import?${overwrite ? `overwrite=true` : ''}`;

    const formData = new FormData();
    formData.append('file', ndjson, 'savedObject.ndjson');

    cy.log('importSavedObject')
      .request({
        method: 'POST',
        url,
        headers: {
          'content-type': 'multipart/form-data',
          'osd-xsrf': true,
        },
        body: formData,
      })
      .then((response) => {
        if (response.body.errors) {
          console.error(response.body.items);
          throw new Error('Import failed');
        }
      });
  };

  cy.fixture(fixturePath)
    .then((file) => Cypress.Blob.binaryStringToBlob(file))
    .then((ndjson) => {
      sendImportRequest(ndjson);
    });
});

Cypress.Commands.add('deleteSavedObject', (type, id, options = {}) => {
  const url = `/api/saved_objects/${type}/${id}`;

  return cy.request({
    method: 'DELETE',
    url,
    headers: {
      'osd-xsrf': true,
    },
    failOnStatusCode: false,
    ...options,
  });
});

Cypress.Commands.add('deleteSavedObjectByType', (type, search) => {
  const searchParams = new URLSearchParams({
    fields: 'id',
    type,
  });

  if (search) {
    searchParams.set('search', search);
  }

  const url = `/api/opensearch-dashboards/management/saved_objects/_find?${searchParams.toString()}`;

  return cy.request(url).then((response) => {
    console.log('response', response);
    response.body.saved_objects.map(({ type, id }) => {
      cy.deleteSavedObject(type, id);
    });
  });
});

// TODO: we should really make this a helper function that if the data source does not exist, it creates it so take what you have for the dataset selector spec and move it here
Cypress.Commands.add('ifDataSourceExists', (search) => {
  const searchParams = new URLSearchParams({
    fields: 'id',
    type: 'data-source',
  });

  if (search) {
    searchParams.set('search', search);
  }

  const url = `/api/opensearch-dashboards/management/saved_objects/_find?${searchParams.toString()}`;

  return cy.request(url).then((response) => {
    console.log('response', response);
    return response.body.saved_objects.length > 0;
  });
});

Cypress.Commands.add('createIndexPattern', (id, attributes, header = {}) => {
  const url = `/api/saved_objects/index-pattern/${id}`;

  cy.request({
    method: 'POST',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...header,
    },
    body: JSON.stringify({
      attributes,
      references: [],
    }),
  });
});

Cypress.Commands.add('createDashboard', (attributes = {}, headers = {}) => {
  const url = '/api/saved_objects/dashboard';

  cy.request({
    method: 'POST',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...headers,
    },
    body: JSON.stringify({
      attributes,
    }),
  });
});

Cypress.Commands.add('changeDefaultTenant', (attributes, header = {}) => {
  const url = Cypress.env('openSearchUrl') + '/_plugins/_security/api/tenancy/config';

  cy.request({
    method: 'PUT',
    url,
    headers: {
      'content-type': 'application/json;charset=UTF-8',
      'osd-xsrf': true,
      ...header,
    },
    body: JSON.stringify(attributes),
  });
});

Cypress.Commands.add('deleteIndexPattern', (id, options = {}) =>
  cy.deleteSavedObject('index-pattern', id, options)
);

Cypress.Commands.add('setAdvancedSetting', (changes) => {
  const url = '/api/opensearch-dashboards/settings';
  cy.log('setAdvancedSetting')
    .request({
      method: 'POST',
      url,
      qs: Cypress.env('SECURITY_ENABLED')
        ? {
            security_tenant: CURRENT_TENANT.defaultTenant,
          }
        : {},
      headers: {
        'content-type': 'application/json;charset=UTF-8',
        'osd-xsrf': true,
      },
      body: { changes },
    })
    .then((response) => {
      if (response.body.errors) {
        console.error(response.body.items);
        throw new Error('Setting advanced setting failed');
      }
    });
});

// type: logs, ecommerce, flights
Cypress.Commands.add('loadSampleData', (type) => {
  cy.request({
    method: 'POST',
    headers: { 'osd-xsrf': 'opensearch-dashboards' },
    url: `${BASE_PATH}/api/sample_data/${type}`,
  });
});

Cypress.Commands.add('fleshTenantSettings', () => {
  if (Cypress.env('SECURITY_ENABLED')) {
    // Use xhr request is good enough to flesh tenant
    cy.request({
      url: `${BASE_PATH}/app/home?security_tenant=${CURRENT_TENANT.defaultTenant}`,
      method: 'GET',
      failOnStatusCode: false,
    });
  }
});

Cypress.Commands.add('deleteWorkspace', (workspaceName) => {
  cy.wait(3000);
  cy.getElementByTestId('workspace-detail-delete-button').should('be.visible').click();
  cy.getElementByTestId('delete-workspace-modal-body').should('be.visible');
  cy.getElementByTestId('delete-workspace-modal-input').type(workspaceName);
  cy.getElementByTestId('delete-workspace-modal-confirm').click();
  cy.contains(/successfully/);
});

cy.osd.add('createInitialWorkspaceWithDataSource', (dataSourceTitle, workspaceName) => {
  cy.intercept('POST', '/api/workspaces').as('createWorkspaceInterception');
  cy.getElementByTestId('workspace-initial-card-createWorkspace-button')
    .should('be.visible')
    .click();
  cy.getElementByTestId('workspace-initial-button-create-observability-workspace')
    .should('be.visible')
    .click();
  cy.getElementByTestId('workspaceForm-workspaceDetails-nameInputText')
    .should('be.visible')
    .type(workspaceName);
  cy.getElementByTestId('workspace-creator-dataSources-assign-button')
    .scrollIntoView()
    .should('be.visible')
    .click();
  cy.get(`.euiSelectableListItem[title="${dataSourceTitle}"]`)
    .should('be.visible')
    .trigger('click');
  cy.getElementByTestId('workspace-detail-dataSources-associateModal-save-button').click();
  cy.getElementByTestId('workspaceForm-bottomBar-createButton').should('be.visible').click();

  cy.wait('@createWorkspaceInterception').then((interception) => {
    // save the created workspace ID as an alias
    cy.wrap(interception.response.body.result.id).as('WORKSPACE_ID');
  });
  cy.contains(/successfully/);
});

cy.osd.add('openWorkspaceDashboard', (workspaceName) => {
  cy.getElementByTestId('workspace-select-button').should('exist').click();
  cy.getElementByTestId('workspace-menu-manage-button').should('exist').click();
  cy.get('.euiBasicTable')
    .find('tr')
    .filter((index, row) => {
      return Cypress.$(row).find('td').text().includes(workspaceName);
    })
    .find('a.euiLink')
    .click();
});

Cypress.Commands.add('setupTestData', (endpoint, mappingFiles, dataFiles) => {
  if (!Array.isArray(mappingFiles) || !Array.isArray(dataFiles)) {
    throw new Error('Both mappingFiles and dataFiles must be arrays');
  }

  if (mappingFiles.length !== dataFiles.length) {
    throw new Error('The number of mapping files must match the number of data files');
  }

  const handler = new TestFixtureHandler(cy, endpoint);

  let chain = cy.wrap(null);
  mappingFiles.forEach((mappingFile, index) => {
    chain = chain
      .then(() => handler.importMapping(mappingFile))
      .then(() => handler.importData(dataFiles[index]));
  });

  return chain;
});
