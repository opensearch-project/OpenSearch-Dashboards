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

import {
  mapNodesVersionCompatibility,
  pollOpenSearchNodesVersion,
  NodesInfo,
} from './ensure_opensearch_version';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import { opensearchClientMock } from '../client/mocks';
import { take, delay } from 'rxjs/operators';
import { TestScheduler } from 'rxjs/testing';
import { of } from 'rxjs';

const mockLoggerFactory = loggingSystemMock.create();
const mockLogger = mockLoggerFactory.get('mock logger');

const OPENSEARCH_DASHBOARDS_VERSION = '5.1.0';

const createOpenSearchSuccess = opensearchClientMock.createSuccessTransportRequestPromise;
const createOpenSearchError = opensearchClientMock.createErrorTransportRequestPromise;

function createNodes(...versions: string[]): NodesInfo {
  const nodes = {} as any;
  versions
    .map((version) => {
      return {
        version,
        http: {
          publish_address: 'http_address',
        },
        ip: 'ip',
      };
    })
    .forEach((node, i) => {
      nodes[`node-${i}`] = node;
    });

  return { nodes };
}

function createNodesWithAttribute(
  targetId: string,
  filterId: string,
  targetAttributeValue: string,
  filterAttributeValue: string,
  ...versions: string[]
): NodesInfo {
  const nodes = {} as any;
  versions
    .map((version, i) => {
      return {
        version,
        http: {
          publish_address: 'http_address',
        },
        ip: 'ip',
        attributes: {
          cluster_id: i % 2 === 0 ? targetId : filterId,
          custom_attribute: i % 2 === 0 ? targetAttributeValue : filterAttributeValue,
        },
      };
    })
    .forEach((node, i) => {
      nodes[`node-${i}`] = node;
    });

  return { nodes };
}

describe('mapNodesVersionCompatibility', () => {
  function createNodesInfoWithoutHTTP(version: string): NodesInfo {
    return { nodes: { 'node-without-http': { version, ip: 'ip' } } } as any;
  }

  it('returns isCompatible=true with a single node that matches', async () => {
    const nodesInfo = createNodes('5.1.0');
    const result = await mapNodesVersionCompatibility(
      nodesInfo,
      OPENSEARCH_DASHBOARDS_VERSION,
      false
    );
    expect(result.isCompatible).toBe(true);
  });

  it('returns isCompatible=true with multiple nodes that satisfy', async () => {
    const nodesInfo = createNodes('5.1.0', '5.2.0', '5.1.1-Beta1');
    const result = await mapNodesVersionCompatibility(
      nodesInfo,
      OPENSEARCH_DASHBOARDS_VERSION,
      false
    );
    expect(result.isCompatible).toBe(true);
  });

  it('returns isCompatible=false for a single node that is out of date', () => {
    // 5.0.0 OpenSearch is too old to work with a 5.1.0 version of OpenSearchDashboards.
    const nodesInfo = createNodes('5.1.0', '5.2.0', '5.0.0');
    const result = mapNodesVersionCompatibility(nodesInfo, OPENSEARCH_DASHBOARDS_VERSION, false);
    expect(result.isCompatible).toBe(false);
    expect(result.message).toMatchInlineSnapshot(
      `"This version of OpenSearch Dashboards (v5.1.0) is incompatible with the following OpenSearch nodes in your cluster: v5.0.0 @ http_address (ip)"`
    );
  });

  it('returns isCompatible=false for an incompatible node without http publish address', async () => {
    const nodesInfo = createNodesInfoWithoutHTTP('6.1.1');
    const result = mapNodesVersionCompatibility(nodesInfo, OPENSEARCH_DASHBOARDS_VERSION, false);
    expect(result.isCompatible).toBe(false);
    expect(result.message).toMatchInlineSnapshot(
      `"This version of OpenSearch Dashboards (v5.1.0) is incompatible with the following OpenSearch nodes in your cluster: v6.1.1 @ undefined (ip)"`
    );
  });

  it('returns isCompatible=true for outdated nodes when ignoreVersionMismatch=true', async () => {
    // 5.0.0 OpenSearch is too old to work with a 5.1.0 version of OpenSearch Dashboards.
    const nodesInfo = createNodes('5.1.0', '5.2.0', '5.0.0');
    const ignoreVersionMismatch = true;
    const result = mapNodesVersionCompatibility(
      nodesInfo,
      OPENSEARCH_DASHBOARDS_VERSION,
      ignoreVersionMismatch
    );
    expect(result.isCompatible).toBe(true);
    expect(result.message).toMatchInlineSnapshot(
      `"Ignoring version incompatibility between OpenSearch Dashboards v5.1.0 and the following OpenSearch nodes: v5.0.0 @ http_address (ip)"`
    );
  });

  it('returns isCompatible=true with a message if a node is only off by a patch version', () => {
    const result = mapNodesVersionCompatibility(
      createNodes('5.1.1'),
      OPENSEARCH_DASHBOARDS_VERSION,
      false
    );
    expect(result.isCompatible).toBe(true);
    expect(result.message).toMatchInlineSnapshot(
      `"You're running OpenSearch Dashboards 5.1.0 with some different versions of OpenSearch. Update OpenSearch Dashboards or OpenSearch to the same version to prevent compatibility issues: v5.1.1 @ http_address (ip)"`
    );
  });

  it('returns isCompatible=true with a message if a node is only off by a patch version and without http publish address', async () => {
    const result = mapNodesVersionCompatibility(
      createNodes('5.1.1'),
      OPENSEARCH_DASHBOARDS_VERSION,
      false
    );
    expect(result.isCompatible).toBe(true);
    expect(result.message).toMatchInlineSnapshot(
      `"You're running OpenSearch Dashboards 5.1.0 with some different versions of OpenSearch. Update OpenSearch Dashboards or OpenSearch to the same version to prevent compatibility issues: v5.1.1 @ http_address (ip)"`
    );
  });
});

describe('pollOpenSearchNodesVersion', () => {
  let internalClient: ReturnType<typeof opensearchClientMock.createInternalClient>;
  const getTestScheduler = () =>
    new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });

  beforeEach(() => {
    internalClient = opensearchClientMock.createInternalClient();
  });

  const nodeInfosSuccessOnce = (infos: NodesInfo) => {
    internalClient.nodes.info.mockImplementationOnce(() => createOpenSearchSuccess(infos));
  };
  const nodeInfosErrorOnce = (error: any) => {
    internalClient.nodes.info.mockImplementationOnce(() => createOpenSearchError(error));
  };

  it('returns isCompatible=false and keeps polling when a poll request throws', (done) => {
    expect.assertions(3);
    const expectedCompatibilityResults = [false, false, true];
    jest.clearAllMocks();

    nodeInfosSuccessOnce(createNodes('5.1.0', '5.2.0', '5.0.0'));
    nodeInfosErrorOnce('mock request error');
    nodeInfosSuccessOnce(createNodes('5.1.0', '5.2.0', '5.1.1-Beta1'));

    pollOpenSearchNodesVersion({
      internalClient,
      optimizedHealthcheck: { id: 'cluster_id' },
      opensearchVersionCheckInterval: 1,
      ignoreVersionMismatch: false,
      opensearchDashboardsVersion: OPENSEARCH_DASHBOARDS_VERSION,
      log: mockLogger,
    })
      .pipe(take(3))
      .subscribe({
        next: (result) => {
          expect(result.isCompatible).toBe(expectedCompatibilityResults.shift());
        },
        complete: done,
        error: done,
      });
  });

  it('returns compatibility results', (done) => {
    expect.assertions(1);
    const nodes = createNodes('5.1.0', '5.2.0', '5.0.0');

    nodeInfosSuccessOnce(nodes);

    pollOpenSearchNodesVersion({
      internalClient,
      optimizedHealthcheck: { id: 'cluster_id' },
      opensearchVersionCheckInterval: 1,
      ignoreVersionMismatch: false,
      opensearchDashboardsVersion: OPENSEARCH_DASHBOARDS_VERSION,
      log: mockLogger,
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          expect(result).toEqual(
            mapNodesVersionCompatibility(nodes, OPENSEARCH_DASHBOARDS_VERSION, false)
          );
        },
        complete: done,
        error: done,
      });
  });

  it('returns compatibility results and isCompatible=true with filters', (done) => {
    expect.assertions(2);
    const target = {
      cluster_id: '0',
      attribute: 'foo',
    };
    const filter = {
      cluster_id: '1',
      attribute: 'bar',
    };

    // will filter out every odd index
    const nodes = createNodesWithAttribute(
      target.cluster_id,
      filter.cluster_id,
      target.attribute,
      filter.attribute,
      '5.1.0',
      '6.2.0',
      '5.1.0',
      '5.1.1-Beta1'
    );

    const filteredNodes = nodes;
    delete filteredNodes.nodes['node-1'];
    delete filteredNodes.nodes['node-3'];

    internalClient.cluster.state.mockReturnValueOnce({ body: nodes });

    nodeInfosSuccessOnce(nodes);

    pollOpenSearchNodesVersion({
      internalClient,
      optimizedHealthcheck: { id: 'cluster_id', filters: { custom_attribute: filter.attribute } },
      opensearchVersionCheckInterval: 1,
      ignoreVersionMismatch: false,
      opensearchDashboardsVersion: OPENSEARCH_DASHBOARDS_VERSION,
      log: mockLogger,
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          expect(result).toEqual(
            mapNodesVersionCompatibility(filteredNodes, OPENSEARCH_DASHBOARDS_VERSION, false)
          );
          expect(result.isCompatible).toBe(true);
        },
        complete: done,
        error: done,
      });
  });

  it('returns compatibility results and isCompatible=false with filters', (done) => {
    expect.assertions(2);
    const target = {
      cluster_id: '0',
      attribute: 'foo',
    };
    const filter = {
      cluster_id: '1',
      attribute: 'bar',
    };

    // will filter out every odd index
    const nodes = createNodesWithAttribute(
      target.cluster_id,
      filter.cluster_id,
      target.attribute,
      filter.attribute,
      '5.1.0',
      '5.1.0',
      '6.2.0',
      '5.1.1-Beta1'
    );

    const filteredNodes = nodes;
    delete filteredNodes.nodes['node-1'];
    delete filteredNodes.nodes['node-3'];

    internalClient.cluster.state.mockReturnValueOnce({ body: nodes });

    nodeInfosSuccessOnce(nodes);

    pollOpenSearchNodesVersion({
      internalClient,
      optimizedHealthcheck: { id: 'cluster_id', filters: { custom_attribute: filter.attribute } },
      opensearchVersionCheckInterval: 1,
      ignoreVersionMismatch: false,
      opensearchDashboardsVersion: OPENSEARCH_DASHBOARDS_VERSION,
      log: mockLogger,
    })
      .pipe(take(1))
      .subscribe({
        next: (result) => {
          expect(result).toEqual(
            mapNodesVersionCompatibility(filteredNodes, OPENSEARCH_DASHBOARDS_VERSION, false)
          );
          expect(result.isCompatible).toBe(false);
        },
        complete: done,
        error: done,
      });
  });

  it('only emits if the node versions changed since the previous poll', (done) => {
    expect.assertions(4);
    nodeInfosSuccessOnce(createNodes('5.1.0', '5.2.0', '5.0.0')); // emit
    nodeInfosSuccessOnce(createNodes('5.0.0', '5.1.0', '5.2.0')); // ignore, same versions, different ordering
    nodeInfosSuccessOnce(createNodes('5.1.1', '5.2.0', '5.0.0')); // emit
    nodeInfosSuccessOnce(createNodes('5.1.1', '5.1.2', '5.1.3')); // emit
    nodeInfosSuccessOnce(createNodes('5.1.1', '5.1.2', '5.1.3')); // ignore
    nodeInfosSuccessOnce(createNodes('5.0.0', '5.1.0', '5.2.0')); // emit, different from previous version

    pollOpenSearchNodesVersion({
      internalClient,
      optimizedHealthcheck: { id: 'cluster_id' },
      opensearchVersionCheckInterval: 1,
      ignoreVersionMismatch: false,
      opensearchDashboardsVersion: OPENSEARCH_DASHBOARDS_VERSION,
      log: mockLogger,
    })
      .pipe(take(4))
      .subscribe({
        next: (result) => expect(result).toBeDefined(),
        complete: done,
        error: done,
      });
  });

  /*
   * Disable TestScheduler test due to OOM issue,
   * refer to https://rxjs.dev/guide/testing/marble-testing#known-issues
   */
  // TODO: investigate removing or rewriting this unit test
  it.skip('starts polling immediately and then every opensearchVersionCheckInterval', () => {
    expect.assertions(1);

    internalClient.nodes.info.mockReturnValueOnce([
      { body: createNodes('5.1.0', '5.2.0', '5.0.0') },
    ]);
    internalClient.nodes.info.mockReturnValueOnce([
      { body: createNodes('5.1.1', '5.2.0', '5.0.0') },
    ]);

    getTestScheduler().run(({ expectObservable }) => {
      const expected = 'a 99ms (b|)';

      const opensearchNodesCompatibility$ = pollOpenSearchNodesVersion({
        internalClient,
        optimizedHealthcheck: { id: 'cluster_id' },
        opensearchVersionCheckInterval: 100,
        ignoreVersionMismatch: false,
        opensearchDashboardsVersion: OPENSEARCH_DASHBOARDS_VERSION,
        log: mockLogger,
      }).pipe(take(2));

      expectObservable(opensearchNodesCompatibility$).toBe(expected, {
        a: mapNodesVersionCompatibility(
          createNodes('5.1.0', '5.2.0', '5.0.0'),
          OPENSEARCH_DASHBOARDS_VERSION,
          false
        ),
        b: mapNodesVersionCompatibility(
          createNodes('5.1.1', '5.2.0', '5.0.0'),
          OPENSEARCH_DASHBOARDS_VERSION,
          false
        ),
      });
    });
  });

  // TODO: investigate removing or rewriting this unit test
  it.skip('waits for opensearch version check requests to complete before scheduling the next one', () => {
    expect.assertions(2);

    getTestScheduler().run(({ expectObservable }) => {
      const expected = '100ms a 99ms (b|)';

      internalClient.nodes.info.mockReturnValueOnce(
        of({ body: createNodes('5.1.0', '5.2.0', '5.0.0') }).pipe(delay(100))
      );
      internalClient.nodes.info.mockReturnValueOnce(
        of({ body: createNodes('5.1.1', '5.2.0', '5.0.0') }).pipe(delay(100))
      );

      const opensearchNodesCompatibility$ = pollOpenSearchNodesVersion({
        internalClient,
        optimizedHealthcheck: { id: 'cluster_id' },
        opensearchVersionCheckInterval: 10,
        ignoreVersionMismatch: false,
        opensearchDashboardsVersion: OPENSEARCH_DASHBOARDS_VERSION,
        log: mockLogger,
      }).pipe(take(2));

      expectObservable(opensearchNodesCompatibility$).toBe(expected, {
        a: mapNodesVersionCompatibility(
          createNodes('5.1.0', '5.2.0', '5.0.0'),
          OPENSEARCH_DASHBOARDS_VERSION,
          false
        ),
        b: mapNodesVersionCompatibility(
          createNodes('5.1.1', '5.2.0', '5.0.0'),
          OPENSEARCH_DASHBOARDS_VERSION,
          false
        ),
      });
    });

    expect(internalClient.nodes.info).toHaveBeenCalledTimes(2);
  });
});
