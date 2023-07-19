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

describe('Generating BWC test data with security', () => {
  beforeEach(() => {
    miscUtils.visitPage('app/management/opensearch-dashboards/settings');
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

  it('adds advanced settings', () => {
    miscUtils.visitPage('app/management/opensearch-dashboards/settings');
    cy.get('[data-test-subj="advancedSetting-editField-theme:darkMode"]').click();
    cy.get('[data-test-subj="advancedSetting-editField-timeline:max_buckets"]').type(
      '{selectAll}4'
    );
    cy.get('[data-test-subj="advancedSetting-editField-defaultRoute"]')
      .clear()
      .type('/app/opensearch_dashboards_overview#/');
    cy.get('[data-test-subj="advancedSetting-saveButton"]').click({ force: true });
    cy.reload();
  });

  it('adds sample data', () => {
    miscUtils.addSampleData();
  });

  it('adds filters and queries', () => {
    miscUtils.visitPage('app/dashboards#');
    cy.get('[data-test-subj="dashboardListingTitleLink-[Logs]-Web-Traffic"]').click();
    cy.get('[data-test-subj="queryInput"]').clear().type('resp=200');
    cy.get('[data-test-subj="addFilter"]').click();
    cy.get('[data-test-subj="filterFieldSuggestionList"]')
      .find('[data-test-subj="comboBoxInput"]')
      .type('machine.os{downArrow}{enter}');
    cy.get('[data-test-subj="filterOperatorList"]')
      .find('[data-test-subj="comboBoxInput"]')
      .type('{downArrow}{enter}');
    cy.get('[data-test-subj="filterParams"]')
      .find('input.euiFieldText[placeholder="Enter a value"]')
      .type('osx');
    cy.get('[data-test-subj="createCustomLabel"]').click();
    cy.get('[class="globalFilterItem__editorForm"]').find('input').last().type('osx filter');
    cy.get('[data-test-subj="saveFilter"]').click();
    cy.get('[data-test-subj="saved-query-management-popover-button"]').click();
    cy.get('[data-test-subj="saved-query-management-popover"]')
      .find('[data-test-subj="saved-query-management-save-button"]')
      .click();
    cy.get('[data-test-subj="saveQueryFormTitle"]').type('test-query');
    cy.get('[data-test-subj="savedQueryFormSaveButton"]').click();
  });

  it('adds Timeline visualization', () => {
    miscUtils.visitPage('app/visualize#');
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
    // update default expression to use `.es(*)` instead of `.opensearch(*)` for bwc
    cy.get('[class="view-line"]').type('.es(*)');
    cy.get('[data-test-subj="visualizeEditorRenderButton"]').click();
    cy.get('[data-test-subj="visualizeSaveButton"]').click();
    cy.get('[data-test-subj="savedObjectTitle"]').type('test-timeline');
    cy.get('[data-test-subj="confirmSaveSavedObjectButton"]').click();
  });
});
