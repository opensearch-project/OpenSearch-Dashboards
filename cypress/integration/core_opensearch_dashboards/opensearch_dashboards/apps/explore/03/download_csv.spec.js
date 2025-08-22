/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import {
  INDEX_WITHOUT_TIME_1,
  INDEX_PATTERN_WITH_NO_TIME,
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';
import {
  downloadCsvAndVerify,
  getFirstRowForDownloadWithFields,
  getFirstRowTimeForSourceDownload,
  getHeadersForDownloadWithFields,
  getHeadersForSourceDownload,
  getVisibleCountForLanguage,
  toggleFieldsForCsvDownload,
} from '../../../../../../utils/apps/explore/download_csv';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';
import { PATHS } from '../../../../../../utils/constants';

describe('Download CSV', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;

      // Setup index without time
      cy.core.setupTestData(
        PATHS.ENGINE,
        `query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
        INDEX_WITHOUT_TIME_1
      );

      // Create dataset without time field
      cy.core
        .createDataset(resources.workspaceId, resources.dataSourceId, {
          dataset: {
            ...DEFAULT_OPTIONS.dataset,
            title: INDEX_PATTERN_WITH_NO_TIME,
            timeFieldName: undefined,
          },
        })
        .then((datasetId) => {
          testResources.noTimeDatasetId = datasetId;
        });

      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
      cy.core.waitForDatasetsToLoad();
    });
  });

  after(() => {
    cy.core.deleteDataset(testResources.noTimeDatasetId);
    cy.osd.deleteIndex(INDEX_WITHOUT_TIME_1);
    cy.core.cleanupTestResources(testResources);
  });

  it('should download visible rows with default fields', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // eslint-disable-next-line no-loop-func
    downloadCsvAndVerify('Visible', (csvString) => {
      const { data } = Papa.parse(csvString);
      cy.wrap(data).should('have.length', getVisibleCountForLanguage('PPL', true) + 1);
      cy.wrap(data[0]).should('deep.equal', getHeadersForSourceDownload(true));
      cy.wrap(data[1][0]).should('equal', getFirstRowTimeForSourceDownload('PPL'));
    });
  });

  it('should download visible rows with selected fields', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    toggleFieldsForCsvDownload();

    // eslint-disable-next-line no-loop-func
    downloadCsvAndVerify('Visible', (csvString) => {
      const { data } = Papa.parse(csvString);
      cy.wrap(data).should('have.length', getVisibleCountForLanguage('PPL', true) + 1);
      cy.wrap(data[0]).should('deep.equal', getHeadersForDownloadWithFields(true));
      cy.wrap(data[1]).should('deep.equal', getFirstRowForDownloadWithFields('PPL', true));
      // deselect
      toggleFieldsForCsvDownload();
    });
  });
});
