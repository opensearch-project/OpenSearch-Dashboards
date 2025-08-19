/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
import {
  INDEX_WITH_TIME_1,
  INDEX_WITHOUT_TIME_1,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('Download CSV', () => {
  let testResources = {};
  let noTimeDatasetId;

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;

      // Setup index without time
      cy.core.setupTestData(
        resources.dataSource.endpoint,
        `query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
        INDEX_WITHOUT_TIME_1
      );

      // Create dataset without time field
      cy.core
        .createDataset(resources.workspaceId, resources.dataSourceId, {
          dataset: {
            ...DEFAULT_OPTIONS.dataset,
            title: `${INDEX_WITHOUT_TIME_1}*`,
            timeFieldName: undefined,
          },
        })
        .then((datasetId) => {
          noTimeDatasetId = datasetId;
        });

      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
      cy.core.waitForDatasetsToLoad();
    });
  });

  after(() => {
    cy.core.deleteDataset(noTimeDatasetId);
    cy.osd.deleteIndex(INDEX_WITHOUT_TIME_1);
    cy.core.cleanupTestResources(testResources);
  });

  it('should download visible rows with time field', () => {
    cy.core.selectDataset(`${INDEX_WITH_TIME_1}*`);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Download CSV
    cy.getElementByTestId('shareTopNavButton').click();
    cy.getElementByTestId('downloadCsvVisible').click();

    cy.readFile('cypress/downloads/discover.csv').then((csvString) => {
      const { data } = Papa.parse(csvString);

      // Should have header + visible rows
      expect(data.length).to.be.greaterThan(1);

      // Check headers include time
      expect(data[0]).to.include('Time');
      expect(data[0]).to.include('_source');
    });
  });

  it('should download visible rows with selected fields', () => {
    cy.core.selectDataset(`${INDEX_WITH_TIME_1}*`);
    cy.explore.setTopNavDate(START_TIME, END_TIME);

    // Select specific fields
    cy.getElementByTestId('field-category').click();
    cy.getElementByTestId('field-status_code').click();
    cy.getElementByTestId('field-bytes_transferred').click();

    // Download CSV
    cy.getElementByTestId('shareTopNavButton').click();
    cy.getElementByTestId('downloadCsvVisible').click();

    cy.readFile('cypress/downloads/discover.csv').then((csvString) => {
      const { data } = Papa.parse(csvString);

      // Check headers match selected fields
      expect(data[0]).to.include('Time');
      expect(data[0]).to.include('category');
      expect(data[0]).to.include('status_code');
      expect(data[0]).to.include('bytes_transferred');
      expect(data[0]).to.not.include('_source');
    });
  });

  it('should download without time field', () => {
    cy.core.selectDataset(`${INDEX_WITHOUT_TIME_1}*`);
    cy.wait(2000);

    // Download CSV
    cy.getElementByTestId('shareTopNavButton').click();
    cy.getElementByTestId('downloadCsvVisible').click();

    cy.readFile('cypress/downloads/discover.csv').then((csvString) => {
      const { data } = Papa.parse(csvString);

      // Should not have Time column
      expect(data[0]).to.not.include('Time');
      expect(data[0]).to.include('_source');
    });
  });
});
