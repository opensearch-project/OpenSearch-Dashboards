/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DATASOURCE_NAME } from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const noIndexPatternTestSuite = () => {
  describe('No Index Pattern Check Test', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      cy.get('@DATASOURCE_ID').then((datasourceId) => {
        cy.osd.createWorkspaceWithDataSourceId(
          datasourceId,
          workspaceName,
          ['use-case-observability'],
          `${workspaceName}:WORKSPACE_ID`
        );
        cy.wait(2000);
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    describe('empty state', () => {
      it('no index pattern', function () {
        // Go to the Discover page
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName: workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });
        cy.osd.waitForLoader(true);
        cy.getElementByTestId('discoverNoIndexPatterns').should('be.visible');
      });
    });
  });
};

prepareTestSuite('a_check', noIndexPatternTestSuite);
