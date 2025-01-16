/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  MiscUtils,
  LoginPage,
} from '@opensearch-dashboards-test/opensearch-dashboards-test-library';

const miscUtils = new MiscUtils(cy);
const loginPage = new LoginPage(cy);

describe('check timeline visualization', () => {
  beforeEach(() => {
    miscUtils.visitPage('app/visualize#');
    loginPage.enterUserName('admin');
    loginPage.enterPassword('admin');
    loginPage.submit();
  });

  afterEach(() => {
    cy.clearCookies();
  });

  it('tenant-switch-modal page should show and be clicked', () => {
    cy.get('[data-test-subj="tenant-switch-modal"]');
    cy.get('[data-test-subj="confirm"]').click();
  });

  it('timeline visualizations should be saved and named correctly', () => {
    cy.get('[data-test-subj="visualizationLandingPage"]')
      .find('[class="euiFormControlLayout__childrenWrapper"]')
      .type('timeline');
    cy.get('[data-test-subj="visListingTitleLink-test-timeline"]')
      .should('have.text', 'test-timeline')
      .click();
    cy.get('[class="view-line"]').contains('.es(*)');
  });

  describe('timeline visualizations should work properly', () => {
    beforeEach(() => {
      cy.get('[data-test-subj="visualizationLandingPage"]')
        .find('[data-test-subj="newItemButton"]')
        .click();
      cy.get('[data-test-subj="visType-timelion"]').click();
      // Because monaco editor doesn't use a contenteditable, input, or textarea, .clear() or .type('{selectall}') won't work. To clear, we just backspace for each character instead.
      cy.get('[class="view-line"]')
        .invoke('text')
        .then((expressionText) => {
          cy.get('[class="view-line"]').type('{backspace}'.repeat(expressionText.length));
        });
    });

    it('.es(*, kibana1=true) should report search error', () => {
      cy.get('[class="view-line"]').type('.es(*, kibana1=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .contains('Timeline request error: undefined Error: Unknown argument to es: kibana1');
    });

    it('.es(*, kibana=true) should not report search error', () => {
      cy.get('[class="view-line"]').type('.es(*, kibana=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .should('not.exist');
    });

    it('.es(*, opensearchDashboards=true) should not report search error', () => {
      cy.get('[class="view-line"]').type('.es(*, opensearchDashboards=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .should('not.exist');
    });

    it('.elasticsearch(*, kibana1=true) should report search error', () => {
      cy.get('[class="view-line"]').type('.elasticsearch(*, kibana1=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .contains('Timeline request error: undefined Error: Unknown argument to es: kibana1');
    });

    it('.elasticsearch(*, kibana=true) should not report search error', () => {
      cy.get('[class="view-line"]').type('.elasticsearch(*, kibana=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .should('not.exist');
    });

    it('.elasticsearch(*, opensearchDashboards=true) should not report search error', () => {
      cy.get('[class="view-line"]').type('.elasticsearch(*, opensearchDashboards=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .should('not.exist');
    });

    it('.opensearch(*, kibana1=true) should report search error', () => {
      cy.get('[class="view-line"]').type('.opensearch(*, kibana1=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .contains('Timeline request error: undefined Error: Unknown argument to es: kibana1');
    });

    it('.opensearch(*, kibana=true) should not report search error', () => {
      cy.get('[class="view-line"]').type('.opensearch(*, kibana=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .should('not.exist');
    });

    it('.opensearch(*, opensearchDashboards=true) should not report search error', () => {
      cy.get('[class="view-line"]').type('.opensearch(*, opensearchDashboards=true)');
      cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
      cy.waitForLoader();
      cy.get('[data-test-subj="globalToastList"]')
        .find('[data-test-subj="errorToastMessage"]')
        .should('not.exist');
    });
  });
});
