/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  QueryLanguages,
} from '../../../../../../utils/apps/constants.js';
import * as docTable from '../../../../../../utils/apps/query_enhancements/doc_table.js';
import { BASE_PATH } from '../../../../../../utils/constants.js';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/query_enhancements/shared.js';
import {
  generateInspectTestConfiguration,
  getFlattenedFieldsWithValue,
  verifyVisualizationsWithNoInspectOption,
  verifyVisualizationsWithInspectOption,
  visualizationTitlesWithNoInspectOptions,
  visualizationTitlesWithInspectOptions,
} from '../../../../../../utils/apps/query_enhancements/inspect.js';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetId = getRandomizedDatasetId();

const NUMBER_OF_VISUALIZATIONS_IN_FLIGHTS_DASHBOARD = 17;

const inspectTestSuite = () => {
  describe('inspect spec', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetId,
        INDEX_PATTERN_WITH_TIME,
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-search'] // features
      );

      cy.osd.grabDataSourceId(workspaceName, DATASOURCE_NAME);
      cy.get(`@${workspaceName}:WORKSPACE_ID`).then((workspaceID) => {
        cy.get('@DATASOURCE_ID').then((dataSourceId) => {
          cy.request({
            method: 'POST',
            url: `${BASE_PATH}/w/${workspaceID}/api/sample_data/flights?data_source_id=${dataSourceId}`,
            headers: {
              'Content-Type': 'application/json',
              'osd-xsrf': true,
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(200);
          });
        });
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateAllTestConfigurations(generateInspectTestConfiguration).forEach((config) => {
      it(`should inspect and validate the first row data for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName: workspaceName,
          page: 'discover',
          isEnhancement: true,
        });
        cy.getElementByTestId('discoverNewButton').click();

        cy.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        cy.setQueryLanguage(config.language);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        if (config.queryString) {
          cy.setQueryEditor(config.queryString, { submit: false });
        }

        cy.intercept('POST', '**/search/*').as('docTablePostRequest');
        cy.getElementByTestId('querySubmitButton').click();

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.
        docTable.toggleDocTableRow(0);

        cy.wait('@docTablePostRequest').then((interceptedDocTableResponse) => {
          const flattenedFieldsWithValues = getFlattenedFieldsWithValue(
            interceptedDocTableResponse,
            config.language
          );

          for (const [key, value] of Object.entries(flattenedFieldsWithValues)) {
            // TODO: For SQL and PPL, this number is not accurate. https://github.com/opensearch-project/OpenSearch-Dashboards/issues/9305
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
      cy.osd.navigateToWorkSpaceSpecificPage({
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
