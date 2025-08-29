/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('No Index Pattern Check', () => {
  const testResources = {};

  before(() => {
    const {
      dataSource: { endpoint },
      fixture: { dataPath },
      index,
    } = DEFAULT_OPTIONS;
    cy.core.setupTestData(endpoint, dataPath, index).then(() => {
      cy.core.createDataSource().then((dataSourceId) => {
        testResources.dataSourceId = dataSourceId;

        // Create workspace and data source but intentionally don't create index pattern
        cy.core.createWorkspace().then((workspaceId) => {
          cy.core.setUiSettings(workspaceId, {
            defaultWorkspace: workspaceId,
            defaultDataSource: dataSourceId,
          });
          testResources.workspaceId = workspaceId;
          cy.core.associateDataSourcesToWorkspace(workspaceId, [dataSourceId]);
        });
      });
    });
  });

  after(() => {
    cy.core.cleanupTestResources({
      workspaceId: testResources.workspaceId,
      dataSourceId: testResources.dataSourceId,
    });
  });

  it('should show no index pattern message', () => {
    cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
    cy.osd.waitForLoader(true);
    cy.getElementByTestId('discoverNoIndexPatterns').should('be.visible');
  });
});
