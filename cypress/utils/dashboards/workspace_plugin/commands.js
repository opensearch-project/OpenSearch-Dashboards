/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { WORKSPACE_API_PREFIX } from './constants';

const BASE_PATH = Cypress.config('baseUrl');

Cypress.Commands.add('deleteWorkspaceById', (workspaceId) => {
  cy.request({
    method: 'DELETE',
    url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/${workspaceId}`,
    headers: {
      'osd-xsrf': true,
    },
  });
});

Cypress.Commands.add('deleteWorkspaceByName', (workspaceName) => {
  cy.request({
    method: 'POST',
    url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/_list`,
    headers: {
      'osd-xsrf': true,
    },
    body: {},
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

Cypress.Commands.add('createWorkspace', ({ settings, ...workspace } = {}) => {
  return cy
    .request({
      method: 'POST',
      url: `${BASE_PATH}${WORKSPACE_API_PREFIX}`,
      headers: {
        'osd-xsrf': true,
      },
      body: {
        attributes: {
          ...workspace,
          features: workspace.features || ['use-case-all'],
          description: workspace.description || 'test_description',
        },
        settings,
      },
    })
    .then((resp) => {
      if (resp && resp.body && resp.body.success) {
        return resp.body.result.id;
      } else {
        throw new Error(`Create workspace ${workspace.name} failed!`);
      }
    });
});

/**
 * Check whether the given workspace is equal to the expected workspace or not,
 * the given workspace is as exepcted when the name, description, features, and permissions are as expected.
 */
Cypress.Commands.add('checkWorkspace', (workspaceId, expected) => {
  cy.request({
    method: 'GET',
    url: `${BASE_PATH}${WORKSPACE_API_PREFIX}/${workspaceId}`,
  }).then((resp) => {
    if (resp && resp.body && resp.body.success) {
      const { name, description, features, permissions } = resp.body.result;
      if (name !== expected.name) {
        throw new Error(
          `workspace ${workspaceId} is not as expected, expected name is ${expected.name}, but is ${name}`
        );
      }
      if (description !== expected.description) {
        throw new Error(
          `workspace ${workspaceId} is not as expected, expected description is ${expected.description}, but is ${description}`
        );
      }

      if (features && expected.features) {
        const expectedFeatures = JSON.stringify(expected.features);
        const actualFeatures = JSON.stringify(features);
        if (features.length !== expected.features.length) {
          throw new Error(
            `workspace ${workspaceId} is not as expected, expected features are: ${expectedFeatures}, but are: ${actualFeatures}`
          );
        }
        expected.features.forEach((feature) => {
          if (!features.includes(feature)) {
            throw new Error(
              `workspace ${workspaceId} is not as expected because the feature ${feature} is missing, expected features are: ${expectedFeatures}, but are: ${actualFeatures}`
            );
          }
        });
      }

      if (permissions && expected.permissions) {
        const expectedPermissions = JSON.stringify(expected.permissions);
        const actualPermissions = JSON.stringify(permissions);
        if (Object.keys(permissions).length !== Object.keys(expected.permissions).length) {
          throw new Error(
            `permissions for workspace ${workspaceId} is not as expected, expected permissions are: ${expectedPermissions}, but are: ${actualPermissions}`
          );
        }

        Object.entries(permissions).forEach(([key, value]) => {
          if (!expected.permissions[key]) {
            throw new Error(
              `permissions for workspace ${workspaceId} is not as expected because the permission ${key} is missing, expected permissions are:  ${expectedPermissions}, but are ${actualPermissions}`
            );
          } else {
            if (
              expected.permissions[key].users &&
              !checkPrincipalArrayEquals(expected.permissions[key].users, value.users)
            ) {
              throw new Error(
                `permissions for workspace ${workspaceId} is not as expected, expected permissions are:  ${expectedPermissions}, but are ${actualPermissions}`
              );
            }

            if (
              expected.permissions[key].groups &&
              !checkPrincipalArrayEquals(expected.permissions[key].groups, value.groups)
            ) {
              throw new Error(
                `permissions for workspace ${workspaceId} is not as expected, expected permissions are:  ${expectedPermissions}, but are ${actualPermissions}`
              );
            }
          }
        });
      }
    } else {
      throw new Error(`cannot find workspace ${workspaceId}`);
    }
  });
});

function checkPrincipalArrayEquals(expectedPrincipals, actualPrincipals) {
  if (expectedPrincipals.length !== actualPrincipals.length) {
    return false;
  }

  expectedPrincipals.forEach((principal) => {
    if (!actualPrincipals.includes(principal)) {
      return false;
    }
  });
  return true;
}

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
