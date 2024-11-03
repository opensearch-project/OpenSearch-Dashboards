/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { OpenSearchDashboardsRequest, ensureRawRequest } from '../http/router';
import { Logger } from '../logging';

const ACLAuditorKey = Symbol('ACLAuditor');

export const ACLAuditorStateKey = {
  VALIDATE_SUCCESS: 'validateSuccess',
  VALIDATE_FAILURE: 'validateFailure',
  DATABASE_OPERATION: 'databaseOperation',
} as const;

const defaultState = {
  [ACLAuditorStateKey.VALIDATE_SUCCESS]: 0,
  [ACLAuditorStateKey.VALIDATE_FAILURE]: 0,
  [ACLAuditorStateKey.DATABASE_OPERATION]: 0,
};

type ValueOf<T> = T[keyof T];

class ACLAuditor {
  private state = { ...defaultState };

  constructor(private logger: Logger) {}

  reset = () => {
    this.state = { ...defaultState };
  };

  increment = (key: ValueOf<typeof ACLAuditorStateKey>, count: number) => {
    if (typeof count !== 'number' || !this.state.hasOwnProperty(key)) {
      return;
    }

    this.state[key] = this.state[key] + count;
  };

  checkout = (requestInfo?: string) => {
    /**
     * VALIDATE_FAILURE represents the count for unauthorized call to a specific objects
     * VALIDATE_SUCCESS represents the count for authorized call to a specific objects
     * DATABASE_OPERATION represents the count for operations call to the database.
     *
     * Normally the operations call to the database should always <= the AuthZ check(VALIDATE_FAILURE + VALIDATE_SUCCESS)
     * If DATABASE_OPERATION > AuthZ check, it means we have somewhere bypasses the AuthZ check and we should audit this bypass behavior.
     */
    if (
      this.state[ACLAuditorStateKey.VALIDATE_FAILURE] +
        this.state[ACLAuditorStateKey.VALIDATE_SUCCESS] <
      this.state[ACLAuditorStateKey.DATABASE_OPERATION]
    ) {
      this.logger.error(
        `[ACLCounterCheckoutFailed] counter state: ${JSON.stringify(this.state)}, ${
          requestInfo ? `requestInfo: ${requestInfo}` : ''
        }`
      );
    }

    this.reset();
  };

  getState = () => this.state;
}

interface AppState {
  [ACLAuditorKey]?: ACLAuditor;
}

/**
 * This function will be used to initialize a new app state to the request
 *
 * @param request OpenSearchDashboardsRequest
 * @returns void
 */
export const initializeACLAuditor = (request: OpenSearchDashboardsRequest, logger: Logger) => {
  const rawRequest = ensureRawRequest(request);
  const appState: AppState = rawRequest.app;
  const ACLCounterInstance = appState[ACLAuditorKey];

  if (ACLCounterInstance) {
    return;
  }

  appState[ACLAuditorKey] = new ACLAuditor(logger);
};

export const getACLAuditor = (request: OpenSearchDashboardsRequest): ACLAuditor | undefined => {
  return (ensureRawRequest(request).app as AppState)[ACLAuditorKey];
};

export const cleanUpACLAuditor = (request: OpenSearchDashboardsRequest) => {
  (ensureRawRequest(request).app as AppState)[ACLAuditorKey] = undefined;
};
