/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1 } from '../../../../../../utils/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const noIndexPatternTestSuite = () => {
  describe('No Index Pattern Check Test', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    describe('empty state', () => {
      it('no index pattern', function () {
        // Go to the Discover page
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName: workspaceName,
          page: 'explore',
          isEnhancement: true,
        });
        cy.osd.waitForLoader(true);
        cy.getElementByTestId('discoverNoIndexPatterns').should('be.visible');
      });
    });
  });
};

prepareTestSuite('a_check', noIndexPatternTestSuite);
