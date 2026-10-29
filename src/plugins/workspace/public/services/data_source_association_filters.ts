/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import type { IWorkspaceClient } from '../../../../core/public';
import { DataSourceConnection, DataSourceConnectionType } from '../../common/types';

/**
 * A data source or data connection saved object offered for association with a workspace, as a
 * {@link DataSourceAssociationFilter} sees it.
 */
export interface DataSourceAssociationCandidate {
  /** The saved object id. */
  id: string;
  /** The saved object type. */
  savedObjectType: 'data-source' | 'data-connection';
  /**
   * The data source engine type (`data-source`) or the data connection type, i.e.
   * `attributes.type` of the saved object (`data-connection`); undefined when not set.
   */
  connectionType?: string;
  /**
   * The raw saved object values of the `fields` the registered filters requested (empty when none
   * were requested). They are not validated, so check what you read.
   */
  attributes: Readonly<Record<string, unknown>>;
}

/** The workspace a connection would be associated with, as far as it is known. */
export interface DataSourceAssociationContext {
  /**
   * The workspace's use case id (e.g. `observability`, `search`), or undefined when unknown. The
   * "Analytics" use case, which includes every feature, is `all`: a filter that allows a connection
   * only in some use cases decides on its own whether `all` is one of them.
   */
  useCaseId?: string;
  /** The workspace's feature configs as stored (e.g. `use-case-observability`), when known. */
  features?: string[];
}

/**
 * Decides whether a connection may be offered for association with a workspace. Returning false
 * hides the connection from the "Associate data sources" modal (on the workspace detail page and
 * in the workspace creator).
 *
 * Filters only hide options in the UI and are not a security control. The server checks
 * workspace permissions when associating, but it does not apply these filters; a plugin that needs
 * the rule enforced must do it server-side (e.g. in a saved objects client wrapper that rejects
 * `addToWorkspaces`), which the UI reports as a failed association.
 *
 * Only data source and data connection saved objects are filtered. Direct query connections listed
 * under an OpenSearch data source come from the data source's own API, not from saved objects, so
 * filters are not asked about them.
 *
 * Ownership convention: a filter decides which connections it governs from their saved object
 * attributes (for example a marker attribute its plugin writes). A plugin that also contributes a
 * direct query connection flow should use the same predicate as that flow's `ownsConnection`, so
 * both extension points agree.
 */
export interface DataSourceAssociationFilter {
  /** Identifies the filter in diagnostics (e.g. the plugin id). */
  id?: string;
  /**
   * Saved object attributes the filter reads. They are loaded with the data sources and data
   * connections and passed in `candidate.attributes`.
   */
  fields?: string[];
  isAssociable: (
    candidate: DataSourceAssociationCandidate,
    context: DataSourceAssociationContext
  ) => boolean;
}

const EMPTY_ATTRIBUTES: Readonly<Record<string, unknown>> = Object.freeze({});

/**
 * The filter view of a modal connection, or undefined for a connection that filters are not asked
 * about (a direct query connection of an OpenSearch data source).
 */
const toCandidate = (
  connection: DataSourceConnection
): DataSourceAssociationCandidate | undefined => {
  let savedObjectType: DataSourceAssociationCandidate['savedObjectType'];
  switch (connection.connectionType) {
    case DataSourceConnectionType.OpenSearchConnection:
      savedObjectType = 'data-source';
      break;
    case DataSourceConnectionType.DataConnection:
      savedObjectType = 'data-connection';
      break;
    default:
      return undefined;
  }
  return {
    id: connection.id,
    savedObjectType,
    connectionType: connection.type,
    attributes: connection.attributes ? { ...connection.attributes } : EMPTY_ATTRIBUTES,
  };
};

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
   * closed), and the first error of each filter is logged. Connections that filters are not asked
   * about (direct query connections of an OpenSearch data source) are always allowed.
   */
  public isAssociable(connection: DataSourceConnection, context: DataSourceAssociationContext) {
    if (!this.filters.length) {
      return true;
    }
    const candidate = toCandidate(connection);
    if (!candidate) {
      return true;
    }
    return this.filters.every((filter) => {
      try {
        return filter.isAssociable(candidate, context) !== false;
      } catch (error) {
        if (!this.warnedFilters.has(filter)) {
          this.warnedFilters.add(filter);
          const name = filter.id ? ` '${filter.id}'` : '';
          // eslint-disable-next-line no-console
          console.warn(
            `The data source association filter${name} threw; the connections it was asked about are hidden.`,
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
