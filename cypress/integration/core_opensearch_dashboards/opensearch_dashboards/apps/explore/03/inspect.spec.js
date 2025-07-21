/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DATASOURCE_NAME,
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  QueryLanguages,
} from '../../../../../../utils/apps/constants.js';
import * as docTable from '../../../../../../utils/apps/explore/doc_table.js';
import { BASE_PATH } from '../../../../../../utils/constants.js';
import {
  generateAllTestConfigurations,
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/explore/shared.js';
import {
  generateInspectTestConfiguration,
  getFlattenedFieldsWithValue,
  verifyVisualizationsWithNoInspectOption,
  verifyVisualizationsWithInspectOption,
  visualizationTitlesWithNoInspectOptions,
  visualizationTitlesWithInspectOptions,
} from '../../../../../../utils/apps/explore/inspect.js';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const NUMBER_OF_VISUALIZATIONS_IN_FLIGHTS_DASHBOARD = 17;

const inspectTestSuite = () => {
  describe('inspect spec', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.createWorkspaceIndexPatterns({
        workspaceName: workspaceName,
        indexPattern: INDEX_PATTERN_WITH_TIME.replace('*', ''),
        timefieldName: 'timestamp',
        indexPatternHasTimefield: true,
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    generateAllTestConfigurations(generateInspectTestConfiguration).forEach((config) => {
      it(`should inspect and validate the first row data for ${config.testName}`, () => {
        cy.osd.navigateToWorkSpaceSpecificPage({
          workspaceName: workspaceName,
          page: 'explore/logs',
          isEnhancement: true,
        });
        cy.getElementByTestId('discoverNewButton').click();

        cy.explore.setDataset(config.dataset, DATASOURCE_NAME, config.datasetType);
        setDatePickerDatesAndSearchIfRelevant(config.language);

        cy.intercept('POST', '**/search/*').as('docTablePostRequest');
        cy.getElementByTestId('queryPanelFooterRunQueryButton').click();

        cy.getElementByTestId('docTable').get('tbody tr').should('have.length.above', 3); // To ensure it waits until a full table is loaded into the DOM, instead of a bug where table only has 1 hit.
        docTable.toggleDocTableRow(0);

        cy.wait('@docTablePostRequest').then((interceptedDocTableResponse) => {
          const flattenedFieldsWithValues = getFlattenedFieldsWithValue(
            interceptedDocTableResponse
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
        page: 'import_sample_data',
        isEnhancement: true,
      });

      // adding a wait here as sometimes the button doesn't click below
      cy.wait(3000);

      cy.getElementByTestId('addSampleDataSetflights').should('be.visible').click();

      cy.getElementByTestId('sampleDataSetInstallToast').should('exist');

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
