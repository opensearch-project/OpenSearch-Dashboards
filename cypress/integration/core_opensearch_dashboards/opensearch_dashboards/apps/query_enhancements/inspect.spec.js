/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME, INDEX_WITH_TIME_1 } from '../../../../../utils/apps/constants.js';
import * as docTable from '../../../../../utils/apps/query_enhancements/doc_table.js';
import { SECONDARY_ENGINE, BASE_PATH } from '../../../../../utils/constants.js';
import { NEW_SEARCH_BUTTON } from '../../../../../utils/dashboards/data_explorer/elements.js';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  getRandomizedDatasourceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared.js';
import {
  generateInspectTestConfiguration,
  getFlattenedFieldsWithValue,
} from '../../../../../utils/apps/query_enhancements/inspect.js';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

describe('inspect spec', () => {
  beforeEach(() => {
    // Load test data
    cy.setupTestData(
      SECONDARY_ENGINE.url,
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.mapping.json'],
      ['cypress/fixtures/query_enhancements/data_logs_1/data_logs_small_time_1.data.ndjson']
    );

    // Add data source
    cy.addDataSource({
      name: datasourceName,
      url: SECONDARY_ENGINE.url,
      authType: 'no_auth',
    });
    // Create workspace
    cy.deleteWorkspaceByName(workspaceName);
    cy.visit('/app/home');
    cy.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
    cy.wait(2000);
    cy.createWorkspaceIndexPatterns({
      workspaceName: workspaceName,
      indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
      timefieldName: 'timestamp',
      indexPatternHasTimefield: true,
      dataSource: datasourceName,
      isEnhancement: true,
    });

    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: workspaceName,
      page: 'discover',
      isEnhancement: true,
    });
    cy.getElementByTestId(NEW_SEARCH_BUTTON).click();
  });

  afterEach(() => {
    cy.deleteWorkspaceByName(workspaceName);
    cy.deleteDataSourceByName(datasourceName);
    // TODO: Modify deleteIndex to handle an array of index and remove hard code
    cy.deleteIndex(INDEX_WITH_TIME_1);
  });

  generateAllTestConfigurations(generateInspectTestConfiguration).forEach((config) => {
    it(`should inspect and validate the first row data for ${config.testName}`, () => {
      cy.setDataset(config.dataset, datasourceName, config.datasetType);
      cy.setQueryLanguage(config.language);
      setDatePickerDatesAndSearchIfRelevant(config.language);

      cy.intercept('POST', '**/search/*').as('docTablePostRequest');
      cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.
      docTable.toggleDocTableRow(0);

      cy.wait('@docTablePostRequest').then((interceptedDocTableResponse) => {
        const flattenedFieldsWithValues = getFlattenedFieldsWithValue(
          interceptedDocTableResponse,
          config.language
        );
        cy.log(flattenedFieldsWithValues);
        for (const [key, value] of Object.entries(flattenedFieldsWithValues)) {
          docTable.getExpandedDocTableRowFieldValue(key).should('have.text', value);
        }
      });
    });
  });
});
