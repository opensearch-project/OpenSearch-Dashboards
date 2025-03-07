/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

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
    cy.osd.navigateToWorkSpaceSpecificPage({
      workspaceName,
      page: 'indexPatterns',
      isEnhancement,
    });

    // There is a bug in Neo where the header of the index pattern page has the home page's header. Happens only in cypress
    // Therefore it is unreliable to leverage the "create" button to navigate to this page
    if (Cypress.env('CYPRESS_RUNTIME_ENV') === 'neo') {
      cy.get('@WORKSPACE_ID').then((workspaceId) => {
        cy.visit(`/w/${workspaceId}/app/indexPatterns/create`);
      });
    } else {
      // Navigate to Workspace Specific IndexPattern Page
      cy.osd.navigateToWorkSpaceSpecificPage({
        workspaceName,
        page: 'indexPatterns',
        isEnhancement,
      });

      // adding a wait here as sometimes the button doesn't click below
      cy.wait(2000);

      // adding a force as sometimes the button is hidden behind a popup
      cy.getElementByTestId('createIndexPatternButton').click({ force: true });
    }

    cy.osd.waitForLoader(isEnhancement);

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
    cy.osd.navigateToWorkSpaceSpecificPage({
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
