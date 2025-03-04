/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
  INDEX_PATTERN_WITH_NO_TIME_1,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  generateAllTestConfigurations,
  generateIndexPatternTestConfigurations,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { QueryLanguages } from '../../../../../../utils/apps/query_enhancements/constants';
import { selectFieldFromSidebar } from '../../../../../../utils/apps/query_enhancements/sidebar';
import { prepareTestSuite } from '../../../../../../utils/helpers';

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
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITHOUT_TIME_1,
        timefieldName: '',
        indexPatternHasTimefield: false,
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

    afterEach(() => {
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
    });

    generateAllTestConfigurations(generateTableTestConfiguration, {
      indexPattern: INDEX_PATTERN_WITH_TIME_1,
      index: INDEX_WITH_TIME_1,
    }).forEach((config) => {
      describe(`${config.testName}`, () => {
        it(`should allow expand multiple documents for ${config.testName}`, () => {
          // Setup
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);

          // If SQL, since we don't set date picker, when switching languages later it won't show any results
          // so setting dates here
          if (config.language === QueryLanguages.SQL.name) {
            cy.setQueryLanguage(QueryLanguages.PPL.name);
            setDatePickerDatesAndSearchIfRelevant(QueryLanguages.PPL.name);
            cy.wait(1000);
            cy.setQueryLanguage(QueryLanguages.SQL.name);
          } else {
            cy.setQueryLanguage(config.language);
            setDatePickerDatesAndSearchIfRelevant(config.language);
          }

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
