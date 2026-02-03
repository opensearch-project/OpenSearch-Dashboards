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
    });
  });
};

prepareTestSuite('Download CSV', runDownloadCsvTests);
