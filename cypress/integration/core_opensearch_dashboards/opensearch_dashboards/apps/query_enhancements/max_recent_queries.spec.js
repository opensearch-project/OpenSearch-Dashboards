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
} from '../../../../../utils/apps/query_enhancements/shared';
import { generateMaxQueriesTestConfiguration } from '../../../../../utils/apps/query_enhancements/max_recent_queries';

const workspace = getRandomizedWorkspaceName();

describe('filter for value spec', { testIsolation: true }, () => {
  const index = INDEX_PATTERN_WITH_TIME.replace('*', '');
  beforeEach(() => {
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

  afterEach(() => {
    cy.deleteWorkspaceByName(workspace);
    cy.deleteDataSourceByName(DATASOURCE_NAME);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex(INDEX_WITH_TIME_1);
  });

  generateMaxQueriesTestConfiguration().forEach((config) => {
    it(`check max queries for ${config.testName}`, () => {
      cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
      cy.setQueryLanguage(config.language);
      setDatePickerDatesAndSearchIfRelevant(config.language);
      const currentBaseQuery = config.baseQuery;
      config.testQueries.forEach((query) => {
        cy.setQueryEditor(currentBaseQuery + query, {}, true);
      });
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({
        force: true,
      });
      // only 10 of the 11 queries should be displayed
      cy.getElementByTestIdLike('row-').should('have.length', 10);
      const reverseList = [...config.testQueries].reverse();
      cy.getElementByTestIdLike('row-').each(($row, rowIndex) => {
        expect($row.text()).to.contain(currentBaseQuery + reverseList[rowIndex]);
      });
    });

    it(`check duplicate query for ${config.testName}`, () => {
      cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
      cy.setQueryLanguage(config.language);
      setDatePickerDatesAndSearchIfRelevant(config.language);
      const query = config.baseQuery + 'status_code = 504';
      cy.setQueryEditor(query, {}, true);
      cy.setQueryEditor(query, {}, true);
      cy.getElementByTestId('queryEditorFooterToggleRecentQueriesButton').click({
        force: true,
      });
      cy.contains(query).should('have.length', 1);
    });
  });
});
