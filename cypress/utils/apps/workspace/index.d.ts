/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Navigates to the workspace HomePage of a given workspace
     * @param url - The base URL to navigate to
     * @param workspaceName - The name of the workspace to navigate to
     */
    navigateToWorkSpaceHomePage(url: string, workspaceName: string): Chainable<any>;

    /**
     * Navigates to workspace specific pages
     * @param opts - Navigation options
     */
    navigateToWorkSpaceSpecificPage(opts: {
      url: string;
      workspaceName: string;
      page: string;
      isEnhancement?: boolean;
    }): Chainable<any>;

    /**
     * Creates an index pattern within the workspace using cluster
     * @param opts - Index pattern creation options
     */
    createWorkspaceIndexPatterns(opts: {
      url: string;
      workspaceName: string;
      indexPattern: string;
      timefieldName: string;
      indexPatternHasTimefield?: boolean;
      dataSource?: string;
      isEnhancement?: boolean;
    }): Chainable<any>;

    /**
     * Deletes an index pattern within the workspace
     * @param opts - Index pattern deletion options
     */
    deleteWorkspaceIndexPatterns(opts: {
      url: string;
      workspaceName: string;
      indexPattern: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
  }
}
