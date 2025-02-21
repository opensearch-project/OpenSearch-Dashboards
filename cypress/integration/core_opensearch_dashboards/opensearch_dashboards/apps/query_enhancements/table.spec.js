/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  DatasetTypes,
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
  INDEX_PATTERN_WITH_NO_TIME_1,
  PATHS,
} from '../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  generateAllTestConfigurations,
  generateIndexPatternTestConfigurations,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import { QueryLanguages } from '../../../../../utils/apps/query_enhancements/constants';
import { selectFieldFromSidebar } from '../../../../../utils/apps/query_enhancements/sidebar';
import { prepareTestSuite } from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const generateTableTestConfiguration = (dataset, datasetType, language) => {
  const baseConfig = {
    dataset,
    datasetType,
    language: language.name,
    testName: `${language.name}-${datasetType}`,
  };

  return {
    ...baseConfig,
  };
};

export const runTableTests = () => {
  describe('discover table tests', () => {
    beforeEach(() => {
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
        ]
      );
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      cy.deleteAllWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    generateAllTestConfigurations(generateTableTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        beforeEach(() => {
          if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
            cy.createWorkspaceIndexPatterns({
              workspaceName: workspaceName,
              indexPattern: INDEX_WITH_TIME_1,
              timefieldName: 'timestamp',
              dataSource: DATASOURCE_NAME,
              isEnhancement: true,
            });
          }
          cy.navigateToWorkSpaceSpecificPage({
            workspaceName: workspaceName,
            page: 'discover',
            isEnhancement: true,
          });
        });
        afterEach(() => {
          cy.osd.deleteIndex(INDEX_WITH_TIME_1);
        });

        it(`should allow expand multiple documents for ${config.testName}`, () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          // expanding a document in the table
          cy.get('[data-test-subj="docTableExpandToggleColumn"]')
            .find('[type="button"]')
            .eq(2)
            .click();

          // expanding a document in the table
          cy.get('[data-test-subj="docTableExpandToggleColumn"]')
            .find('[type="button"]')
            .eq(3)
            .click();

          // checking the number of exapnded documents visible on screen
          cy.get('[data-test-subj="tableDocViewRow-_index"]').should('have.length', 2);

          // switch query should keep expanded state
          // TODO: allow switch to other languages
          if (config.language === QueryLanguages.DQL.name) {
            cy.setQueryLanguage('Lucene');
          } else if (config.language === QueryLanguages.Lucene.name) {
            cy.setQueryLanguage('DQL');
          } else if (config.language === QueryLanguages.SQL.name) {
            cy.setQueryLanguage('PPL');
          } else {
            cy.setQueryLanguage('OpenSearch SQL');
          }
          cy.get('[data-test-subj="tableDocViewRow-_index"]').should('have.length', 2);
        });
      });
    });

    generateIndexPatternTestConfigurations(generateTableTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_NO_TIME_1,
      supportedLanguages: [QueryLanguages.DQL, QueryLanguages.Lucene],
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        beforeEach(() => {
          if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
            cy.createWorkspaceIndexPatterns({
              workspaceName: workspaceName,
              indexPattern: INDEX_WITHOUT_TIME_1,
              timefieldName: '',
              indexPatternHasTimefield: false,
              dataSource: DATASOURCE_NAME,
              isEnhancement: true,
            });
          }
          cy.navigateToWorkSpaceSpecificPage({
            workspaceName: workspaceName,
            page: 'discover',
            isEnhancement: true,
          });
        });
        afterEach(() => {
          cy.osd.deleteIndex(INDEX_WITHOUT_TIME_1);
        });
        // TODO: Currently sort is not applicable for nested field. Should include and test nested field if sort can support.
        const testFields = ['category', 'response_time'];

        it(`sort for ${config.testName}`, () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          // Add fields
          testFields.forEach((field) => {
            selectFieldFromSidebar(field);
            // Default is no sort
            cy.getElementByTestId(`docTableHeaderFieldSort_${field}`).should(
              'have.attr',
              'aria-label',
              `Sort ${field} ascending`
            );
          });
          // Sort asc
          cy.getElementByTestId(`docTableHeaderFieldSort_${testFields[0]}`).should('exist').click();
          cy.getElementByTestId('osdDocTableCellDataField')
            .eq(0)
            .should('have.text', 'Application');
          // Sort desc
          cy.getElementByTestId(`docTableHeaderFieldSort_${testFields[0]}`).should('exist').click();
          cy.getElementByTestId('osdDocTableCellDataField').eq(0).should('have.text', 'Security');
          // Sort asc on the 2nd col
          cy.getElementByTestId(`docTableHeaderFieldSort_${testFields[1]}`).should('exist').click();
          cy.getElementByTestId('osdDocTableCellDataField').eq(1).should('have.text', '0.1');
          // Sort desc on the 2nd col
          cy.getElementByTestId(`docTableHeaderFieldSort_${testFields[1]}`).should('exist').click();
          cy.getElementByTestId('osdDocTableCellDataField').eq(1).should('have.text', '5');
        });
      });
    });
  });
};

prepareTestSuite('Table', runTableTests);
