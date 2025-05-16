/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
  INDEX_PATTERN_WITH_TIME_1,
} from '../../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import { QueryLanguages } from '../../../../../../utils/apps/query_enhancements/constants';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { generateAllExploreTestConfigurations } from '../../../../../../utils/apps/explore/shared';

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
        page: 'explore',
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

    generateAllExploreTestConfigurations(generateTableTestConfiguration, {
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
  });
};

prepareTestSuite('Table', runTableTests);
