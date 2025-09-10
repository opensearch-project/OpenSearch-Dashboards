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
  generateAllTestConfigurations,
} from '../../../../../../utils/apps/explore/shared';
import {
  generateRecentQueriesTestConfiguration,
  BaseQuery,
  TestQueries,
  //TODO: QueryRegex,
} from '../../../../../../utils/apps/explore/recent_queries';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const normalizeQuery = (queryString) => {
  return queryString.replace('\n', ' ').replace(/\s+/g, ' ');
};

const workspace = getRandomizedWorkspaceName();
const runRecentQueryTests = () => {
  // TODO: Recent queries the way it is written is currently broken beause we are switching languages. we must refactor these test completely.
  describe('recent queries spec', () => {
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
        page: 'explore/logs',
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

    generateAllTestConfigurations(generateRecentQueriesTestConfiguration)
      .filter(Boolean) // removes undefined values
      .forEach((config) => {
        it(`check max queries for ${config.testName}`, () => {
          cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          const currentLang = BaseQuery[config.datasetType][config.language.name];
          const currentBaseQuery = currentLang.query;
          const currentWhereStatement = currentLang.where;
          TestQueries.forEach((query) => {
            cy.explore.clearQueryEditor();
            cy.explore.setQueryEditor(
              currentBaseQuery + config.dataset + currentWhereStatement + query,
              {},
              true
            );
          });
          cy.getElementByTestId('exploreRecentQueriesButton').click({
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
              // check table after changing dataset and returning to the dataset under test
              action: () => {
                cy.explore.setIndexAsDataset(
                  config.alternativeDataset,
                  DATASOURCE_NAME,
                  config.language.name,
                  "I don't want to use the time filter"
                );
                cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
                cy.getElementByTestId('exploreRecentQueriesButton').click({
                  force: true,
                });
              },
            },
            {
              // check table after visiting a different URL and coming back to the workspace
              action: () => {
                cy.visit('/app/workspace_initial');
                cy.osd.navigateToWorkSpaceSpecificPage({
                  workspaceName: workspace,
                  page: 'explore/logs',
                  isEnhancement: true,
                });
                cy.getElementByTestId('exploreRecentQueriesButton').click({
                  force: true,
                });
              },
            },
          ];
          steps.forEach(({ action }) => {
            action();
            cy.getElementByTestIdLike('row-').each(($row, rowIndex) => {
              const expectedQuery =
                currentBaseQuery + config.dataset + currentWhereStatement + reverseList[rowIndex];
              expect(normalizeQuery($row.text())).to.contain(expectedQuery);
            });
          });
        });

        it(`check duplicate query for ${config.testName}`, () => {
          cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
          setDatePickerDatesAndSearchIfRelevant(config.language);
          const currentLang = BaseQuery[config.datasetType][config.language.name];
          const currentBaseQuery = currentLang.query;
          const currentWhereStatement = currentLang.where;
          const testQueries = [
            currentBaseQuery + config.dataset + currentWhereStatement + ' status_code = 504', // valid
            currentBaseQuery + config.dataset + currentWhereStatement, // invalid
          ];
          testQueries.forEach((query, index) => {
            cy.explore.setQueryEditor(query, {}, true);
            cy.explore.setQueryEditor(query, {}, true);

            cy.getElementByTestId('exploreRecentQueriesButton').click({
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
