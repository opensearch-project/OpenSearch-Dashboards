/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/* eslint-disable */
import { MiscUtils } from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
  
describe('check timeline visualization', () => {
    beforeEach(() => {
        miscUtils.visitPage('app/visualize#');
    });
    
    it('timeline visualizations should be saved and named correctly', () => {
        cy.get('[data-test-subj="visualizationLandingPage"]')
          .find('[class="euiFormControlLayout__childrenWrapper"]')
          .type('timeline');        
        cy.get('[data-test-subj="visListingTitleLink-test-timeline"]').should('have.text', 'test-timeline').click();
        cy.get('[class="view-line"]').contains('.es(*)');
    });

    describe('timeline visualizations should work properly', () => {
        beforeEach(() => {
           cy.get('[data-test-subj="visualizationLandingPage"]')
             .find('[data-test-subj="newItemButton"]')
             .click();     
           cy.get('[data-test-subj="visType-timelion"]').click();
         });

         it('.es(*, kibana1=true) should report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}, kibana1=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').contains('Timeline request error: undefined Error: Unknown argument to es: kibana1')
         });

         it('.es(*, kibana=true) should not report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}, kibana=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').should('not.exist')
         });

         it('.es(*, opensearchDashboards=true) should not report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}, opensearchDashboards=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').should('not.exist')
         });  
         
         it('.elasticsearch(*, kibana1=true) should report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}{backspace}{backspace}{backspace}{backspace}elasticsearch(*, kibana1=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').contains('Timeline request error: undefined Error: Unknown argument to es: kibana1')
         });

         it('.elasticsearch(*, kibana=true) should not report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}{backspace}{backspace}{backspace}{backspace}elasticsearch(*, kibana=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').should('not.exist')
         });

         it('.elasticsearch(*, opensearchDashboards=true) should not report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}{backspace}{backspace}{backspace}{backspace}elasticsearch(*, opensearchDashboards=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').should('not.exist')
         });

         it('.opensearch(*, kibana1=true) should report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}{backspace}{backspace}{backspace}{backspace}opensearch(*, kibana1=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').contains('Timeline request error: undefined Error: Unknown argument to es: kibana1')
         });

         it('.opensearch(*, kibana=true) should not report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}{backspace}{backspace}{backspace}{backspace}opensearch(*, kibana=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').should('not.exist')
         });

         it('.opensearch(*, opensearchDashboards=true) should not report search error', () => {
            cy.get('[class="view-line"]').type('{selectall}{backspace}{backspace}{backspace}{backspace}{backspace}opensearch(*, opensearchDashboards=true)');
            cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
            cy.get('[data-test-subj="globalToastList"]').find('[data-test-subj="errorToastMessage"]').should('not.exist')
         });                 
    });
});      