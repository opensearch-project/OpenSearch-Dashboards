/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import {
  INDEX_WITH_TIME_1,
  PATHS,
  DATASOURCE_NAME,
  INDEX_WITHOUT_TIME_1,
  DatasetTypes,
  QueryLanguages,
} from '../../../../../utils/constants';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../utils/apps/query_enhancements/shared';
import { prepareTestSuite } from '../../../../../utils/helpers';
import {
  downloadCsvAndVerify,
  generateExportAsCsvIndexPatternTestConfigurations,
  getFirstRowForDownloadWithFields,
  getFirstRowTimeForSourceDownload,
  getHeadersForDownloadWithFields,
  getHeadersForSourceDownload,
  getQueriedCountForLanguage,
} from '../../../../../utils/apps/query_enhancements/export_as_csv';

const workspaceName = getRandomizedWorkspaceName();

const runSavedSearchTests = () => {
  describe('Export as CSV', () => {
    beforeEach(() => {
      // Load test data
      cy.osd.setupTestData(
        PATHS.SECONDARY_ENGINE,
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.mapping.json`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.mapping.json`,
        ],
        [
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITH_TIME_1}.data.ndjson`,
          `cypress/fixtures/query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
        ]
      );

      // Add data source
      cy.osd.addDataSource({
        name: DATASOURCE_NAME,
        url: PATHS.SECONDARY_ENGINE,
      });

      // Create workspace
      cy.deleteAllWorkspaces();
      cy.visit('/app/home');
      cy.osd.createInitialWorkspaceWithDataSource(DATASOURCE_NAME, workspaceName);
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
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
        indexPatternHasTimefield: false,
      });
    });

    afterEach(() => {
      cy.deleteWorkspaceByName(workspaceName);
      cy.osd.deleteDataSourceByName(DATASOURCE_NAME);
      cy.osd.deleteIndex(INDEX_WITH_TIME_1);
      cy.osd.deleteIndex(INDEX_WITHOUT_TIME_1);
    });

    generateExportAsCsvIndexPatternTestConfigurations().forEach((config) => {
      it(`should be able to export for ${config.saveName}`, () => {
        cy.navigateToWorkSpaceSpecificPage({
          workspaceName,
          page: 'discover',
          isEnhancement: true,
        });

        if (config.datasetType === DatasetTypes.INDEX_PATTERN.name) {
          cy.setIndexPatternAsDataset(config.dataset, DATASOURCE_NAME);
        } else {
          cy.setIndexAsDataset(
            config.dataset,
            DATASOURCE_NAME,
            'PPL',
            config.hasTime ? 'timestamp' : "I don't want to use the time filter",
            'submit'
          );
        }

        for (let i = 0; i < config.languages.length; i++) {
          const language = config.languages[i];

          cy.setQueryLanguage(language.name);
          if (config.hasTime) {
            setDatePickerDatesAndSearchIfRelevant(language.name);
          }

          // For PPL, it is by default fetching 10,000 rows, which slows down the tests
          if (language.name === QueryLanguages.PPL.name) {
            cy.setQueryEditor(`source = ${config.dataset} | head 1000`, {}, true);
          }
          // Intentionally waiting for query to complete. When changing languages there is no good way to determine that the data has loaded
          cy.wait(2000);

          // eslint-disable-next-line no-loop-func
          downloadCsvAndVerify(getQueriedCountForLanguage(language), (csvString) => {
            const { data } = Papa.parse(csvString);
            cy.wrap(data).should('have.length', getQueriedCountForLanguage(language) + 1);
            cy.wrap(data[0]).should('deep.equal', getHeadersForSourceDownload(config.hasTime));
            if (config.hasTime) {
              cy.wrap(data[1][0]).should('equal', getFirstRowTimeForSourceDownload(language));
            }
          });

          // Select some fields
          cy.getElementByTestId('fieldToggle-bytes_transferred').click();
          cy.getElementByTestId('fieldToggle-personal.name').click();

          // eslint-disable-next-line no-loop-func
          downloadCsvAndVerify(getQueriedCountForLanguage(language), (csvString) => {
            const { data } = Papa.parse(csvString);
            cy.wrap(data).should('have.length', getQueriedCountForLanguage(language) + 1);
            cy.wrap(data[0]).should('deep.equal', getHeadersForDownloadWithFields(config.hasTime));
            cy.wrap(data[1]).should(
              'deep.equal',
              getFirstRowForDownloadWithFields(language, config.hasTime)
            );
          });

          // deselect the selected fields
          cy.getElementByTestId('fieldToggle-bytes_transferred').click();
          cy.getElementByTestId('fieldToggle-personal.name').click();
        }
      });
    });

    it('Should be able to export from a filtered result and have the correct number of rows', () => {
      const config = {
        dataset: `${INDEX_WITH_TIME_1}*`,
      };
      const language = QueryLanguages.DQL;
      const expectedCount = 54;

      cy.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'discover',
        isEnhancement: true,
      });

      cy.setIndexPatternAsDataset(config.dataset, DATASOURCE_NAME);

      cy.setQueryLanguage(language.name);
      setDatePickerDatesAndSearchIfRelevant(language.name);
      cy.setQueryEditor(`bytes_transferred > 9950`, {}, true);

      // eslint-disable-next-line no-loop-func
      downloadCsvAndVerify(expectedCount, (csvString) => {
        const { data } = Papa.parse(csvString);
        cy.wrap(data).should('have.length', expectedCount + 1);
      });
    });

    it('Should be able to change the number of rows setting and have it download correct amount', () => {
      const config = {
        dataset: `${INDEX_WITH_TIME_1}*`,
      };
      const language = QueryLanguages.DQL;
      const expectedCount = 95;

      cy.visit('/app/settings');
      cy.getElementByTestId('settingsSearchBar').should('be.visible').type('Number of rows');
      cy.getElementByTestId('advancedSetting-editField-discover:sampleSize')
        .clear()
        .type(expectedCount.toString())
        .type('{rightArrow}{backspace}');

      // force: true because sometimes it is hidden by a popup
      cy.getElementByTestId('advancedSetting-saveButton').click({ force: true });

      cy.getElementByTestId('advancedSetting-saveButton').should('not.exist');

      cy.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'discover',
        isEnhancement: true,
      });

      cy.setIndexPatternAsDataset(config.dataset, DATASOURCE_NAME);

      cy.setQueryLanguage(language.name);
      setDatePickerDatesAndSearchIfRelevant(language.name);

      // eslint-disable-next-line no-loop-func
      downloadCsvAndVerify(expectedCount, (csvString) => {
        const { data } = Papa.parse(csvString);
        cy.wrap(data).should('have.length', expectedCount + 1);
      });

      // cleanup
      cy.visit('/app/settings');
      cy.getElementByTestId('settingsSearchBar').should('be.visible').type('Number of rows');
      cy.getElementByTestId('advancedSetting-resetField-discover:sampleSize').click();

      // force: true because sometimes it is hidden by a popup
      cy.getElementByTestId('advancedSetting-saveButton').click({ force: true });

      cy.getElementByTestId('advancedSetting-saveButton').should('not.exist');
    });
  });
};

prepareTestSuite('Export as CSV', runSavedSearchTests);
