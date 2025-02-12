/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
} from '../../../../../utils/apps/constants.js';
import * as docTable from '../../../../../utils/apps/query_enhancements/doc_table.js';
import { PATHS, BASE_PATH } from '../../../../../utils/constants.js';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
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
import { prepareTestSuite } from '../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const NUMBER_OF_VISUALIZATIONS_IN_FLIGHTS_DASHBOARD = 17;

const inspectTestSuite = () => {
  describe('inspect spec', () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [`cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`],
        [`cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`]
      );

      // Add data source
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
        authType: 'no_auth',
      });
      // Create workspace
      cy.deleteAllWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });

      cy.navigateToWorkSpaceSpecificPage({
        url: BASE_PATH,
        workspaceName: workspaceName,
        page: 'discover',
        isEnhancement: true,
      });
      cy.getElementByTestId('discoverNewButton').click();
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
    });

    generateAllTestConfigurations(generateInspectTestConfiguration).forEach((config) => {
      it(`should inspect and validate the first row data for ${config.testName}`, () => {
        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
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
            docTable
              .getExpandedDocTableRowFieldValue(key)
              .should('have.text', value === null ? ' - ' : value);
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
};

prepareTestSuite('Inspect', inspectTestSuite);
