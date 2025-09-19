/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('createWorkspaceWithEndpoint', (endpoint, { settings, ...workspace } = {}) => {
  cy.request({
    method: 'POST',
    url: `${endpoint}/api/workspaces`,
    headers: {
      'osd-xsrf': true,
    },
    body: {
      attributes: {
        ...workspace,
        features: workspace.features || ['use-case-observability'],
        description: workspace.description || 'test_description',
      },
      settings,
    },
  }).then((resp) => {
    if (resp && resp.body && resp.body.success) {
      return resp.body.result;
    } else {
      throw new Error(`Create workspace ${workspace.name} failed!`);
    }
  });
});

Cypress.Commands.add(
  'loadSampleDataForWorkspaceWithEndpoint',
  (endpoint, type, workspaceId, datasourceId) => {
    const retryRequest = (retries = 3) => {
      cy.request({
        method: 'POST',
        headers: { 'osd-xsrf': 'opensearch-dashboards' },
        url: `${endpoint}/w/${workspaceId}/api/sample_data/${type}?data_source_id=${encodeURIComponent(
          datasourceId || ''
        )}`,
        // Installing is easily to timeout, use larger timeout
        timeout: 60000,
        failOnStatusCode: false,
      }).then((response) => {
        if (response.status !== 200 && retries > 0) {
          const waitTime = 5000;
          cy.log(`Request failed. Waiting for ${waitTime}ms`);
          cy.wait(waitTime);
          cy.log(`Retrying... (${retries} left)`);
          retryRequest(retries - 1);
        } else if (response.status === 200) {
          cy.log(`Successfully install sample data`);
        } else {
          throw new Error('Installing sample data failed after retries');
        }
      });
    };
    retryRequest(3);
  }
);
