/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Agent, ClientRequest } from 'http';
import { Duplex } from 'stream';
import { Logger } from '../../logging';

/** The request a pooled socket is serving: Node's `_httpMessage`, which agentkeepalive reads too. */
type PooledSocket = Duplex & { _httpMessage?: ClientRequest | null };

/**
 * Returns a `createNodeAgent` hook for legacy `elasticsearch` clients. It creates the agent the
 * connector would create, and logs a warning instead of crashing the server when a socket times
 * out or fails while attached to a request that has already finished.
 * https://github.com/opensearch-project/OpenSearch-Dashboards/issues/12791
 *
 * @param log - Logger for the socket errors the hook handles.
 * @public
 */
export const getLegacyNodeAgentFactory =
  (log: Logger) =>
  (connector: { createAgent(config: unknown): Agent }, config: unknown): Agent => {
    const agent = connector.createAgent(config);
    const createConnection = agent.createConnection;
    // Both agents the connector can create return the new socket synchronously.
    agent.createConnection = function guardedCreateConnection(options, callback) {
      const socket = createConnection.call(this, options, callback);
      if (socket) {
        guardSocket(socket, log);
      }
      return socket;
    };
    return agent;
  };

function guardSocket(socket: PooledSocket, log: Logger) {
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
    // counts too, so log it here rather than let it vanish. A timeout passes no error.
    if (err && socket.listenerCount('error') <= 2) {
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
