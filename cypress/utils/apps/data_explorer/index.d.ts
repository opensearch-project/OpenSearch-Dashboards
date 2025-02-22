/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    saveSearch(name: string, saveAsNew?: boolean): Chainable<any>;
    loadSaveSearch(name: string): Chainable<any>;
    verifyHitCount(count: string): Chainable<any>;
    waitForSearch(): Chainable<any>;
    submitFilterFromDropDown(
      field: string,
      operator: string,
      value: string,
      isEnhancement?: boolean
    ): Chainable<any>;
    /**
     * Deletes all filters in a Search.
     */
    deleteAllFilters(): void;
    /**
     * Save a query.
     * @param name - Name of the query
     * @param description - Description of the query
     * @param includeFilters - Save filters
     * @param includeTimeFilter - Save Time filter
     */
    saveQuery(
      name: string,
      description?: string,
      includeFilters?: boolean,
      includeTimeFilter?: boolean
    ): Chainable<any>;
    /**
     * Update a saved query.
     * @param name - Name of saved query if saved as new query.
     * @param saveAsNewQuery - Save as a new query.
     * @param includeFilters - Save filters.
     * @param includeTimeFilter - Save Time filter.
     */
    updateSavedQuery(
      name: string,
      saveAsNewQuery: boolean,
      includeFilters?: boolean,
      includeTimeFilter?: boolean
    ): void;
    /**
     * Load a saved query.
     * @param name - Name of saved query.
     */
    loadSavedQuery(name: string): Chainable<any>;
    clearSavedQuery(): Chainable<any>;
    deleteSavedQuery(name: string): Chainable<any>;
  }
}
