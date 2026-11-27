/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import {
  getRandomizedWorkspaceName,
  getRandomizedDatasetId,
} from '../../../../../../utils/apps/explore/shared';
import { DATASOURCE_NAME, INDEX_WITH_TIME_1 } from '../../../../../../utils/apps/explore/constants';
import {
  downloadCsvAndVerify,
  generateDownloadCsvTestConfigurations,
  getFirstRowForDownloadWithFields,
  getFirstRowTimeForSourceDownload,
  getHeadersForDownloadWithFields,
  getHeadersForSourceDownload,
  getVisibleCountForLanguage,
  prepareDiscoverPageForDownload,
  toggleFieldsForCsvDownload,
} from '../../../../../../utils/apps/explore/download_csv';
import {
  prepareTestSuite,
  createWorkspaceAndDatasetUsingEndpoint,
} from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetWithTimeId = getRandomizedDatasetId();

const runDownloadCsvTests = () => {
  describe('Download as CSV', () => {
    before(() => {
      cy.osd.setupEnvAndGetDataSource(DATASOURCE_NAME);

      // Create workspace and first dataset using our new helper function
      createWorkspaceAndDatasetUsingEndpoint(
        DATASOURCE_NAME,
        workspaceName,
        datasetWithTimeId,
        `${INDEX_WITH_TIME_1}*`, // Uses index pattern with time
        'timestamp', // timestampField
        'logs', // signalType
        ['use-case-observability'] // features
      );
    });

    afterEach(() => {
      cy.clearAllSessionStorage();
      cy.clearAllLocalStorage();
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName);
    });

    generateDownloadCsvTestConfigurations().forEach((config) => {
      it(`should be able to download Visible option with default rows for ${config.saveName}`, () => {
        prepareDiscoverPageForDownload(config, workspaceName);

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
    });

    it('should download the aggregated rows from the Statistics tab', () => {
      const config = generateDownloadCsvTestConfigurations().find(
        ({ language }) => language.name === 'PPL'
      );
      prepareDiscoverPageForDownload(config, workspaceName);

      cy.explore.setQueryEditor(`source = ${config.dataset} | stats count() by category`, {
        parseSpecialCharSequences: false,
      });
      cy.getElementByTestId('exploreTab-explore_statistics').should(
        'have.attr',
        'aria-selected',
        'true'
      );

      cy.getElementByTestId('dscDownloadCsvButton').click();
      cy.getElementByTestId('dscDownloadCsvOptionVisible').should('exist');
      cy.getElementByTestId('dscDownloadCsvOptionMax').should('not.exist');

      downloadCsvAndVerify('Visible', (csvString) => {
        const { data } = Papa.parse(csvString, { skipEmptyLines: true });
        cy.wrap(data[0]).should('deep.equal', ['count()', 'category']);
        cy.wrap(data.length).should('be.greaterThan', 1);
        cy.wrap(data[1][0]).should('match', /^\d+$/);
      });
    });
  });
};

prepareTestSuite('Download CSV', runDownloadCsvTests);
