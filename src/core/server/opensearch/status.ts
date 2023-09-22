/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { Observable, merge, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ServiceStatus, ServiceStatusLevels } from '../status';
import { OpenSearchStatusMeta } from './types';
import { NodesVersionCompatibility } from './version_check/ensure_opensearch_version';

export const calculateStatus$ = (
  opensearchNodesCompatibility$: Observable<NodesVersionCompatibility>
): Observable<ServiceStatus<OpenSearchStatusMeta>> =>
  merge(
    of({
      level: ServiceStatusLevels.unavailable,
      summary: `Waiting for OpenSearch`,
      meta: {
        warningNodes: [],
        incompatibleNodes: [],
      },
    }),
    opensearchNodesCompatibility$.pipe(
      map(
        ({
          isCompatible,
          message,
          incompatibleNodes,
          warningNodes,
        }): ServiceStatus<OpenSearchStatusMeta> => {
          if (!isCompatible) {
            return {
              level: ServiceStatusLevels.critical,
              summary:
                // Message should always be present, but this is a safe fallback
                message ??
                `Some OpenSearch nodes are not compatible with this version of OpenSearch Dashboards`,
              meta: { warningNodes, incompatibleNodes },
            };
          } else if (warningNodes.length > 0) {
            return {
              level: ServiceStatusLevels.available,
              summary:
                // Message should always be present, but this is a safe fallback
                message ??
                `Some OpenSearch nodes are running different versions than this version of OpenSearch Dashboards`,
              meta: { warningNodes, incompatibleNodes },
            };
          }

          return {
            level: ServiceStatusLevels.available,
            summary: (message ?? `OpenSearch is available`) || `Unknown`,
            meta: {
              warningNodes: [],
              incompatibleNodes: [],
            },
          };
        }
      )
    )
  );
