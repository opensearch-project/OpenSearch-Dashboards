/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
} from '../../../../../utils/apps/constants';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants';
import { NEW_SEARCH_BUTTON } from '../../../../../utils/dashboards/data_explorer/elements.js';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  generateAllTestConfigurations,
} from '../../../../../utils/apps/query_enhancements/shared';
import {
  generateRecentQueriesTestConfiguration,
  BaseQuery,
  TestQueries,
} from '../../../../../utils/apps/query_enhancements/recent_queries';

const workspace = getRandomizedWorkspaceName();

describe('recent queries spec', { testIsolation: true }, () => {
  const index = INDEX_PATTERN_WITH_TIME.replace('*', '');
  before(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.data.ndjson']
    );

    // Add data source
    cy.addDataSource({
      name: DATASOURCE_NAME,
      url: `${SECONDARY_ENGINE.url}`,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(workspace);
    cy.visit('/app/home');
    cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspace);
    cy.createWorkspaceIndexPatterns({
      workspaceName: workspace,
      indexPattern: index,
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: DATASOURCE_NAME,
      isEnhancement: true,
    });

    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: workspace,
      page: 'discover',
      isEnhancement: true,
    });
    cy.getElementByTestId(NEW_SEARCH_BUTTON).click();
  });

  beforeEach(() => {
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: workspace,
      page: 'discover',
      isEnhancement: true,
    });
    cy.getElementByTestId(NEW_SEARCH_BUTTON).click();
  });

  after(() => {
    cy.deleteWorkspaceByName(workspace);
    cy.deleteDataSourceByName(DATASOURCE_NAME);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex(INDEX_WITH_TIME_1);
  });

  generateAllTestConfigurations(generateRecentQueriesTestConfiguration).forEach((config) => {
    if (config.language !== 'PPL' && config.language !== 'OpenSearch SQL') return;

    it(`check max queries for ${config.testName}`, () => {
      cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
      cy.setQueryLanguage(config.language);
      setDatePickerDatesAndSearchIfRelevant(config.language);
      const currentBaseQuery = BaseQuery[config.datasetType][config.language];
      TestQueries.forEach((query) => {
        cy.setQueryEditor(currentBaseQuery + query, {}, true);
      });
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({ force: true });
      // only 10 of the 11 queries should be displayed
      cy.getElementByTestIdLike('row-').should('have.length', 10);
      const reverseList = [...TestQueries].reverse();
      cy.getElementByTestIdLike('row-').each(($row, rowIndex) => {
        expect($row.text()).to.contain(currentBaseQuery + reverseList[rowIndex]);
      });
    });

    it(`check duplicate query for ${config.testName}`, () => {
      cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
      cy.setQueryLanguage(config.language);
      setDatePickerDatesAndSearchIfRelevant(config.language);
      const query = BaseQuery[config.datasetType][config.language] + 'status_code = 504';
      cy.setQueryEditor(query, {}, true);
      cy.setQueryEditor(query, {}, true);
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({ force: true });
      cy.contains(query).should('have.length', 1);
    });

    it(`check running and copying recent queries for ${config.testName}`, () => {
      cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
      cy.setQueryLanguage(config.language);
      setDatePickerDatesAndSearchIfRelevant(config.language);
      // Precondition: run some queries first
      const currentBaseQuery = BaseQuery[config.datasetType][config.language];
      const queries = [...TestQueries].splice(0, 3);
      queries.forEach((query) => {
        cy.setQueryEditor(currentBaseQuery + query, {}, true);
      });
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({ force: true });
      const expectedQuery = currentBaseQuery + queries[0];
      cy.getElementByTestIdLike('row-')
        .eq(2)
        .focus()
        .then(($row) => {
          expect($row.text()).to.include(expectedQuery);
        });
      cy.getElementByTestId('action-run').eq(2).focus().click();
      cy.wait(2000);
      cy.getElementByTestIdLike('row-')
        .eq(0)
        .focus()
        .then(($row) => {
          expect($row.text()).to.include(expectedQuery);
        });
      cy.getElementByTestIdLike('row-')
        .eq(1)
        .focus()
        .then(($row) => {
          cy.get('[aria-label="Copy recent query"]').eq(1).click();
          cy.wait(2000); // Give the clipboard some time to update
          const queryRegex = {
            PPL: /.*?(source .*? 8000)(?:.*)/s,
            'OpenSearch SQL': /.*?(SELECT .*? 8000)(?:.*)/s,
          };
          const expectedQuery = $row.text().replace(queryRegex[config.language], '$1');
          cy.window().focus();
          cy.get('[aria-label="Copy recent query"]').eq(1).focus();
          cy.window()
            .its('navigator.clipboard')
            .then(($clip) => $clip.readText())
            .should('eq', expectedQuery);
        });
    });
  });
});
