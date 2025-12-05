/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import {
  getRandomizedWorkspaceName,
  setDatePickerDatesAndSearchIfRelevant,
} from '../../../../../../utils/apps/query_enhancements/shared';
import {
  DATASOURCE_NAME,
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
  QueryLanguages,
} from '../../../../../../utils/apps/query_enhancements/constants';
import {
  downloadCsvAndVerify,
  generateDownloadCsvTestConfigurations,
  getFirstRowForDownloadWithFields,
  getFirstRowTimeForSourceDownload,
  getHeadersForDownloadWithFields,
  getHeadersForSourceDownload,
  getMaxCount,
  getVisibleCountForLanguage,
  prepareDiscoverPageForDownload,
  toggleFieldsForCsvDownload,
} from '../../../../../../utils/apps/query_enhancements/download_csv';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();

const runDownloadCsvTests = () => {
  describe('Download as CSV', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
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
      cy.clearAllSessionStorage();
      cy.clearAllLocalStorage();
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [
        INDEX_WITH_TIME_1,
        INDEX_WITHOUT_TIME_1,
      ]);
    });

    generateDownloadCsvTestConfigurations().forEach((config) => {
      it(`should be able to download Visible option with default rows for ${config.saveName}`, () => {
        prepareDiscoverPageForDownload(config, workspaceName);

        // eslint-disable-next-line no-loop-func
        downloadCsvAndVerify('Visible', (csvString) => {
          const { data } = Papa.parse(csvString);
          cy.wrap(data).should(
            'have.length',
            getVisibleCountForLanguage(config.language, config.hasTime) + 1
          );
          cy.wrap(data[0]).should('deep.equal', getHeadersForSourceDownload(config.hasTime));
          if (config.hasTime) {
            cy.wrap(data[1][0]).should('equal', getFirstRowTimeForSourceDownload(config.language));
          }
        });
      });

      it(`should be able to download Visible option with selected rows for ${config.saveName}`, () => {
        prepareDiscoverPageForDownload(config, workspaceName);

        // select some fields
        toggleFieldsForCsvDownload();

        // eslint-disable-next-line no-loop-func
        downloadCsvAndVerify('Visible', (csvString) => {
          const { data } = Papa.parse(csvString);
          cy.wrap(data).should(
            'have.length',
            getVisibleCountForLanguage(config.language, config.hasTime) + 1
          );
          cy.wrap(data[0]).should('deep.equal', getHeadersForDownloadWithFields(config.hasTime));
          cy.wrap(data[1]).should(
            'deep.equal',
            getFirstRowForDownloadWithFields(config.language, config.hasTime)
          );
        });

        // deselect the selected fields
        toggleFieldsForCsvDownload();
      });

      if ([QueryLanguages.DQL.name, QueryLanguages.Lucene.name].includes(config.language.name)) {
        it(`should be able to download Max option with default rows for ${config.saveName}`, () => {
          prepareDiscoverPageForDownload(config, workspaceName);

          downloadCsvAndVerify('Max', (csvString) => {
            const { data } = Papa.parse(csvString);
            cy.wrap(data).should('have.length', getMaxCount(config.hasTime) + 1);
            cy.wrap(data[0]).should('deep.equal', getHeadersForSourceDownload(config.hasTime));
            if (config.hasTime) {
              cy.wrap(data[1][0]).should(
                'equal',
                getFirstRowTimeForSourceDownload(config.language)
              );
            }
          });
        });

        it(`should be able to download Max option with selected rows for ${config.saveName}`, () => {
          prepareDiscoverPageForDownload(config, workspaceName);

          // select some fields
          toggleFieldsForCsvDownload();

          downloadCsvAndVerify('Max', (csvString) => {
            const { data } = Papa.parse(csvString);
            cy.wrap(data).should('have.length', getMaxCount(config.hasTime) + 1);
            cy.wrap(data[0]).should('deep.equal', getHeadersForDownloadWithFields(config.hasTime));
            if (config.hasTime) {
              cy.wrap(data[1]).should(
                'deep.equal',
                getFirstRowForDownloadWithFields(config.language, config.hasTime)
              );
            }
          });

          // deselect the selected fields
          toggleFieldsForCsvDownload();
        });
      }
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

      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'discover',
        isEnhancement: true,
      });

      cy.setIndexPatternAsDataset(config.dataset, DATASOURCE_NAME);

      cy.setQueryLanguage(language.name);
      setDatePickerDatesAndSearchIfRelevant(language.name);

      // eslint-disable-next-line no-loop-func
      downloadCsvAndVerify('Visible', (csvString) => {
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

prepareTestSuite('Download CSV', runDownloadCsvTests);
