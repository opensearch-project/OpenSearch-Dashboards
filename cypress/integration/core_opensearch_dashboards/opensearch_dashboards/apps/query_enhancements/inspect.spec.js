/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
} from '../../../../../utils/apps/constants.js';
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
  verifyVisualizationsWithNoInspectOption,
  verifyVisualizationsWithInspectOption,
  visualizationTitlesWithNoInspectOptions,
  visualizationTitlesWithInspectOptions,
} from '../../../../../utils/apps/query_enhancements/inspect.js';

const workspaceName = getRandomizedWorkspaceName();
const datasourceName = getRandomizedDatasourceName();

const NUMBER_OF_VISUALIZATIONS_IN_FLIGHTS_DASHBOARD = 17;

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
    cy.osd.createInitialWorkspaceWithDataSource(datasourceName, workspaceName);
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

        for (const [key, value] of Object.entries(flattenedFieldsWithValues)) {
          // For SQL and PPL, this number is not accurate. https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9305
          if (
            key === 'event_sequence_number' &&
            (config.language === QueryLanguages.SQL.name ||
              config.language === QueryLanguages.PPL.name)
          ) {
            cy.log(`Skipped for ${key}`);
            continue;
          }
          docTable.getExpandedDocTableRowFieldValue(key).should('have.text', value);
        }
      });
    });
  });

  it('should test visualizations inspect', () => {
    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: workspaceName,
      page: 'import_sample_data',
      isEnhancement: true,
    });

    cy.getElementByTestId('addSampleDataSetflights').click();
    cy.getElementByTestId('sampleDataSetInstallToast').should('exist');

    cy.navigateToWorkSpaceSpecificPage({
      url: BASE_PATH,
      workspaceName: workspaceName,
      page: 'dashboards',
      isEnhancement: true,
    });

    cy.getElementByTestIdLike(
      'dashboardListingTitleLink-[Flights]-Global-Flight-Dashboard'
    ).click();

    cy.getElementByTestId('visualizationLoader').should(
      'have.length',
      NUMBER_OF_VISUALIZATIONS_IN_FLIGHTS_DASHBOARD
    );

    verifyVisualizationsWithNoInspectOption(visualizationTitlesWithNoInspectOptions);
    verifyVisualizationsWithInspectOption(visualizationTitlesWithInspectOptions);
  });
});
