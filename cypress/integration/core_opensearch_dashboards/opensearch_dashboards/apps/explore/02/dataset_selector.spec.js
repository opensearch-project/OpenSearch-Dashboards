/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  INDEX_WITH_TIME_1,
  INDEX_WITH_TIME_2,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';
import { DEFAULT_OPTIONS } from '../../../../../../utils/commands.core';

describe('Dataset Selector', () => {
  let testResources = {};

  before(() => {
    cy.core
      .setupTestResources()
      .then((resources) => {
        testResources = resources;
        return cy.core.setupTestData(
          DEFAULT_OPTIONS.dataSource.endpoint,
          `query_enhancements/data_logs_1/${INDEX_WITH_TIME_2}.data.ndjson`,
          INDEX_WITH_TIME_2
        );
      })
      .then(() => {
        cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
        cy.osd.waitForLoader(true);
      });
  });

  after(() => {
    cy.osd.deleteIndex(INDEX_WITH_TIME_2);
    cy.core.cleanupTestResources(testResources);
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.osd.waitForLoader(true);
    cy.core.waitForDatasetsToLoad();
    cy.intercept('GET', '**/api/assistant/agent_config*', (req) => {
      req.continue((res) => {
        if (res.statusCode === 404) {
          res.send(200, { status: 'ok', data: {} });
        }
      });
    }).as('agentConfigRequest');
  });

  it('should select index pattern dataset using advanced selector', () => {
    cy.getElementByTestId('datasetSelectButton').click();
    cy.getElementByTestId('datasetSelectAdvancedButton').click();
    cy.get('[title="Index Patterns"]').click();

    cy.getElementByTestId('datasetExplorerWindow')
      .find(`[title*="${INDEX_PATTERN_WITH_TIME}"]`)
      .click({ force: true });

    cy.getElementByTestId('datasetSelectorNext').click();
    cy.getElementByTestId('advancedSelectorLanguageSelect').select('PPL');
    cy.getElementByTestId('advancedSelectorConfirmButton').click();

    cy.getElementByTestId('datasetSelectButton').should('contain.text', INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.verifyHitCount('20,000');
  });

  it('should select index dataset using advanced selector', () => {
    cy.getElementByTestId('datasetSelectButton').click();
    cy.getElementByTestId('datasetSelectAdvancedButton').click();
    cy.get('[title="Indexes"]').click();

    cy.getElementByTestId('datasetExplorerWindow').find(`[title*="ds-"]`).click({ force: true });

    cy.get(`[title="${INDEX_WITH_TIME_1}"]`).click({ force: true });

    cy.getElementByTestId('datasetSelectorNext').should('be.visible').click();
    cy.getElementByTestId('advancedSelectorLanguageSelect').should('be.visible').select('PPL');
    cy.getElementByTestId('advancedSelectorTimeFieldSelect')
      .should('be.visible')
      .select('timestamp');
    cy.getElementByTestId('advancedSelectorConfirmButton').should('be.visible').click();

    cy.getElementByTestId('datasetSelectButton').should('contain.text', INDEX_WITH_TIME_1);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.verifyHitCount('10,000');
  });

  it('should restore original state when cancelling dataset selection', () => {
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
    cy.verifyHitCount('20,000');

    cy.getElementByTestId('datasetSelectButton').click();
    cy.getElementByTestId('datasetSelectAdvancedButton').click();
    cy.get('[title="Indexes"]').click();

    cy.getElementByTestId('datasetExplorerWindow').find(`[title*="ds-"]`).click({ force: true });

    cy.get(`[title="${INDEX_WITH_TIME_2}"]`).click({ force: true });
    cy.getElementByTestId('datasetSelectorNext').click();
    cy.get('[type="button"]').contains('Cancel').click();

    cy.getElementByTestId('datasetSelectButton').should('contain.text', INDEX_PATTERN_WITH_TIME);
    cy.verifyHitCount('20,000');
  });
});
