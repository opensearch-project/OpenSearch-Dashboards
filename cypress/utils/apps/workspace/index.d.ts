/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
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
