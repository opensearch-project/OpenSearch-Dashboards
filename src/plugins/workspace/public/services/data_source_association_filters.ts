/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { DataSourceConnection } from '../../common/types';

/**
 * Decides whether a data source connection may be offered for association with a workspace that
 * has `workspaceFeatures` (e.g. `['use-case-observability']`; undefined when unknown). Returning
 * false hides the connection from the "Associate data sources" modal. Filters only hide options:
 * the server still validates every association.
 */
export interface DataSourceAssociationFilter {
  /**
   * Saved object attributes the filter reads. They are loaded with the data sources and data
   * connections and passed in `connection.attributes`.
   */
  fields?: string[];
  isAssociable: (
    connection: DataSourceConnection,
    workspaceFeatures: string[] | undefined
  ) => boolean;
}

/** Filters registered by plugins (WorkspacePluginSetup.registerDataSourceAssociationFilter). */
export class DataSourceAssociationFilters {
  private readonly filters: DataSourceAssociationFilter[] = [];

  public register(filter: DataSourceAssociationFilter) {
    this.filters.push(filter);
  }

  /** The extra saved object attributes requested by the registered filters. */
  public getRequestedFields(): string[] {
    return [...new Set(this.filters.flatMap((filter) => filter.fields ?? []))];
  }

  /** Whether every registered filter allows the connection; a filter that throws hides it. */
  public isAssociable(connection: DataSourceConnection, workspaceFeatures: string[] | undefined) {
    return this.filters.every((filter) => {
      try {
        return filter.isAssociable(connection, workspaceFeatures) !== false;
      } catch {
        return false;
      }
    });
  }
}

/** The plugin-wide instance the association modal reads. */
export const dataSourceAssociationFilters = new DataSourceAssociationFilters();
