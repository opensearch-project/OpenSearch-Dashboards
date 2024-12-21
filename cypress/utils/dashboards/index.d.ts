/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    navigateToWorkSpaceHomePage(workspaceName: string): Chainable<any>;
    navigateToWorkSpaceSpecificPage(opts: {
      workspaceName: string;
      page: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
    createWorkspaceIndexPatterns(opts: {
      workspaceName: string;
      indexPattern: string;
      timefieldName?: string;
      indexPatternHasTimefield?: boolean;
      dataSource?: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
    deleteWorkspaceIndexPatterns(opts: {
      workspaceName: string;
      indexPattern: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
  }
}
