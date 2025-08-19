/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_PATTERN_WITH_TIME } from '../../../../../../utils/apps/explore/constants';

describe('Time Range Selection', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
      cy.core.waitForDatasetsToLoad();
      cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  it('should select time using quick select menu', () => {
    cy.setQuickSelectTime('Last', 15, 'years');
    cy.verifyHitCount('10,000');
    cy.getElementByTestId('docTableHeaderField').should('contain', 'Time');
  });

  it('should select time using relative time menu', () => {
    cy.explore.setRelativeTopNavDate(15, 'Years ago');
    cy.verifyHitCount('10,000');
    cy.getElementByTestId('discoverIntervalDateRange').should('be.visible');
  });

  it('should select time using absolute time menu', () => {
    cy.explore.setTopNavDate('Nov 29, 2021 @ 00:00:00.000', 'Dec 29, 2023 @ 00:00:00.000');
    cy.verifyHitCount('10,000');
    cy.getElementByTestId('superDatePickerShowDatesButton')
      .should('contain', 'Nov 29, 2021')
      .should('contain', 'Dec 29, 2023');
  });
});
