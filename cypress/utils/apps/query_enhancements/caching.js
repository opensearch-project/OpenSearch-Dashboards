/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

export const navigateToSelectDataAdvancedSelector = () => {
  cy.navigateToWorkSpaceSpecificPage({
    url: BASE_PATH,
    workspaceName: workspaceName,
    page: 'discover',
    isEnhancement: true,
  });

  cy.getElementByTestId('datasetSelectorButton').should('be.visible').click();
  cy.getElementByTestId(`datasetSelectorAdvancedButton`).click();
};
