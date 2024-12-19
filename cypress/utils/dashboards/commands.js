/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add('selectFromDataSourceSelector', (dataSourceTitle, dataSourceId) => {
  // clean up the input field
  cy.wait(1000);
  cy.getElementByTestId('dataSourceSelectorComboBox').find('input').type(`{selectall}{backspace}`);
  cy.waitForLoader();
  cy.getElementByTestId('dataSourceSelectorComboBox').should('have.attr', 'aria-expanded', 'false');
  cy.getElementByTestId('dataSourceSelectorComboBox')
    .find(`button[data-test-subj="comboBoxToggleListButton"]`)
    .then(($element) => {
      if ($element.attr('aria-label') === 'Open list of options') {
        $element.click();
      }
    });
  cy.getElementByTestId('dataSourceSelectorComboBox').should('have.attr', 'aria-expanded', 'true');
  if (dataSourceId) {
    cy.get(`#${dataSourceId}`).should('be.visible').trigger('click');
  } else if (dataSourceTitle) {
    cy.get(`.euiFilterSelectItem[title="${dataSourceTitle}"]`)
      .should('be.visible')
      .trigger('click');
  }
  cy.waitForLoader();
});

Cypress.Commands.add(
  'selectFromDataSourceSelectorFromStandardPageHeader',
  (dataSourceTitle, dataSourceId) => {
    // clean up the input field
    cy.wait(1000);
    cy.getElementByTestId('dataSourceSelectableButton').click();
    cy.getElementByTestId('dataSourceSelectable').find('input').type(`{selectall}{backspace}`);
    cy.waitForLoader();
    if (dataSourceId) {
      cy.get(`#${dataSourceId}`).should('be.visible').trigger('click');
    } else if (dataSourceTitle) {
      cy.get(`.euiSelectableListItem[title="${dataSourceTitle}"]`)
        .should('be.visible')
        .trigger('click');
    }
    cy.waitForLoader();
  }
);

Cypress.Commands.add(
  // navigates to the workspace HomePage of a given workspace
  'navigateToWorkSpaceHomePage',
  (url, workspaceName) => {
    // Selecting the correct workspace
    cy.visit(`${url}/app/workspace_list#`);
    cy.openWorkspaceDashboard(workspaceName);
  }
);

Cypress.Commands.add(
  //navigate to workspace specific pages
  'navigateToWorkSpaceSpecificPage',
  (url, workspaceName, page) => {
    // Navigating to the WorkSpace Home Page
    cy.navigateToWorkSpaceHomePage(url, workspaceName);

    // Opening the side panel
    cy.getElementByTestId('toggleNavButton').then((ele) => {
      if (ele.length > 0) {
        ele.first().click();
      }
    });

    cy.getElementByTestId(`collapsibleNavAppLink-${page}`).click();

    cy.waitForLoader();
  }
);

Cypress.Commands.add(
  // creates an index pattern within the workspace
  // Don't use * in the indexPattern it adds it by default at the end of name
  'createWorkspaceIndexPatterns',
  (url, workspaceName, indexPattern, dataSource, timefieldName = '') => {
    // Navigate to Workspace Specific IndexPattern Page
    cy.navigateToWorkSpaceSpecificPage(url, workspaceName, 'indexPatterns');

    cy.getElementByTestId('createIndexPatternButton').click({ force: true });

    cy.get('[type="data-source"]').contains(dataSource).click();
    cy.getElementByTestId('createIndexPatternStepDataSourceNextStepButton').click();

    cy.wait(1000); // Intentional Wait

    cy.getElementByTestId('createIndexPatternNameInput').clear().type(indexPattern);
    cy.getElementByTestId('createIndexPatternGoToStep2Button').click();

    if (timefieldName !== '') {
      cy.getElementByTestId('createIndexPatternTimeFieldSelect').select(timefieldName);
    } else {
      cy.getElementByTestId('createIndexPatternTimeFieldSelect').select(
        "I don't want to use the time filter"
      );
    }
    cy.getElementByTestId('createIndexPatternButton').click();
  }
);
