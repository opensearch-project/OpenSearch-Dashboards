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
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  generateQueryTestConfigurations,
  LanguageConfigs,
} from '../../../../../../utils/apps/query_enhancements/queries';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { QueryLanguages } from '../../../../../../utils/apps/query_enhancements/constants';

const workspaceName = getRandomizedWorkspaceName();

export const runQueryTests = () => {
  describe('discover autocomplete tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
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
        page: 'discover',
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    generateQueryTestConfigurations(generateBaseConfiguration, {
      languageConfig: LanguageConfigs.SQL_PPL,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        it('should handle query editor expand/collapse state correctly', () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);

          // First check the default expanded state
          cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
          // Verify expanded state
          cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
          cy.getElementByTestId('osdQueryEditor__singleLine').should('not.exist');

          // Switch language and verify expanded state persists
          if (config.language === QueryLanguages.SQL.name) {
            cy.setQueryLanguage('PPL');
          } else {
            cy.setQueryLanguage('OpenSearch SQL');
          }
          // Verify expanded state persists
          cy.getElementByTestId('osdQueryEditor__multiLine').should('be.visible');
          cy.getElementByTestId('osdQueryEditor__singleLine').should('not.exist');

          // Switch back to the original language
          if (config.language === QueryLanguages.SQL.name) {
            cy.setQueryLanguage('OpenSearch SQL');
          } else {
            cy.setQueryLanguage('PPL');
          }

          // Collapse and verify
          cy.getElementByTestId('osdQueryEditorLanguageToggle').click(); // collapse
          cy.getElementByTestId('osdQueryEditor__multiLine').should('not.exist');
          cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');

          // Switch language and verify collapse state persists
          if (config.language === QueryLanguages.SQL.name) {
            cy.setQueryLanguage('PPL');
          } else {
            cy.setQueryLanguage('OpenSearch SQL');
          }
          cy.getElementByTestId('osdQueryEditor__multiLine').should('not.exist');
          cy.getElementByTestId('osdQueryEditor__singleLine').should('be.visible');
        });
      });
    });

    generateAllTestConfigurations(generateBaseConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        it('should show correct documentation link pattern in language reference popover', () => {
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);

          // Check language reference popover
          cy.get('body').then(($body) => {
            const isPopoverOpen = $body.find('.euiPopover__panel-isOpen').length > 0;

            // If popover is already open, close it first
            if (isPopoverOpen) {
              cy.getElementByTestId('languageReferenceButton').click();
              // Verify it's closed
              cy.get('.euiPopover__panel-isOpen').should('not.exist');
            }

            // Now click to open
            cy.getElementByTestId('languageReferenceButton').click();

            // Verify popover appears with title
            cy.get('.euiPopoverTitle').contains('Syntax options').should('be.visible');

            // Get current language first
            cy.getElementByTestId('queryEditorLanguageSelector')
              .invoke('text')
              .then((language) => {
                // Get the link and verify it follows the correct pattern
                cy.get('.euiPopover__panel-isOpen')
                  .find('a.euiLink.euiLink--primary')
                  .should('have.attr', 'href')
                  .then((href) => {
                    // Verify the URL follows the expected pattern for OpenSearch docs
                    expect(href).to.match(/^https:\/\/opensearch\.org\/docs\/(latest|\d+\.\d+)\//);

                    // Verify language-specific URL patterns
                    switch (language.trim()) {
                      case 'DQL':
                        expect(href).to.match(/\/dashboards\/dql$/);
                        break;
                      case 'Lucene':
                        expect(href).to.match(/\/query-dsl\/full-text\/query-string\/$/);
                        break;
                      case 'OpenSearch SQL':
                        expect(href).to.match(/\/search-plugins\/sql\/sql\/basic\/$/);
                        break;
                      case 'PPL':
                        expect(href).to.match(/\/search-plugins\/sql\/ppl\/syntax\/$/);
                        break;
                      default:
                        throw new Error(`Unexpected language: ${language}`);
                    }

                    // Verify the link can be opened (status 200)
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
  });
};

prepareTestSuite('Queries UI', runQueryTests);
