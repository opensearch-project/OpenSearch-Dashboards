/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
} from '../../../../../../utils/apps/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  generateRecentQueriesTestConfiguration,
  BaseQuery,
  TestQueries,
  //TODO: QueryRegex,
} from '../../../../../../utils/apps/query_enhancements/recent_queries';
import { prepareTestSuite } from '../../../../../../utils/helpers';
import { generateAllExploreTestConfigurations } from '../../../../../../utils/apps/explore/shared';

const workspace = getRandomizedWorkspaceName();
const runRecentQueryTests = () => {
  // TODO: refactor these tests to not navigate away so often
  describe.skip('recent queries spec', () => {
    const index = INDEX_PATTERN_WITH_TIME.replace('*', '');
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspace, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspace,
        indexPattern: index,
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspace,
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
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspace, [INDEX_WITH_TIME_1]);
    });

    generateAllExploreTestConfigurations(generateRecentQueriesTestConfiguration)
      .filter(Boolean) // removes undefined values
      .forEach((config) => {
        it(`check max queries for ${config.testName}`, () => {
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          const currentLang = BaseQuery[config.datasetType][config.language];
          const currentBaseQuery = currentLang.query;
          const currentWhereStatement = currentLang.where;
          TestQueries.forEach((query) => {
            cy.setQueryEditor(
              currentBaseQuery + config.dataset + currentWhereStatement + query,
              {},
              true
            );
          });
          cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({
            force: true,
          });
          // only 10 of the 11 queries should be displayed
          cy.getElementByTestIdLike('row-').should('have.length', 10);
          const reverseList = [...TestQueries].reverse();
          const steps = [
            {
              // only check the table
              action: () => {},
            },
            {
              // check table after changing language and returning to the language under test
              action: () => {
                cy.setQueryLanguage(config.oppositeLang);
                cy.setQueryLanguage(config.language);
                cy.wrap(null).then(() => {
                  // force Cypress to run this method in order
                  reverseList.unshift(config.defaultQuery);
                });
              },
            },
            {
              // check table after changing dataset and returning to the dataset under test
              action: () => {
                cy.setIndexAsDataset(
                  config.alternativeDataset,
                  DATASOURCE_NAME,
                  config.language,
                  "I don't want to use the time filter"
                );
                cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
                cy.wrap(null).then(() => {
                  // force Cypress to run this method in order
                  reverseList.unshift(config.defaultQuery);
                });
              },
            },
            {
              // check table after visiting a different URL and coming back to the workspace
              action: () => {
                cy.visit('/app/workspace_initial');
                cy.osd.navigateToWorkSpaceSpecificPage({
                  workspaceName: workspace,
                  page: 'explore',
                  isEnhancement: true,
                });
                cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({
                  force: true,
                });
              },
            },
          ];
          steps.forEach(({ action }, stepIndex) => {
            action();
            cy.getElementByTestIdLike('row-').each(($row, rowIndex) => {
              let expectedQuery = '';
              if (rowIndex === 1 && stepIndex >= 2) {
                expectedQuery =
                  currentBaseQuery + config.alternativeDataset + reverseList[rowIndex];
              } else if (rowIndex === 0 && stepIndex >= 1) {
                expectedQuery = currentBaseQuery + config.dataset + reverseList[rowIndex];
              } else {
                expectedQuery =
                  currentBaseQuery + config.dataset + currentWhereStatement + reverseList[rowIndex];
              }
              expect($row.text()).to.contain(expectedQuery);
            });
          });
        });

        it(`check duplicate query for ${config.testName}`, () => {
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          const currentLang = BaseQuery[config.datasetType][config.language];
          const currentBaseQuery = currentLang.query;
          const currentWhereStatement = currentLang.where;
          const testQueries = [
            currentBaseQuery + config.dataset + currentWhereStatement + ' status_code = 504', // valid
            currentBaseQuery + config.dataset + currentWhereStatement, // invalid
          ];
          testQueries.forEach((query, index) => {
            cy.setQueryEditor(query, {}, true);
            cy.setQueryEditor(query, {}, true);
            if (!index)
              // it remains expanded for the second iteration, no need to expand it again
              cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({
                force: true,
              });
            cy.getElementByTestIdLike('row-').should('have.length', index + 2);
          });
        });

        /* TODO: adding these tests requires adding a dependency OR customizing the execSync function
        //const { execSync } = require('child_process');
        //console.log(execSync('xclip -selection clipboard -o').toString().trim()); // for Linux
        //Caveat: the commands for reading the system's clipboard is OS-dependent.
        it(`check running and copying recent queries for ${config.testName}`, () => {
          cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          cy.setQueryLanguage(config.language);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          // Precondition: run some queries first
          const currentLang = BaseQuery[config.datasetType][config.language];
          const currentBaseQuery = currentLang.query + config.dataset + currentLang.where;
          const queries = [...TestQueries].splice(0, 3);
          queries.forEach((query) => {
            cy.setQueryEditor(currentBaseQuery + query, {}, true);
          });
          cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({
            force: true,
          });
          const expectedQuery = currentBaseQuery + queries[0];
          cy.getElementByTestIdLike('row-') // check query in original position
            .eq(2)
            .focus()
            .then(($row) => {
              expect($row.text()).to.include(expectedQuery);
            });
          cy.getElementByTestId('action-run').eq(2).focus().click({ force: true }); // run query again
          cy.wait(2000);
          cy.getElementByTestIdLike('row-') // check query in altered position
            .eq(0)
            .focus()
            .then(($row) => {
              expect($row.text()).to.include(expectedQuery);
            });
          cy.getElementByTestIdLike('row-') // copy another query to clipboard
            .eq(1)
            .focus()
            .then(($row) => {
              cy.get('[aria-label="Copy recent query"]').eq(1).click({ force: true });
              cy.wait(1000); // Give the clipboard some time to update
              const expectedQuery = $row.text().replace(QueryRegex[config.language], '$1');
              cy.get('[aria-label="Copy recent query"]').eq(1).focus();
              cy.task('readClipboard').then((clipboardText) => {
                expect(clipboardText).to.eq(expectedQuery);
              });
            });
        });*/
      });
  });
};

prepareTestSuite('Recent Query', runRecentQueryTests);
