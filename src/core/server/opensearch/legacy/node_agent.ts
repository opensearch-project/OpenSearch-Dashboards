/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agent, ClientRequest } from 'http';
import { Duplex } from 'stream';
import { Logger } from '../../logging';

/** The request a pooled socket is serving: Node's `_httpMessage`, which agentkeepalive reads too. */
type PooledSocket = Duplex & { _httpMessage?: ClientRequest | null };

/** The parts of the legacy client's `HttpConnector` the hook uses. */
interface LegacyHttpConnector {
  createAgent(config: unknown): Agent;
  /** The `http` or `https` module the connector sends its requests with. */
  hand?: { request?: (...args: unknown[]) => ClientRequest };
}

/**
 * Returns a `createNodeAgent` hook for legacy `elasticsearch` clients. It creates the agent the
 * connector would create, and keeps the connector from leaking that agent's sockets. It also logs
 * a warning instead of crashing the server when a socket times out or fails while attached to a
 * request that has already finished.
 * https://github.com/opensearch-project/OpenSearch-Dashboards/issues/12791
 *
 * @param log - Logger for the socket errors the hook handles.
 * @public
 */
export const getLegacyNodeAgentFactory =
  (log: Logger) =>
  (connector: LegacyHttpConnector, config: unknown): Agent => {
    keepNodeRequestListeners(connector);
    const agent = connector.createAgent(config);
    const createConnection = agent.createConnection.bind(agent);
    // Both agents the connector can create return the new socket synchronously.
    agent.createConnection = (options, callback) => {
      const socket = createConnection(options, callback);
      if (socket) {
        guardSocket(socket, log);
      }
      return socket;
    };
    return agent;
  };

/**
 * Makes the connector's clean-up remove only its own listener from the requests it sends. Its
 * `removeAllListeners()` would also remove Node's, which returns the socket to the pool when the
 * response ends before the request has finished.
 */
function keepNodeRequestListeners(connector: LegacyHttpConnector) {
  const { hand } = connector;
  if (!hand || typeof hand.request !== 'function') {
    return;
  }
  connector.hand = Object.create(hand, {
    request: {
      value: (...args: unknown[]) => {
        const req = hand.request!(...args);
        const { removeAllListeners } = req;
        // The clean-up passes no event, and its only listener left on the request is for errors.
        req.removeAllListeners = function (this: ClientRequest, ...events: [(string | symbol)?]) {
          return removeAllListeners.apply(this, events.length > 0 ? events : ['error']);
        };
        return req;
      },
    },
  });
}

function guardSocket(socket: PooledSocket, log: Logger) {
  // The agent's own error listeners, installed before the socket is returned to us.
  const agentErrorListeners = socket.listenerCount('error');
  const adopt = (err?: Error) => {
    const request = socket._httpMessage;
    if (request) {
      if (request.listenerCount('error') === 0) {
        request.on('error', (requestErr: Error) => {
          warn(
            log,
            `Closed a legacy client socket left attached to a finished request (${request.method} ${request.path}): ${requestErr.message}`
          );
        });
      }
      return;
    }
    // agentkeepalive re-emits a socket error only when its listener is the only one, and this one
    // counts too. If only the agent's listeners and this one remain, log the error rather than
    // let it vanish. A timeout passes no error.
    if (err && socket.listenerCount('error') <= agentErrorListeners + 1) {
      warn(log, `Closed a legacy client socket with no request attached: ${err.message}`);
    }
  };
  // Ahead of agentkeepalive's timeout handler, which destroys the socket with an error, and of
  // Node's socket error handler, which passes the error on to the request.
  socket.prependListener('timeout', adopt);
  socket.prependListener('error', adopt);
}

/** Called from error listeners, where a throwing logger would crash the server. */
function warn(log: Logger, message: string) {
  try {
    log.warn(message);
  } catch {
    // Ignore.
  }
}
