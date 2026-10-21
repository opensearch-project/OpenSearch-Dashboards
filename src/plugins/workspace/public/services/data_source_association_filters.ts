/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IWorkspaceClient } from '../../../../core/public';
import { DataSourceConnection } from '../../common/types';

/**
 * Decides whether a data source connection may be offered for association with a workspace that
 * has `workspaceFeatures` (e.g. `['use-case-observability']`; undefined when unknown). Returning
 * false hides the connection from the "Associate data sources" modal. Filters only hide options:
 * the server still validates every association.
 *
 * Ownership convention: a filter decides which connections it governs from their saved object
 * attributes (for example a marker attribute its plugin writes). A plugin that also contributes a
 * direct query connection flow should use the same predicate as that flow's `ownsConnection`, so
 * both extension points agree.
 */
export interface DataSourceAssociationFilter {
  /**
   * Saved object attributes the filter reads. They are loaded with the data sources and data
   * connections and passed in `connection.attributes`.
   */
  fields?: string[];
  /**
   * `connection.attributes` holds the raw saved object values of the requested `fields`, so
   * validate what you read. Direct query connections listed under an OpenSearch data source come
   * from the data source's own API, not from saved objects, and have no `attributes`.
   */
  isAssociable: (
    connection: DataSourceConnection,
    workspaceFeatures: string[] | undefined
  ) => boolean;
}

/**
 * Filters registered by plugins (WorkspacePluginSetup.registerDataSourceAssociationFilter). The
 * workspace plugin owns one instance and hands it to the association modal through its workspace
 * client.
 */
export class DataSourceAssociationFilters {
  private readonly filters: DataSourceAssociationFilter[] = [];
  private readonly warnedFilters = new WeakSet<DataSourceAssociationFilter>();

  public register(filter: DataSourceAssociationFilter) {
    this.filters.push(filter);
  }

  /** The extra saved object attributes requested by the registered filters. */
  public getRequestedFields(): string[] {
    return [...new Set(this.filters.flatMap((filter) => filter.fields ?? []))];
  }

  /**
   * Whether every registered filter allows the connection. A filter that throws hides it (fail
   * closed), and the first error of each filter is logged.
   */
  public isAssociable(connection: DataSourceConnection, workspaceFeatures: string[] | undefined) {
    return this.filters.every((filter) => {
      try {
        return filter.isAssociable(connection, workspaceFeatures) !== false;
      } catch (error) {
        if (!this.warnedFilters.has(filter)) {
          this.warnedFilters.add(filter);
          // eslint-disable-next-line no-console
          console.warn(
            'A data source association filter threw; the connections it was asked about are hidden.',
            error
          );
        }
        return false;
      }
    });
  }
}

/**
 * The association filters carried by a workspace client (the workspace plugin's client exposes
 * them), or undefined for any other client.
 */
export const getDataSourceAssociationFilters = (
  workspaceClient: IWorkspaceClient | null | undefined
): DataSourceAssociationFilters | undefined => {
  const client = workspaceClient as
    | { getDataSourceAssociationFilters?: () => DataSourceAssociationFilters | undefined }
    | null
    | undefined;
  return typeof client?.getDataSourceAssociationFilters === 'function'
    ? client.getDataSourceAssociationFilters()
    : undefined;
};
