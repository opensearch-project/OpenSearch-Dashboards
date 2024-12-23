/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    navigateToWorkSpaceHomePage(url: string, workspaceName: string): Chainable<any>;
    navigateToWorkSpaceSpecificPage(opts: {
      url: string;
      workspaceName: string;
      page: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
    createWorkspaceIndexPatterns(opts: {
      url: string;
      workspaceName: string;
      indexPattern: string;
      timefieldName?: string;
      indexPatternHasTimefield?: boolean;
      dataSource?: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
    deleteWorkspaceIndexPatterns(opts: {
      url: string;
      workspaceName: string;
      indexPattern: string;
      isEnhancement?: boolean;
    }): Chainable<any>;
  }
}
