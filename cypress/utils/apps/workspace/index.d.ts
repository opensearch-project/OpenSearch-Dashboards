/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
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
     * Creates an index pattern within the workspace using cluster
     * It also saves the created index pattern id to the alias @INDEX_PATTERN_ID
     * @param opts - Index pattern creation options
     */
    createWorkspaceIndexPatterns(opts: {
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
      workspaceName: string;
      indexPattern: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
  }
}
