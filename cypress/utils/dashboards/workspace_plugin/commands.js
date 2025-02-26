/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_API_PREFIX } from './constants';

const BASE_PATH = Cypress.config('baseUrl');

Cypress.Commands.add('deleteWorkspaceByName', (workspaceName) => {
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/_list`,
    headers: {
      'osd-xsrf': true,
    },
    body: {
      perPage: 999,
    },
  }).then((resp) => {
    if (resp && resp.body && resp.body.success) {
      resp.body.result.workspaces.map(({ name, id }) => {
        if (workspaceName === name) {
          cy.request({
            method: 'DELETE',
            url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/${id}`,
            headers: {
              'osd-xsrf': true,
            },
          });
        }
      });
    }
  });
});

Cypress.Commands.add('deleteAllWorkspaces', () => {
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/_list`,
    headers: {
      'osd-xsrf': true,
    },
    body: {},
  }).then((resp) => {
    if (resp && resp.body && resp.body.success) {
      resp.body.result.workspaces.forEach(({ id }) => {
        cy.request({
          method: 'DELETE',
          url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/${id}`,
          headers: {
            'osd-xsrf': true,
          },
        });
      });
    }
  });
});
