/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_WITH_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
  DATASOURCE_NAME,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  generateBaseConfiguration,
  generateAllTestConfigurations,
} from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

export const runQueryTests = () => {
  describe('discover autocomplete tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.explore.createWorkspaceDataSets({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateBaseConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        it('should show correct documentation link pattern in language reference popover', () => {
          cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

          // Open the language reference popover to get the actual URL
          cy.get('body').then(($body) => {
            const isPopoverOpen = $body.find('.euiPopover__panel-isOpen').length > 0;

            // If popover is already open, close it first
            if (isPopoverOpen) {
              cy.getElementByTestId('exploreLanguageReference').click();
              // Verify it's closed
              cy.get('.euiPopover__panel-isOpen').should('not.exist');
            }

            // Now click to open
            cy.getElementByTestId('exploreLanguageReference').click();

            // Verify popover appears with title
            cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');

            cy.get('.euiPopover__panel-isOpen')
              .find('a.euiLink.euiLink--primary')
              .should('have.attr', 'href')
              .then((href) => {
                // Verify the URL follows the expected pattern for PPL syntax documentation
                expect(href).to.match(
                  /^https:\/\/opensearch\.org\/docs\/(latest|\d+\.\d+)\/search-plugins\/sql\/ppl\/syntax\/$/
                );

                // Verify the link can be opened (status 200, 301, or 302)
                cy.request({
                  url: href,
                  failOnStatusCode: false,
                }).then((response) => {
                  expect(response.status).to.be.oneOf([200]);
                });
              });
          });
        });
      });
    });
  });
};

prepareTestSuite('Queries UI', runQueryTests);
