/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    verifyTimeConfig(start: string, end: string): Chainable<any>;
    saveSearch(name: string, saveAsNew?: boolean): Chainable<any>;
    loadSaveSearch(name: string): Chainable<any>;
    verifyHitCount(count: string): Chainable<any>;
    waitForSearch(): Chainable<any>;
    prepareTest(fromTime: string, toTime: string, interval: string): Chainable<any>;
    submitQuery(query: string): Chainable<any>;
    verifyMarkCount(count: string): Chainable<any>;
    submitFilterFromDropDown(
      field: string,
      operator: string,
      value: string,
      isEnhancement?: boolean
    ): Chainable<any>;
    saveQuery(name: string, description?: string): Chainable<any>;
    loadSaveQuery(name: string): Chainable<any>;
    clearSaveQuery(): Chainable<any>;
    deleteSaveQuery(name: string): Chainable<any>;
    switchDiscoverTable(name: string): Chainable<any>;
  }
}
