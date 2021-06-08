/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
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

/*
 * Modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/**
 * OpenSearch and OpenSearch Dashboards versions are locked, so OpenSearch Dashboards should require that OpenSearch has the same version as
 * that defined in OpenSearch Dashboards's package.json.
 */

import { timer, of, from, Observable } from 'rxjs';
import { map, distinctUntilChanged, catchError, exhaustMap, mergeMap } from 'rxjs/operators';
import { get, forEach } from 'lodash';
import {
  opensearchVersionCompatibleWithOpenSearchDashboards,
  opensearchVersionEqualsOpenSearchDashboards,
} from './opensearch_opensearch_dashboards_version_compatability';
import { Logger } from '../../logging';
import type { OpenSearchClient } from '../client';

export const getNodeId = async (internalClient: OpenSearchClient): Promise<string | null> => {
  try {
    const state = await internalClient.cluster.state({
      filter_path: ['nodes.*.attributes.cluster_id'],
    });
    // Aggregate different cluster_ids from the OpenSearch nodes
    const clusterIdSet = new Set();
    let defaultClusterId = 0;

    // if attributes.cluster_id is missing, assign the monotonically increasing default cluster_id for each node
    forEach(state.body.nodes, (node: any) => {
      clusterIdSet.add(get(node, 'attributes.cluster_id', defaultClusterId++));
    });

    /* if all the nodes have the same cluster_id, retrieve nodes.info from _local node only
     * Using _cluster/state/nodes to retrieve the cluster_id of each node from master node which is considered to be a lightweight operation
     * else if the nodes have different cluster_ids then fan out the request to all nodes
     * else there are no nodes in the cluster
     */
    const nodeId = clusterIdSet.size === 1 ? '_local' : null;
    return nodeId;
  } catch (e) {
    return null;
  }
};

export interface PollOpenSearchNodesVersionOptions {
  internalClient: OpenSearchClient;
  optimizedHealthcheck: boolean;
  log: Logger;
  opensearchDashboardsVersion: string;
  ignoreVersionMismatch: boolean;
  opensearchVersionCheckInterval: number;
}

interface NodeInfo {
  version: string;
  ip: string;
  http: {
    publish_address: string;
  };
  name: string;
}

export interface NodesInfo {
  nodes: {
    [key: string]: NodeInfo;
  };
}

export interface NodesVersionCompatibility {
  isCompatible: boolean;
  message?: string;
  incompatibleNodes: NodeInfo[];
  warningNodes: NodeInfo[];
  opensearchDashboardsVersion: string;
}

function getHumanizedNodeName(node: NodeInfo) {
  const publishAddress = node?.http?.publish_address + ' ' || '';
  return 'v' + node.version + ' @ ' + publishAddress + '(' + node.ip + ')';
}

export function mapNodesVersionCompatibility(
  nodesInfo: NodesInfo,
  opensearchDashboardsVersion: string,
  ignoreVersionMismatch: boolean
): NodesVersionCompatibility {
  if (Object.keys(nodesInfo.nodes ?? {}).length === 0) {
    return {
      isCompatible: false,
      message: 'Unable to retrieve version information from OpenSearch nodes.',
      incompatibleNodes: [],
      warningNodes: [],
      opensearchDashboardsVersion,
    };
  }
  const nodes = Object.keys(nodesInfo.nodes)
    .sort() // Sorting ensures a stable node ordering for comparison
    .map((key) => nodesInfo.nodes[key])
    .map((node) => Object.assign({}, node, { name: getHumanizedNodeName(node) }));

  // Aggregate incompatible OpenSearch nodes.
  const incompatibleNodes = nodes.filter(
    (node) =>
      !opensearchVersionCompatibleWithOpenSearchDashboards(
        node.version,
        opensearchDashboardsVersion
      )
  );

  // Aggregate OpenSearch nodes which should prompt a OpenSearch Dashboards upgrade. It's acceptable
  // if OpenSearch and OpenSearch Dashboards versions are not the same as long as they are not
  // incompatible, but we should warn about it.
  // Ignore version qualifiers https://github.com/elastic/elasticsearch/issues/36859
  const warningNodes = nodes.filter(
    (node) =>
      !opensearchVersionEqualsOpenSearchDashboards(node.version, opensearchDashboardsVersion)
  );

  // Note: If incompatible and warning nodes are present `message` only contains
  // an incompatibility notice.
  let message;
  if (incompatibleNodes.length > 0) {
    const incompatibleNodeNames = incompatibleNodes.map((node) => node.name).join(', ');
    if (ignoreVersionMismatch) {
      message = `Ignoring version incompatibility between OpenSearch Dashboards v${opensearchDashboardsVersion} and the following OpenSearch nodes: ${incompatibleNodeNames}`;
    } else {
      message = `This version of OpenSearch Dashboards (v${opensearchDashboardsVersion}) is incompatible with the following OpenSearch nodes in your cluster: ${incompatibleNodeNames}`;
    }
  } else if (warningNodes.length > 0) {
    const warningNodeNames = warningNodes.map((node) => node.name).join(', ');
    message =
      `You're running OpenSearch Dashboards ${opensearchDashboardsVersion} with some different versions of ` +
      'OpenSearch. Update OpenSearch Dashboards or OpenSearch to the same ' +
      `version to prevent compatibility issues: ${warningNodeNames}`;
  }

  return {
    isCompatible: ignoreVersionMismatch || incompatibleNodes.length === 0,
    message,
    incompatibleNodes,
    warningNodes,
    opensearchDashboardsVersion,
  };
}

// Returns true if two NodesVersionCompatibility entries match
function compareNodes(prev: NodesVersionCompatibility, curr: NodesVersionCompatibility) {
  const nodesEqual = (n: NodeInfo, m: NodeInfo) => n.ip === m.ip && n.version === m.version;
  return (
    curr.isCompatible === prev.isCompatible &&
    curr.incompatibleNodes.length === prev.incompatibleNodes.length &&
    curr.warningNodes.length === prev.warningNodes.length &&
    curr.incompatibleNodes.every((node, i) => nodesEqual(node, prev.incompatibleNodes[i])) &&
    curr.warningNodes.every((node, i) => nodesEqual(node, prev.warningNodes[i]))
  );
}

export const pollOpenSearchNodesVersion = ({
  internalClient,
  optimizedHealthcheck,
  log,
  opensearchDashboardsVersion,
  ignoreVersionMismatch,
  opensearchVersionCheckInterval: healthCheckInterval,
}: PollOpenSearchNodesVersionOptions): Observable<NodesVersionCompatibility> => {
  log.debug('Checking OpenSearch version');
  return timer(0, healthCheckInterval).pipe(
    exhaustMap(() => {
      /*
       * Originally, Dashboards queries OpenSearch cluster to get the version info of each node and check the version compatibility with each node.
       * The /nodes request could fail even one node in cluster fail to response
       * For better dashboards resilience, the behaviour is changed to only query the local node when all the nodes have the same cluster_id
       * Using _cluster/state/nodes to retrieve the cluster_id of each node from the master node
       */
      if (optimizedHealthcheck) {
        return from(getNodeId(internalClient)).pipe(
          mergeMap((nodeId: any) =>
            from(
              internalClient.nodes.info<NodesInfo>({
                node_id: nodeId,
                filter_path: ['nodes.*.version', 'nodes.*.http.publish_address', 'nodes.*.ip'],
              })
            ).pipe(
              map(({ body }) => body),
              catchError((_err: any) => {
                return of({ nodes: {} });
              })
            )
          )
        );
      } else {
        return from(
          internalClient.nodes.info<NodesInfo>({
            filter_path: ['nodes.*.version', 'nodes.*.http.publish_address', 'nodes.*.ip'],
          })
        ).pipe(
          map(({ body }) => body),
          catchError((_err) => {
            return of({ nodes: {} });
          })
        );
      }
    }),
    map((nodesInfo: NodesInfo) =>
      mapNodesVersionCompatibility(nodesInfo, opensearchDashboardsVersion, ignoreVersionMismatch)
    ),
    distinctUntilChanged(compareNodes) // Only emit if there are new nodes or versions
  );
};
