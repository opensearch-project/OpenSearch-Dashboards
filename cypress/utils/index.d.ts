/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Call a function when an element with a test id cannot be found
     * @example
     * cy.whenTestIdNotFound(['query', 'puery'], () => {...})
     */
    whenTestIdNotFound<S = any>(
      testIds: string | string[],
      callbackFn: void,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;
    /**
     * Get elements by their test ids
     * @example
     * cy.getElementsByTestIds(['query', 'puery'])
     */
    getElementsByTestIds<S = any>(
      testIds: string | string[],
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;
    /**
     * Get an element which contains testId
     * @example
     * cy.getElementByTestIdLike('query')
     */
    getElementByTestIdLike<S = any>(
      testId: string,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;
    /**
     * Get an element by its test id
     * @example
     * cy.getElementByTestId('query')
     */
    getElementByTestId<S = any>(
      testId: string,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;

    /**
     * Find element from previous chained element with a data-test-subj id containing the testId.
     * @param {string} subject DOM object to find within.
     * @param {string} testId data-test-subj value.
     * @param {object} options get options. Default: {}
     * @example
     * // returns all DOM elements that has a data-test-subj including the string 'table'
     * cy.findElementsByTestIdLike('table')
     */
    findElementByTestIdLike<S = any>(
      partialTestId: string,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;

    /**
     * Find element from previous chained element by data-test-subj id.
     * @param {string} subject DOM object to find within.
     * @param {string} testId data-test-subj value.
     * @param {object} options get options. Default: {}
     */
    findElementByTestId<S = any>(
      testId: string,
      options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;

    /**
     * Create an index
     * @example
     * cy.createIndex('indexID')
     * cy.createIndex('indexID', 'policy')
     */
    createIndex<S = any>(index: string, policyID?: string, settings?: any): Chainable<S>;

    /**
     * Delete an index
     * @example
     * cy.deleteIndex('indexID')
     */
    deleteIndex<S = any>(index: string): Chainable<S>;

    /**
     * Bulk upload NDJSON fixture data
     * @example
     * cy.bulkUploadDocs('plugins/test/test_data.txt')
     */
    bulkUploadDocs<S = any>(
      fixturePath: string,
      index: string
      // options?: Partial<Loggable & Timeoutable & Withinable & Shadow>
    ): Chainable<S>;

    /**
     * Import saved objects
     * @example
     * cy.importSavedObject('plugins/test/exported_data.ndjson')
     */
    importSavedObjects<S = any>(fixturePath: string, overwrite?: boolean): Chainable<S>;

    /**
     * Delete a saved object
     * @example
     * cy.deleteSavedObject('index-pattern', 'id')
     */
    deleteSavedObject<S = any>(type: string, id: string): Chainable<S>;

    /**
     * Test if data source exists
     * @example
     * cy.ifDataSourceExists('data-source')
     */
    ifDataSourceExists<S = any>(search: string): Chainable<S>;

    /**
     * Delete all saved objects of a particular type
     * Optionally, narrow down the results using search
     * @example
     * cy.deleteSavedObjectByType('index-pattern')
     * cy.deleteSavedObjectByType('index-pattern', 'search string')
     */
    deleteSavedObjectByType<S = any>(type: string, search?: string): Chainable<S>;

    /**
     * Adds an index pattern
     * @example
     * cy.createIndexPattern('patterId', { title: 'patt*', timeFieldName: 'timestamp' })
     */
    createIndexPattern<S = any>(
      id: string,
      attributes: {
        title: string;
        timeFieldName?: string;
        [key: string]: any;
      },
      header: string
    ): Chainable<S>;

    /**
     * Adds a dashboard
     * @example
     * cy.createDashboard({ title: 'My dashboard'})
     */
    createDashboard<S = any>(
      attributes: {
        title: string;
        [key: string]: any;
      },
      headers?: {
        [key: string]: any;
      }
    ): Chainable<S>;

    /**
     * Changes the Default tenant for the domain.
     * @example
     * cy.changeDefaultTenant({multitenancy_enabled: true, private_tenant_enabled: true, default_tenant: tenantName, });
     */
    changeDefaultTenant<S = any>(
      attributes: {
        multitenancy_enabled: boolean;
        private_tenant_enabled: boolean;
        default_tenant: string;
      }
      // header: string,
      // default_tenant: string
    ): Chainable<S>;

    /**
     * Delete an index pattern
     * @example
     * cy.createIndexPattern('patterId')
     */
    deleteIndexPattern<S = any>(id: string): Chainable<S>;

    /**
     * Set advanced setting values
     * tip: setting the value to null set's it to its default value
     * @example
     * cy.setAdvancedSetting({ 'visualize:enableLabs' : true })
     */
    setAdvancedSetting<S = any>(changes: { [key: string]: any }): Chainable<S>;

    /**
     * Performs drag and drop action
     * @example
     * cy.get('sourceSelector').drag('targetSelector')
     */
    drag<S = any>(targetSelector: string): Chainable<S>;

    // osd namespace
    osd: {
      /**
       * Creates workspace and attaches it to the provided data source
       * It also saves the created workspace id as the alias @WORKSPACE_ID
       */
      createInitialWorkspaceWithDataSource<S = any>(
        dataSourceTitle: string,
        workspaceName: string
      ): Chainable<S>;

      /**
       * Opens workspace dashboard
       */
      openWorkspaceDashboard<S = any>(workspaceName: string): Chainable<S>;
    };
  }
}
