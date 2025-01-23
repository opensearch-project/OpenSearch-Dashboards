/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

Cypress.Commands.add(
  // navigates to the workspace HomePage of a given workspace
  'navigateToWorkSpaceHomePage',
  (workspaceName) => {
    // Selecting the correct workspace
    cy.visit('/app/workspace_list#');
    cy.osd.openWorkspaceDashboard(workspaceName);
    // wait until page loads
    cy.getElementByTestId('headerAppActionMenu').should('be.visible');
  }
);

Cypress.Commands.add(
  //navigate to workspace specific pages
  'navigateToWorkSpaceSpecificPage',
  (opts) => {
    const { workspaceName, page, isEnhancement = false } = opts;
    // Navigating to the WorkSpace Home Page
    cy.navigateToWorkSpaceHomePage(workspaceName);

    // Check for toggleNavButton and handle accordingly
    // If collapsibleNavShrinkButton is shown which means toggleNavButton is already clicked, try clicking the app link directly
    // Using collapsibleNavShrinkButton is more robust than using toggleNavButton due to another toggleNavButton item on discover page
    cy.get('body').then(($body) => {
      const shrinkButton = $body.find('[data-test-subj="collapsibleNavShrinkButton"]');

      if (shrinkButton.length === 0) {
        cy.get('[data-test-subj="toggleNavButton"]').filter(':visible').first().click();
      }

      cy.getElementByTestId(`collapsibleNavAppLink-${page}`).should('be.visible').click();
    });

    cy.waitForLoader(isEnhancement);
  }
);

Cypress.Commands.add(
  // Creates an index pattern within the workspace using cluster
  // Don't use * in the indexPattern it adds it by default at the end of name
  'createWorkspaceIndexPatterns',
  (opts) => {
    const {
      workspaceName,
      indexPattern,
      timefieldName,
      indexPatternHasTimefield = true,
      dataSource,
      isEnhancement = false,
    } = opts;

    cy.intercept('POST', '/w/*/api/saved_objects/index-pattern').as(
      'createIndexPatternInterception'
    );

    // Navigate to Workspace Specific IndexPattern Page
    cy.navigateToWorkSpaceSpecificPage({
      workspaceName,
      page: 'indexPatterns',
      isEnhancement,
    });
    cy.getElementByTestId('createIndexPatternButton').click();
    cy.waitForLoader(isEnhancement);

    const disableLocalCluster = !!Cypress.env('DISABLE_LOCAL_CLUSTER');

    if (dataSource) {
      if (!disableLocalCluster) {
        // When data source is provided, we automatically switch to external data source
        // First select "Use external data source connection" radio button
        // Ensure the radio is enabled and need to force click it
        // This is due to data-test-subj="createIndexPatternStepDataSourceUseDataSourceRadio") is on the parent div, not on the actual radio input element
        cy.get('input#useDataSource').should('not.be.disabled').click({ force: true });
      }

      if (disableLocalCluster) {
        // When local cluster is disabled, directly select from the list
        cy.get('.euiSelectableListItem')
          .filter((_, el) => {
            return Cypress.$(el).find('.euiSelectableListItem__text').text().trim() === dataSource;
          })
          .first()
          .click();
      } else {
        // When local cluster is enabled, use the type="data-source" selector
        cy.get('[type="data-source"]')
          .filter((_, el) => {
            return Cypress.$(el).text().trim() === dataSource;
          })
          .first()
          .click();
      }
    }

    cy.getElementByTestId('createIndexPatternStepDataSourceNextStepButton').click();

    cy.getElementByTestId('createIndexPatternNameInput')
      .should('be.visible')
      .clear()
      .type(indexPattern);
    cy.getElementByTestId('createIndexPatternGoToStep2Button').click();

    // wait for the select input if it exists
    if (indexPatternHasTimefield || timefieldName) {
      cy.getElementByTestId('createIndexPatternTimeFieldSelect').should('be.visible');
    }

    if (indexPatternHasTimefield && !!timefieldName) {
      cy.getElementByTestId('createIndexPatternTimeFieldSelect').select(timefieldName);
    } else if (indexPatternHasTimefield && !timefieldName) {
      cy.getElementByTestId('createIndexPatternTimeFieldSelect').select(
        "I don't want to use the time filter"
      );
    }

    cy.getElementByTestId('createIndexPatternButton').should('be.visible').click();

    cy.wait('@createIndexPatternInterception').then((interception) => {
      // save the created index pattern ID as an alias
      cy.wrap(interception.response.body.id).as('INDEX_PATTERN_ID');
    });

    cy.getElementByTestId('headerApplicationTitle').contains(indexPattern);
  }
);

Cypress.Commands.add(
  // deletes an index pattern within the workspace
  // Don't use * in the indexPattern it adds it by default at the end of name
  'deleteWorkspaceIndexPatterns',
  (opts) => {
    const { workspaceName, indexPattern, isEnhancement = false } = opts;

    // Navigate to Workspace Specific IndexPattern Page
    cy.navigateToWorkSpaceSpecificPage({
      workspaceName,
      page: 'indexPatterns',
      isEnhancement,
    });

    cy.contains('a', indexPattern).click();
    cy.getElementByTestId('deleteIndexPatternButton').should('be.visible').click();
    cy.getElementByTestId('confirmModalConfirmButton').should('be.visible').click();

    // wait until delete is done
    cy.getElementByTestId('headerApplicationTitle').should('be.visible');
  }
);
