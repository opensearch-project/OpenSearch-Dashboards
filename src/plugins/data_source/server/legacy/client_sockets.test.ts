/** @jest-environment node */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { once } from 'events';
import http from 'http';
import { AddressInfo, Socket } from 'net';
import { duration } from 'moment';
import { Client as LegacyClient } from 'elasticsearch';
import { loggingSystemMock } from '../../../../core/server/mocks';
import { DataSourcePluginConfigType } from '../../config';
import { parseClientOptions } from './client_config';

const config = {
  enabled: true,
  clientPool: { size: 5 },
  globalOpenSearchConfig: {
    requestTimeout: duration(10, 'seconds'),
    pingTimeout: duration(20, 'seconds'),
  },
} as DataSourcePluginConfigType;

/** The connector the client made for its only host. */
const getConnection = (client: LegacyClient) =>
  (client as any).transport.connectionPool._conns.alive[0];

const nextCheckPhase = () => new Promise((resolve) => setImmediate(resolve));

describe('legacy data source client sockets', () => {
  let server: http.Server;
  let port: number;
  /** The server's raw TCP sockets: only a TCP socket can send a reset. */
  const serverSockets: Socket[] = [];

  beforeAll(async () => {
    // Answers at once, before the request body has arrived.
    server = http.createServer((req, res) => {
      res.end('{}');
      req.resume();
    });
    server.on('connection', (socket: Socket) => serverSockets.push(socket));
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    port = (server.address() as AddressInfo).port;
  });

  afterAll(async () => {
    server.closeAllConnections();
    server.close();
    await once(server, 'close');
  });

  let logger: ReturnType<typeof loggingSystemMock.createLogger>;
  let client: LegacyClient;
  let agent: http.Agent;

  beforeEach(() => {
    logger = loggingSystemMock.createLogger();
    client = new LegacyClient(parseClientOptions(config, `http://127.0.0.1:${port}`, [], logger));
    agent = getConnection(client).agent;
  });

  afterEach(() => {
    // Destroy the sockets here: left to the connector, closing a client whose agent still holds
    // sockets passes the agent's socket names to `url.parse`, which Node warns about (DEP0170),
    // and the test runner exits on any warning.
    const connection = getConnection(client);
    connection.removeListener('status set', connection.bound.onStatusSet);
    agent.destroy();
    client.close();
  });

  /**
   * Leaves one of the agent's sockets attached to a finished request that nobody listens to, the
   * way the legacy connector's clean-up does when the response ends before the request has.
   */
  async function orphanSocket() {
    const request = http.request({
      host: '127.0.0.1',
      port,
      method: 'POST',
      path: '/_plugins/_security/authinfo',
      agent,
      headers: { 'content-length': 10 },
    });
    request.write('12345');
    const [response] = await once(request, 'response');
    response.resume();
    await once(response, 'end');
    request.removeAllListeners();
    response.removeAllListeners();
    request.end('67890');
    await nextCheckPhase();

    const socket = request.socket!;
    expect(Object.values(agent.sockets).flat()).toContain(socket);
    expect(request.listenerCount('error')).toBe(0);
    return socket;
  }

  test.each([
    [
      'times out',
      'Socket timeout',
      (socket: Socket) => {
        socket.setTimeout(10);
      },
    ],
    [
      'is reset',
      'ECONNRESET',
      (socket: Socket) => {
        serverSockets.find(({ remotePort }) => remotePort === socket.localPort)!.resetAndDestroy();
      },
    ],
  ])('a socket left attached to a finished request %s without crashing', async (_, error, fail) => {
    const socket = await orphanSocket();

    const closed = new Promise((resolve) => socket.once('close', resolve));
    fail(socket);
    await closed;

    expect(socket.destroyed).toBe(true);
    expect(Object.values(agent.sockets).flat()).not.toContain(socket);
    const warnings = loggingSystemMock.collect(logger).warn;
    expect(warnings).toHaveLength(1);
    expect(warnings[0][0]).toContain('(POST /_plugins/_security/authinfo)');
    expect(warnings[0][0]).toContain(error);
  });

  test("returns a socket to the pool after the connector's clean-up", async () => {
    // Sent the way the connector sends its requests, with the response ending first.
    const request: http.ClientRequest = getConnection(client).hand.request({
      host: '127.0.0.1',
      port,
      method: 'POST',
      path: '/_plugins/_security/authinfo',
      agent,
      headers: { 'content-length': 10 },
    });
    request.write('12345');
    const [response] = await once(request, 'response');
    response.resume();
    await once(response, 'end');
    const socket = request.socket!;
    request.removeAllListeners();
    request.end('67890');
    await nextCheckPhase();

    expect({
      inUse: Object.values(agent.sockets).flat().includes(socket),
      free: Object.values(agent.freeSockets).flat().includes(socket),
    }).toEqual({ inUse: false, free: true });
  });
});
