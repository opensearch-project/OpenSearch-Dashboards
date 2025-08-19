/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  INDEX_PATTERN_WITH_TIME,
  START_TIME,
  END_TIME,
} from '../../../../../../utils/apps/explore/constants';

describe('Histogram Interaction', () => {
  let testResources = {};

  before(() => {
    cy.core.setupTestResources().then((resources) => {
      testResources = resources;
      cy.visit(`/w/${testResources.workspaceId}/app/explore/logs#`);
      cy.osd.waitForLoader(true);
    });
  });

  after(() => {
    cy.core.cleanupTestResources(testResources);
  });

  beforeEach(() => {
    cy.getElementByTestId('discoverNewButton').click();
    cy.core.waitForDatasetsToLoad();
    cy.core.selectDataset(INDEX_PATTERN_WITH_TIME);
    cy.explore.setTopNavDate(START_TIME, END_TIME);
  });

  it('should show histogram for PPL queries', () => {
    cy.getElementByTestId('dscChartChartheader').should('be.visible');
    cy.getElementByTestId('discoverChart').should('be.visible');
    cy.getElementByTestId('discoverQueryHits').should('be.visible');
  });

  it('should not show histogram for SQL queries', () => {
    // Switch to SQL
    cy.getElementByTestId('datasetSelectButton').click();
    cy.getElementByTestId('datasetSelectAdvancedButton').click();
    cy.get('[title="Index Patterns"]').click();
    cy.getElementByTestId('datasetExplorerWindow')
      .find(`[title="${testResources.dataSourceTitle}::${INDEX_PATTERN_WITH_TIME}"]`)
      .click({ force: true });
    cy.getElementByTestId('datasetSelectorNext').click();
    cy.getElementByTestId('advancedSelectorLanguageSelect').select('SQL');
    cy.getElementByTestId('advancedSelectorConfirmButton').click();

    cy.explore.setTopNavDate(START_TIME, END_TIME);

    cy.getElementByTestId('dscChartChartheader').should('not.exist');
    cy.getElementByTestId('discoverChart').should('not.exist');
  });

  it('should change histogram interval', () => {
    const intervals = ['auto', 'ms', 's', 'm', 'h', 'd', 'w', 'M', 'y'];

    cy.getElementByTestId('discoverIntervalSelect').should('have.value', 'auto');

    intervals.forEach((interval) => {
      cy.getElementByTestId('discoverIntervalSelect').select(interval);
      cy.wait(1000);
      cy.getElementByTestId('discoverIntervalSelect').should('have.value', interval);
      cy.getElementByTestId('discoverIntervalDateRange').should('be.visible');
    });
  });

  it('should collapse and expand histogram', () => {
    // Verify histogram is visible
    cy.getElementByTestId('dscChartChartheader').should('be.visible');
    cy.getElementByTestId('discoverChart').should('be.visible');

    // Collapse histogram
    cy.getElementByTestId('histogramCollapseBtn').click();
    cy.getElementByTestId('dscChartChartheader').should('be.visible');
    cy.getElementByTestId('discoverChart').should('not.exist');

    // Expand histogram
    cy.getElementByTestId('histogramCollapseBtn').click();
    cy.getElementByTestId('dscChartChartheader').should('be.visible');
    cy.getElementByTestId('discoverChart').should('be.visible');
  });

  it('should update histogram with time range changes', () => {
    const specificStart = 'Jan 1, 2021 @ 13:00:00.000';
    const specificEnd = 'Oct 1, 2021 @ 13:00:00.000';

    cy.explore.setTopNavDate(specificStart, specificEnd);
    cy.wait(1000);

    cy.getElementByTestId('discoverIntervalDateRange')
      .should('be.visible')
      .should('contain', specificStart)
      .should('contain', specificEnd);

    // Expand first doc to verify timestamp
    cy.getElementByTestId('docTableExpandToggleColumn').eq(0).find('button').click({ force: true });

    cy.getElementByTestId('tableDocViewRow-timestamp-value')
      .invoke('text')
      .then((timestampText) => {
        const date = new Date(timestampText);
        const startDate = new Date(specificStart);
        const endDate = new Date(specificEnd);

        expect(date >= startDate).to.be.true;
        expect(date <= endDate).to.be.true;
      });
  });
});
