/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DatasetTypes } from './constants';

export const generateSimpleDatasetSelectorTestConfigurations = (indexPatternConfigs) => {
  return indexPatternConfigs
    .map((indexPatternConfig) =>
      DatasetTypes.INDEX_PATTERN.supportedLanguages.map((language) => ({
        ...indexPatternConfig,
        language: language.name,
      }))
    )
    .flat();
};

export const validateItemsInSimpleDatasetSelectorDropDown = (searchString, noItems) => {
  cy.wait(5000);
  cy.getElementByTestId('datasetSelectButton').click({ force: true });
  cy.get('[placeholder="Search"]').clear().type(searchString);
  cy.get('[data-test-subj*="datasetSelectOption"]').should('have.length', noItems);
  cy.getElementByTestId('headerGlobalNav').click({ force: true });
  cy.get('[placeholder="Search"]').should('not.exist');
};
