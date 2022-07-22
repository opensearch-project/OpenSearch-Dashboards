/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 */

import { Observable } from 'rxjs';
import { OpenSearchStatusMeta } from '../opensearch/types';
import { NodesVersionCompatibility } from '../opensearch/version_check/ensure_opensearch_version';
import { ServiceStatus } from '../status';
import { IDdataSourceClient } from './client/data_source_client';

/**
 * @public
 */
export interface OpenSearchDataServiceSetup {
  opensearchNodesCompatibility$: Observable<NodesVersionCompatibility>;
  status$: Observable<ServiceStatus<OpenSearchStatusMeta>>;
}

/** @internal */
export type InternalOpenSearchDataServiceSetup = OpenSearchDataServiceSetup;

/**
 * @public
 */
export interface OpenSearchDataServiceStart {
  /**
   * A pre-configured {@link IDdataSourceClient | OpenSearch client}
   *
   * @example
   * ```js
   * const client = core.opensearchDataSource.client;
   * ```
   */
  readonly client: IDdataSourceClient;
}

/**
 * @internal
 */
export type InternalOpenSearchDataServiceStart = OpenSearchDataServiceStart;
