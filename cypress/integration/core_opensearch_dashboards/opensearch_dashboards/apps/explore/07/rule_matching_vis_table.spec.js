/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { INDEX_WITH_TIME_1, DATASOURCE_NAME } from '../../../../../../utils/apps/explore/constants';
import { getRandomizedWorkspaceName } from '../../../../../../utils/apps/explore/shared';
import { prepareTestSuite } from '../../../../../../utils/helpers';

const workspaceName = getRandomizedWorkspaceName();
const datasetName = `${INDEX_WITH_TIME_1}*`;

export const runCreateVisTests = () => {
  describe('create table visualization tests', () => {
    before(() => {
      cy.osd.setupWorkspaceAndDataSourceWithIndices(workspaceName, [INDEX_WITH_TIME_1]);
      cy.explore.createWorkspaceDataSets({
        workspaceName: workspaceName,
        indexPattern: INDEX_WITH_TIME_1,
        timefieldName: 'timestamp',
        dataSource: DATASOURCE_NAME,
        isEnhancement: true,
      });
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName: workspaceName,
        page: 'explore/logs',
        isEnhancement: true,
      });
    });

    beforeEach(() => {
      cy.getElementByTestId('discoverNewButton').click();
      cy.osd.waitForLoader(true);
    });

    after(() => {
      cy.osd.cleanupWorkspaceAndDataSourceAndIndices(workspaceName, [INDEX_WITH_TIME_1]);
    });

    it('should create a table visualization using a query with multiple fields', () => {
      const query = `source=${datasetName} | stats count() by category, response_time | head 10`;
      cy.explore.createVisualizationWithQuery(query, 'table', datasetName, {
        shouldManualSelectChartType: true,
      });

      cy.get('.tableVis').should('be.visible');
    });

    it('should toggle column filter and the changes reflect immediately to the table visualization', () => {
      const query = `source=${datasetName} | stats count() by category, response_time | head 10`;
      cy.explore.createVisualizationWithQuery(query, 'table', datasetName, {
        shouldManualSelectChartType: true,
      });

      cy.get('[data-test-subj*="visTableFilterIcon"]').should('not.exist');
      cy.getElementByTestId('visTableColumnFilter').click();
      cy.get('[data-test-subj*="visTableFilterIcon"]').should('be.visible');
      cy.get('[data-test-subj*="visTableFilterIcon"]').first().click();
      cy.get('.visTableColumnHeader_filterPopover').should('be.visible');

      cy.get('.visTableColumnHeader_filterPopover').within(() => {
        cy.get('select').should('be.visible');
        cy.get('input.euiFieldText').should('be.visible');
        cy.get('button').contains('OK').should('be.visible');
        cy.get('button').contains('Cancel').should('be.visible');
        cy.get('button').contains('Clear filter').should('be.visible');
      });
    });

    it('should add threshold coloring and reflect immediately to the table visualization', () => {
      const query = `source=${datasetName} | stats count() by category | head 5`;
      cy.explore.createVisualizationWithQuery(query, 'table', datasetName, {
        shouldManualSelectChartType: true,
      });

      // Click "Add new cell type" button
      cy.getElementByTestId('visTableAddCellType').click();

      cy.getElementByTestId('visTableCellTypeField0').select(1);
      cy.getElementByTestId('visTableCellTypeMode0').select(2);

      // Click "Add threshold" button
      cy.getElementByTestId('exploreVisAddThreshold').click();

      // Verify that data grid cell has background-color style applied
      cy.get('[role="gridcell"]')
        .first()
        .should((element) => {
          const style = element[0].style;
          expect(style.backgroundColor).to.exist;
        });
    });

    it('should create data links that turn cell values into clickable links', () => {
      const query = `source=${datasetName} | stats count() by category | head 10`;
      cy.explore.createVisualizationWithQuery(query, 'table', datasetName, {
        shouldManualSelectChartType: true,
      });

      // Click "Add link" button
      cy.getElementByTestId('addDataLinkButton').click();

      cy.getElementByTestId('dataLinkTitleInput').type('test');
      cy.getElementByTestId('dataLinkAddFieldButton').click();
      cy.get('[data-test-subj*="dataLinkFieldOption"]').contains('category').click();
      cy.get('body').click(0, 0);
      cy.getElementByTestId('dataLinkUrlInput').type('https://www.google.com/');
      cy.getElementByTestId('dataLinkSaveButton').click();

      // Verify that category column cells contain clickable links
      cy.get('[role="gridcell"] a').should('exist');
    });
  });
};

prepareTestSuite('Create Table Visualization', runCreateVisTests);
