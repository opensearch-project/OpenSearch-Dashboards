/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
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
     * Get an element which contains testId
     * @example
     * cy.getElementByTestIdLike('query')
     */
    getElementByTestIdLike<S = any>(
      testId: string,
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
     * Deletes a workspace
     * @example
     * cy.deleteWorkspace('workspace-name');
     */
    deleteWorkspace<S = any>(workspaceName: string): Chainable<S>;

    /**
     * Opens workspace dashboard
     */
    openWorkspaceDashboard<S = any>(workspaceName: string): Chainable<S>;

    /**
     * Sets advanced settings
     */
    setAdvancedSetting(changes: Record<string, any>): Chainable<any>;

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
       * Delete an index
       * @example
       * cy.deleteIndex('indexID')
       */
      deleteIndex<S = any>(index: string): Chainable<S>;

      /**
       * Sets up test data
       */
      setupTestData<S = any>(
        endpoint: string,
        mappingFiles: string[],
        dataFiles: string[]
      ): Chainable<S>;

      addDataSource(opts: {
        name: string;
        url: string;
        auth_type?: string;
        credentials?: { username: string; password: string };
      }): Chainable<any>;

      deleteDataSourceByName(dataSourceName: string): Chainable<any>;

      deleteAllDataSources(): Chainable<any>;

      /**
       * Navigates to the workspace HomePage of a given workspace
       * @param workspaceName - The name of the workspace to navigate to
       */
      navigateToWorkSpaceHomePage(workspaceName: string): Chainable<any>;

      /**
       * Navigates to workspace specific pages
       * @param opts - Navigation options
       */
      navigateToWorkSpaceSpecificPage(opts: {
        workspaceName: string;
        page: string;
        isEnhancement?: boolean;
      }): Chainable<any>;

      /**
       * Wait for Dashboards page to load
       * @example
       * cy.osd.waitForLoader()
       */
      waitForLoader(isEnhancement?: boolean): Chainable<any>;

      /**
       * Grabs the dataSourceId in non-OSD environments and saves it in the alias @DATASOURCE_ID
       */
      grabDataSourceId(workspaceName: string, dataSourceName: string): Chainable<any>;

      /**
       * Deletes all workspaces that are older than a specified amount. This is to prevent ws buildup
       */
      deleteAllOldWorkspaces(): Chainable<any>;
    };
  }
}
