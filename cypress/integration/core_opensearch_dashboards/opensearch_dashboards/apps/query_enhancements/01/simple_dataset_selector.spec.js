/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_PATTERN_WITH_NO_TIME,
  INDEX_WITHOUT_TIME_1,
  START_TIME,
  END_TIME,
  PATHS,
} from '../../../../../../utils/constants';
import { verifyDiscoverPageState } from '../../../../../../utils/apps/query_enhancements/saved';
import { getDefaultQuery } from '../../../../../../utils/apps/query_enhancements/shared';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('Dataset Selector', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.core
        .setupTestData(
          PATHS.ENGINE,
          `query_enhancements/data_logs_1/${INDEX_WITHOUT_TIME_1}.data.ndjson`,
          INDEX_WITHOUT_TIME_1
        )
        .then(() => {
          const dataset = {
            ...DEFAULT_OPTIONS.dataset,
            ...{
              title: INDEX_PATTERN_WITH_NO_TIME,
              timeFieldName: undefined,
            },
          };
          cy.core
            .createDataset(resources.workspaceId, resources.dataSourceId, {
              dataset,
            })
            .then((datasetId) => {
              testResources.noTimeDatasetId = datasetId;
              cy.visit(`/w/${testResources.workspaceId}/app/discover#`);
              cy.osd.waitForLoader(true);
              cy.wait(5000);
            });
        });
    });
  });

  after(() => {
    cy.core.deleteDataset(testResources.noTimeDatasetId);
    cy.core.cleanupTestResources(testResources);
  });

  it('should select index pattern without timefield', () => {
    cy.coreQe.selectDataset(INDEX_PATTERN_WITH_NO_TIME);
    cy.osd.waitForLoader(true);
    verifyDiscoverPageState({
      dataset: INDEX_PATTERN_WITH_NO_TIME,
      queryString: getDefaultQuery(INDEX_PATTERN_WITH_NO_TIME, 'DQL'),
      language: 'DQL',
      hitCount: null,
      filters: null,
      histogram: null,
      selectFields: null,
      sampleTableData: null,
    });

    // Check for no Time column
    cy.getElementByTestId('docTableHeaderField').should('not.contain', 'Time');
  });

  it('should select index pattern with timefield for all supported query languages', () => {
    cy.coreQe.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.osd.waitForLoader(true);
    verifyDiscoverPageState({
      dataset: INDEX_PATTERN_WITH_TIME,
      queryString: getDefaultQuery(INDEX_PATTERN_WITH_TIME, 'DQL'),
      language: 'DQL',
      hitCount: null,
      filters: null,
      histogram: null,
      selectFields: null,
      sampleTableData: null,
    });
    cy.osd.setTopNavDate(START_TIME, END_TIME);
    cy.osd.waitForLoader(true);
    cy.getElementByTestId('docTableHeaderField').contains('Time');
  });

  it('should be able to search datasets', () => {
    cy.getElementByTestId('datasetSelectorButton').click({ force: true });
    cy.getElementByTestId('datasetSelectorSelectable')
      .get('[placeholder="Filter options"]')
      .clear()
      .type(INDEX_PATTERN_WITH_NO_TIME);
    cy.getElementByTestId('datasetSelectorSelectable')
      .should('be.visible')
      .get('[data-test-subj^="datasetSelectorOption-"]')
      .contains(INDEX_PATTERN_WITH_NO_TIME)
      .should('be.visible');
    cy.getElementByTestId('datasetSelectorSelectable')
      .should('be.visible')
      .get('[data-test-subj^="datasetSelectorOption-"]')
      .contains(INDEX_PATTERN_WITH_TIME)
      .should('not.exist');

    cy.getElementByTestId('datasetSelectorSelectable')
      .get('[placeholder="Filter options"]')
      .clear();
    cy.getElementByTestId('datasetSelectorSelectable')
      .should('be.visible')
      .get('[data-test-subj^="datasetSelectorOption-"]')
      .contains(INDEX_PATTERN_WITH_NO_TIME)
      .should('be.visible');
    cy.getElementByTestId('datasetSelectorSelectable')
      .should('be.visible')
      .get('[data-test-subj^="datasetSelectorOption-"]')
      .contains(INDEX_PATTERN_WITH_TIME)
      .should('be.visible');
  });
});
