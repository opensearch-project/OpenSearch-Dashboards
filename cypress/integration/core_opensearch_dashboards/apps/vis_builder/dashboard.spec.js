/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  BASE_PATH,
  VB_INDEX_PATTERN,
  VB_INDEX_ID,
  VB_DASHBOARD_ID,
  toTestId,
  VB_INDEX_DOC_COUNT,
  VB_INDEX_START_TIME,
  VB_INDEX_END_TIME,
  VB_PATH_INDEX_DATA,
  VB_PATH_SO_DATA,
  VB_LINE_VIS_TITLE,
  VB_SO_TYPE,
  VB_METRIC_VIS_TITLE,
  VB_BAR_VIS_TITLE,
} from '../../../../utils/constants';

if (Cypress.env('VISBUILDER_ENABLED')) {
  describe('Visualization Builder Dashboard Tests', () => {
    before(() => {
      cy.deleteIndex(VB_INDEX_ID);
      cy.bulkUploadDocs(VB_PATH_INDEX_DATA);

      cy.importSavedObjects(VB_PATH_SO_DATA);

      cy.visit(`${BASE_PATH}/app/dashboards#/view/${VB_DASHBOARD_ID}`);

      // Wait for page to load
      cy.waitForLoader();

      cy.setTopNavDate(VB_INDEX_START_TIME, VB_INDEX_END_TIME);
    });

    it('Should have valid visualizations', () => {
      cy.getElementByTestId(`embeddablePanelHeading-${toTestId(VB_METRIC_VIS_TITLE, '')}`)
        .should('contain.text', VB_METRIC_VIS_TITLE)
        .siblings('.embPanel__content')
        .find('.mtrVis__value')
        .should('contain.text', VB_INDEX_DOC_COUNT); // Total no of record in the sample daa
      cy.getElementByTestId(`embeddablePanelHeading-${toTestId(VB_BAR_VIS_TITLE, '')}`)
        .should('contain.text', VB_BAR_VIS_TITLE)
        .siblings('.embPanel__content')
        .find('.visLegend__valueTitle')
        .should('contain.text', `Median`);
    });

    it('Should be able to add a visualization', () => {
      // Add Vis Builder Visualisation to dashboard
      cy.getElementByTestId('dashboardEditMode').click();
      cy.getElementByTestId('dashboardAddPanelButton').click();
      cy.getElementByTestId('savedObjectFinderFilterButton').click();
      cy.getElementByTestId('savedObjectFinderFilter-visualization-visbuilder').click();
      cy.getElementByTestId(`savedObjectTitle${toTestId(VB_LINE_VIS_TITLE)}`).click();
      cy.getElementByTestId('euiFlyoutCloseButton').click();
      cy.getElementByTestId(`embeddablePanelHeading-${toTestId(VB_LINE_VIS_TITLE, '')}`).should(
        'exist'
      );

      // Cleanup
      cy.getElementByTestId('dashboardViewOnlyMode').click();
      cy.getElementByTestId('confirmModalConfirmButton').click();
    });

    it('Should be able to create a visualization', () => {
      // Create new Vis Builder Visualisation
      cy.getElementByTestId('dashboardEditMode').click();
      cy.getElementByTestId('dashboardAddNewPanelButton').click();
      cy.getElementByTestId('visType-vis-builder').click();

      // Create a metric visualisation
      cy.vbSelectDataSource(VB_INDEX_PATTERN);
      cy.vbSelectVisType('Metric');
      cy.getElementByTestId('field-age-showDetails').drag(
        '[data-test-subj=dropBoxAddField-metric]'
      );

      // Save and return
      const cleanupKey = Date.now();
      const visTitle = `VB: New Dashboard Visualization - vb${cleanupKey}`;
      cy.getElementByTestId('visBuilderSaveButton').should('not.be.disabled').click();
      cy.getElementByTestId('savedObjectTitle').type(visTitle);
      cy.getElementByTestId('confirmSaveSavedObjectButton').click();

      // Wait for page to load
      cy.waitForLoader();
      // Check to see if the new vis is present in the dashboard
      cy.getElementByTestId(`embeddablePanelHeading-${toTestId(visTitle, '')}`).should('exist');

      // Cleanup
      cy.getElementByTestId('dashboardViewOnlyMode').click();
      cy.getElementByTestId('confirmModalConfirmButton').click();
      cy.deleteSavedObjectByType(VB_SO_TYPE, `vb${cleanupKey}`);
    });

    it('Should be able to edit a visualization', { retries: { runMode: 2 } }, () => {
      // Navigate to vis builder
      cy.getElementByTestId('dashboardEditMode').click();
      cy.getElementByTestId(`embeddablePanelHeading-${toTestId(VB_METRIC_VIS_TITLE, '')}`)
        .find('[data-test-subj="embeddablePanelToggleMenuIcon"]')
        .click();
      cy.getElementByTestId('embeddablePanelAction-editPanel').click();
      cy.getElementByTestId('visualizationLoader')
        .find('.mtrVis__value')
        .should('contain.text', VB_INDEX_DOC_COUNT);

      // Edit visualization
      const newLabel = 'Editied Label';
      cy.getElementByTestId('dropBoxField-metric-0').click();
      cy.vbEditAgg([
        {
          testSubj: 'visEditorStringInput1customLabel',
          type: 'input',
          value: newLabel,
        },
      ]);

      // Save and return
      cy.getElementByTestId('visBuilderSaveAndReturnButton').click();

      cy.getElementByTestId('visBuilderLoader').should('contain.text', newLabel);
    });

    after(() => {
      cy.deleteIndex(VB_INDEX_ID);
    });
  });
}
