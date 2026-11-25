/** @jest-environment node */

/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChildProcess, spawn } from 'child_process';
import { generateKeyPairSync } from 'crypto';
import { EventEmitter } from 'events';
import { Agent, ClientRequest } from 'http';
import { Socket } from 'net';
import { PassThrough } from 'stream';
import { TLSSocket } from 'tls';
import { Client } from 'elasticsearch';
import { md, pki } from 'node-forge';
import { loggingSystemMock } from '../../logging/logging_system.mock';
import { auditTrailServiceMock } from '../../audit_trail/audit_trail_service.mock';
import { LegacyClusterClient } from './cluster_client';
import {
  LegacyOpenSearchClientConfig,
  parseOpenSearchClientConfig,
} from './opensearch_client_config';
import { getLegacyNodeAgentFactory } from './node_agent';
import { DEFAULT_API_VERSION } from '../opensearch_config';

const logger = loggingSystemMock.create();
const log = logger.get();
afterEach(() => jest.clearAllMocks());

describe('getLegacyNodeAgentFactory', () => {
  /**
   * An agent whose sockets are fakes. Like agentkeepalive, the agent installs its own timeout and
   * error listeners on each new socket.
   */
  const createGuardedAgent = ({ onTimeout = () => {}, onError = () => {} } = {}) => {
    const socket = Object.assign(new PassThrough(), {
      _httpMessage: null as ClientRequest | null,
    });
    socket.on('timeout', onTimeout);
    socket.on('error', onError);
    const agent = new Agent();
    agent.createConnection = () => socket;
    const connector = { createAgent: jest.fn().mockReturnValue(agent) };
    const config = { keepAlive: true };

    expect(getLegacyNodeAgentFactory(log)(connector, config)).toBe(agent);
    expect(connector.createAgent).toHaveBeenCalledWith(config);
    expect(agent.createConnection({})).toBe(socket);
    return socket;
  };

  const fakeRequest = () =>
    Object.assign(new EventEmitter(), { method: 'GET', path: '/' }) as ClientRequest;

  test.each(['timeout', 'error'])("listens to a socket's %s ahead of the agent", (event) => {
    let errorListenersSeenByAgent;
    const seeErrorListeners = () => {
      errorListenersSeenByAgent = socket._httpMessage!.listenerCount('error');
    };
    const socket = createGuardedAgent({ onTimeout: seeErrorListeners, onError: seeErrorListeners });
    socket._httpMessage = fakeRequest();

    socket.emit(event, new Error('read ECONNRESET'));

    expect(errorListenersSeenByAgent).toBe(1);
  });

  test('leaves a request that has an error listener alone', () => {
    const socket = createGuardedAgent();
    socket._httpMessage = fakeRequest();
    const onError = jest.fn();
    socket._httpMessage.on('error', onError);

    socket.emit('timeout');
    socket.emit('error', new Error('Socket timeout'));
    socket._httpMessage.emit('error', new Error('Socket timeout'));

    expect(socket._httpMessage.listeners('error')).toEqual([onError]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(log.warn).not.toHaveBeenCalled();
  });

  test('handles the error of a request that has no error listener', () => {
    const socket = createGuardedAgent();
    socket._httpMessage = fakeRequest();

    socket.emit('error', new Error('read ECONNRESET'));

    expect(() => socket._httpMessage!.emit('error', new Error('read ECONNRESET'))).not.toThrow();
    expect(loggingSystemMock.collect(logger).warn).toEqual([
      [
        'Closed a legacy client socket left attached to a finished request (GET /): read ECONNRESET',
      ],
    ]);
  });

  test('keeps handling the error when the logger throws', () => {
    jest.mocked(log.warn).mockImplementationOnce(() => {
      throw new Error('logger down');
    });
    const socket = createGuardedAgent();
    socket._httpMessage = fakeRequest();

    socket.emit('timeout');

    expect(() => socket._httpMessage!.emit('error', new Error('Socket timeout'))).not.toThrow();
    expect(log.warn).toHaveBeenCalledTimes(1);
  });

  test('logs the error of a socket with no request that nothing else handles', () => {
    // Only the agent's listener and the guard's: agentkeepalive alone would re-emit the error.
    const socket = createGuardedAgent();

    socket.emit('error', new Error('read ECONNRESET'));

    expect(loggingSystemMock.collect(logger).warn).toEqual([
      ['Closed a legacy client socket with no request attached: read ECONNRESET'],
    ]);
  });

  test('leaves the error of a socket with no request to its other listeners', () => {
    const socket = createGuardedAgent();
    socket.on('error', () => {});

    socket.emit('error', new Error('read ECONNRESET'));

    expect(log.warn).not.toHaveBeenCalled();
  });

  test('ignores the timeout of a socket with no request', () => {
    const socket = createGuardedAgent();
    expect(() => socket.emit('timeout')).not.toThrow();
    expect(log.warn).not.toHaveBeenCalled();
  });

  describe("the connector's requests", () => {
    const createConnector = () => {
      const hand = { request: jest.fn((..._: unknown[]) => new EventEmitter() as ClientRequest) };
      const connector = { createAgent: jest.fn(() => new Agent()), hand };
      getLegacyNodeAgentFactory(log)(connector, {});
      return { connector, hand };
    };

    test('keep all but their error listeners when the connector removes all of them', () => {
      const { connector, hand } = createConnector();
      const request = connector.hand.request('options', 'callback');
      expect(hand.request).toHaveBeenCalledWith('options', 'callback');
      const onFinish = () => {};
      request.on('finish', onFinish).on('error', () => {});

      request.removeAllListeners();
      expect(request.listeners('finish')).toEqual([onFinish]);
      expect(request.listenerCount('error')).toBe(0);

      request.removeAllListeners('finish');
      expect(request.listenerCount('finish')).toBe(0);
    });

    test('are the only ones that change', () => {
      const { connector, hand } = createConnector();
      expect(Object.getPrototypeOf(connector.hand)).toBe(hand);
      expect(hand.request().removeAllListeners).toBe(EventEmitter.prototype.removeAllListeners);
    });

    test.each([
      ['no module', undefined],
      ['a module without request', { request: undefined }],
    ])('are left alone by a connector with %s', (_, hand) => {
      const connector = { createAgent: jest.fn(() => new Agent()), hand };
      getLegacyNodeAgentFactory(log)(connector, {});
      expect(connector.hand).toBe(hand);
    });
  });
});

/** A self-signed certificate for 127.0.0.1, which the clients below trust as their CA. */
function createCertificate() {
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
  });
  const certificate = pki.createCertificate();
  certificate.publicKey = pki.publicKeyFromPem(publicKey);
  certificate.serialNumber = '01';
  certificate.validity.notBefore = new Date(Date.now() - 60 * 1000);
  certificate.validity.notAfter = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const name = [{ name: 'commonName', value: '127.0.0.1' }];
  certificate.setSubject(name);
  certificate.setIssuer(name);
  certificate.setExtensions([
    { name: 'basicConstraints', cA: true },
    { name: 'subjectAltName', altNames: [{ type: 7, ip: '127.0.0.1' }] },
  ]);
  certificate.sign(pki.privateKeyFromPem(privateKey), md.sha256.create());
  return { key: privateKey, cert: pki.certificateToPem(certificate) };
}

/**
 * HTTPS stand-in for OpenSearch, in its own process so it can answer while this one is blocked.
 * It answers at once, except `/hang` (never) and `/reset` or a client port written to its stdin
 * (resets the connection). It exits when its stdin closes.
 */
const SERVER_SOURCE = `
const https = require('https');
const readline = require('readline');
// The raw TCP sockets by client port: only a TCP socket can send a reset.
const sockets = new Map();
const reset = (port) => sockets.get(Number(port))?.resetAndDestroy();
const server = https.createServer(
  { key: process.env.TLS_KEY, cert: process.env.TLS_CERT },
  (req, res) => {
    req.resume();
    req.on('end', () => {
      if (req.url === '/hang') return;
      if (req.url === '/reset') return reset(req.socket.remotePort);
      res.setHeader('content-type', 'application/json');
      res.end('{}');
    });
  }
);
server.on('connection', (socket) => {
  const port = socket.remotePort;
  sockets.set(port, socket);
  socket.on('close', () => sockets.delete(port));
});
server.keepAliveTimeout = 60000;
server.listen(0, '127.0.0.1', () => console.log(server.address().port));
readline.createInterface({ input: process.stdin }).on('line', reset).on('close', () => process.exit());
`;

const AUTHINFO = { method: 'GET', path: '/_plugins/_security/authinfo' };

/** The connector the client made for its only host, whether the pool counts it alive or dead. */
const getConnection = (client: Client) => {
  const { alive, dead } = (client as any).transport.connectionPool._conns;
  return alive[0] ?? dead[0];
};

const getAgent = (client: Client): Agent => getConnection(client).agent;

const getSockets = (agent: Agent) => Object.values(agent.sockets).flat() as Socket[];

/** A socket the agent still counts as in use although its request has no `'error'` listener. */
const findOrphanedSocket = (agent: Agent) =>
  getSockets(agent).find((socket) => {
    const request: ClientRequest | undefined = (socket as any)._httpMessage;
    return request && request.listenerCount('error') === 0;
  });

/**
 * Destroys a cluster client's sockets before closing it: the connector would otherwise trigger
 * Node's DEP0170 warning, and the test runner exits on any warning.
 */
function closeClusterClient(clusterClient: LegacyClusterClient) {
  for (const client of [(clusterClient as any).client, (clusterClient as any).scopedClient]) {
    if (client) {
      const connection = getConnection(client);
      connection.removeListener('status set', connection.bound.onStatusSet);
      connection.agent.destroy();
    }
  }
  clusterClient.close();
}

const nextCheckPhase = () => new Promise((resolve) => setImmediate(resolve));

function busyWait(ms: number) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    // Block the event loop, as a Dashboards process busy with other requests does.
  }
}

/**
 * Sends a request while a second timer blocks the event loop, so the response is read before Node
 * reports the TLS write as finished (from a `setImmediate`).
 */
const sendWhileBusy = (send: () => Promise<unknown>) =>
  new Promise((resolve, reject) => {
    setTimeout(() => send().then(resolve, reject), 1);
    setTimeout(() => busyWait(50), 1);
  });

/** Calls `listener` with each request the agent serves, once its response has ended. */
function onResponseEnd(agent: Agent, listener: (request: ClientRequest) => void) {
  const addRequest = (agent as any).addRequest;
  (agent as any).addRequest = function (request: ClientRequest, ...rest: unknown[]) {
    request.once('response', (response) => response.once('end', () => listener(request)));
    return addRequest.call(this, request, ...rest);
  };
}

describe('legacy cluster clients', () => {
  let server: ChildProcess;
  let config: LegacyOpenSearchClientConfig;

  /** OpenSearch, a firewall or a load balancer resetting the connection (TCP RST). */
  const resetByServer = (socket: Socket) => server.stdin!.write(`${socket.localPort}\n`);

  // Starting the stand-in's Node process can exceed Jest's default 5 s when the whole suite runs.
  beforeAll(async () => {
    const { key, cert } = createCertificate();
    server = spawn(process.execPath, ['-e', SERVER_SOURCE], {
      env: { ...process.env, TLS_KEY: key, TLS_CERT: cert },
      stdio: ['pipe', 'pipe', 'inherit'],
    });
    const port = await new Promise<number>((resolve, reject) => {
      server.stdout!.once('data', (chunk) => resolve(Number(String(chunk).trim())));
      server.once('error', reject);
      server.once('exit', (code) => reject(new Error(`Test server exited with code ${code}`)));
    });

    config = {
      apiVersion: DEFAULT_API_VERSION,
      customHeaders: {},
      logQueries: false,
      sniffOnStart: false,
      sniffOnConnectionFault: false,
      hosts: [`https://127.0.0.1:${port}`],
      requestHeadersWhitelist: [],
      requestCompression: false,
      ssl: {
        verificationMode: 'full',
        certificateAuthorities: [cert],
        alwaysPresentCertificate: false,
      },
    };
  }, 30000);

  afterAll(() => {
    server.kill();
  });

  test.each([
    ['trusting it', (ssl: LegacyOpenSearchClientConfig['ssl']) => ssl, true],
    ['not trusting it', () => ({ verificationMode: 'full' as const }), false],
  ])('verify the server certificate, %s', async (_, getSsl, trusted) => {
    const clusterClient = new LegacyClusterClient(
      { ...config, ssl: getSsl(config.ssl) },
      log,
      auditTrailServiceMock.createAuditorFactory
    );
    try {
      const response = clusterClient.callAsInternalUser('transport.request', {
        ...AUTHINFO,
        maxRetries: 0,
      });
      await (trusted ? expect(response).resolves.toEqual({}) : expect(response).rejects.toThrow());
    } finally {
      closeClusterClient(clusterClient);
    }
  });

  test('use the agent the connector creates on its own', () => {
    const clientConfig = parseOpenSearchClientConfig(
      {
        ...config,
        ssl: {
          verificationMode: 'certificate',
          certificateAuthorities: ['content-of-ca-path'],
          alwaysPresentCertificate: false,
        },
      },
      log
    );
    expect(clientConfig.createNodeAgent).toEqual(expect.any(Function));
    const client = new Client({ ...clientConfig });
    const connectorDefault = new Client({ ...clientConfig, createNodeAgent: undefined });
    try {
      const agent = getAgent(client);
      const expected = getAgent(connectorDefault);

      expect(agent.constructor).toBe(expected.constructor);
      expect(agent.constructor.name).toBe('HttpsAgent');
      expect((agent as any).options).toEqual((expected as any).options);
      expect((agent as any).options).toMatchObject({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: Infinity,
        maxFreeSockets: 256,
        freeSocketTimeout: 60000,
        timeout: 120000,
        rejectUnauthorized: true,
        checkServerIdentity: expect.any(Function),
        ca: ['content-of-ca-path'],
      });
      // The connector still destroys the agent's sockets when the client is closed.
      const connection = getConnection(client);
      expect(connection.listeners('status set')).toContain(connection.bound.onStatusSet);
    } finally {
      client.close();
      connectorDefault.close();
    }
  });

  describe.each([
    [
      'callAsInternalUser',
      (clusterClient: LegacyClusterClient) =>
        clusterClient.callAsInternalUser('transport.request', AUTHINFO),
      (clusterClient: LegacyClusterClient): Client => (clusterClient as any).client,
    ],
    [
      'asScoped().callAsCurrentUser',
      (clusterClient: LegacyClusterClient) =>
        clusterClient.asScoped().callAsCurrentUser('transport.request', AUTHINFO),
      (clusterClient: LegacyClusterClient): Client => (clusterClient as any).scopedClient,
    ],
  ])('%s', (_, send, getRawClient) => {
    let clusterClient: LegacyClusterClient;

    beforeEach(() => {
      clusterClient = new LegacyClusterClient(
        config,
        log,
        auditTrailServiceMock.createAuditorFactory
      );
    });

    afterEach(() => {
      closeClusterClient(clusterClient);
    });

    test('return the socket to the pool when the response ends before the request finishes', async () => {
      // Open one keep-alive socket and return it to the pool.
      await send(clusterClient);
      const agent = getAgent(getRawClient(clusterClient));
      const raced: ClientRequest[] = [];
      onResponseEnd(agent, (request) => !request.writableFinished && raced.push(request));

      for (let attempt = 0; attempt < 10 && raced.length === 0; attempt++) {
        await expect(sendWhileBusy(() => send(clusterClient))).resolves.toEqual({});
        await nextCheckPhase();
      }
      expect(raced).not.toHaveLength(0);
      const socket = raced[0].socket as TLSSocket;
      expect(socket.authorized).toBe(true);
      expect(raced[0].writableFinished).toBe(true);

      // Without the hook, the connector's clean-up left the socket in use, attached to the request.
      expect({
        inUse: getSockets(agent).includes(socket),
        free: Object.values(agent.freeSockets).flat().includes(socket),
      }).toEqual({ inUse: false, free: true });
    });

    test.each([
      [
        // agentkeepalive times such a socket out after 120 s and destroys it with
        // "Error: Socket timeout".
        'times out',
        'Socket timeout',
        (socket: Socket) => {
          socket.setTimeout(10);
        },
      ],
      ['is reset', 'ECONNRESET', resetByServer],
    ])(
      'a socket left attached to a finished request %s without crashing',
      async (__, error, fail) => {
        // Open one keep-alive socket and return it to the pool.
        await send(clusterClient);
        const agent = getAgent(getRawClient(clusterClient));
        // The hook keeps the connector from leaving such a socket. Strip each request's listeners
        // when its response ends, as the connector's clean-up did, to leave one anyway.
        onResponseEnd(agent, (request) => EventEmitter.prototype.removeAllListeners.call(request));

        let orphan: Socket | undefined;
        for (let attempt = 0; attempt < 10 && !orphan; attempt++) {
          await expect(sendWhileBusy(() => send(clusterClient))).resolves.toEqual({});
          await nextCheckPhase();
          orphan = findOrphanedSocket(agent);
        }
        // The request succeeded, but the connector's clean-up kept Node from returning its
        // socket to the pool: the socket stays in use, attached to a request nobody listens to.
        expect(orphan).toBeDefined();
        expect((orphan as TLSSocket).authorized).toBe(true);

        // Without the guard nothing handles the socket's error.
        const closed = new Promise((resolve) => orphan!.once('close', resolve));
        fail(orphan!);
        await closed;

        expect(getSockets(agent)).not.toContain(orphan);
        const warnings = loggingSystemMock.collect(logger).warn;
        expect(warnings).toHaveLength(1);
        expect(warnings[0][0]).toContain(
          'Closed a legacy client socket left attached to a finished request (GET /_plugins/_security/authinfo): '
        );
        expect(warnings[0][0]).toContain(error);
        await expect(send(clusterClient)).resolves.toEqual({});
      }
    );
  });

  // The connector drops an error that is not an `Error` of its own realm. Under Jest, Node's own
  // errors are not, so the client reports a reset as "unknown error".
  test.each([
    [
      'its socket times out',
      'Socket timeout',
      '/hang',
      async (agent: Agent) => {
        while (getSockets(agent).length === 0) {
          await nextCheckPhase();
        }
        getSockets(agent)[0].setTimeout(10);
      },
    ],
    ['its connection is reset', 'unknown error', '/reset', async () => {}],
  ])('a request in flight still gets the error when %s', async (_, error, path, fail) => {
    const clusterClient = new LegacyClusterClient(
      config,
      log,
      auditTrailServiceMock.createAuditorFactory
    );
    try {
      const response = clusterClient.callAsInternalUser('transport.request', {
        method: 'GET',
        path,
        maxRetries: 0,
      });
      await fail(getAgent((clusterClient as any).client));

      await expect(response).rejects.toThrow(error);
      expect(log.warn).not.toHaveBeenCalled();
    } finally {
      closeClusterClient(clusterClient);
    }
  });
});
