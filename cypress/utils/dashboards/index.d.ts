/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

declare namespace Cypress {
  interface Chainable<Subject> {
    /**
     * Selects a data source from the data source selector combo box
     * @param dataSourceTitle - The title of the data source to select
     * @param dataSourceId - The ID of the data source to select (optional)
     */
    selectFromDataSourceSelector(dataSourceTitle?: string, dataSourceId?: string): Chainable<any>;

    /**
     * Selects a data source from the standard page header's data source selector
     * @param dataSourceTitle - The title of the data source to select
     * @param dataSourceId - The ID of the data source to select (optional)
     */
    selectFromDataSourceSelectorFromStandardPageHeader(
      dataSourceTitle?: string,
      dataSourceId?: string
    ): Chainable<any>;
  }
}
