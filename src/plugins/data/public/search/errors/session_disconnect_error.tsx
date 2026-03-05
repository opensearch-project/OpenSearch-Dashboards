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

import React from 'react';
import { i18n } from '@osd/i18n';
import { ApplicationStart } from 'opensearch-dashboards/public';
import { OsdError } from '../../../../opensearch_dashboards_utils/common';

/**
 * Session Disconnect Error - When user session expires (e.g., AWS login timeout)
 * @param {Error} err - the Error that came back
 */
export class SessionDisconnectError extends OsdError {
  constructor(err: Error) {
    super(`Session disconnected: ${JSON.stringify(err?.message)}`);
  }

  public getErrorMessage(application: ApplicationStart) {
    return (
      <>
        {i18n.translate('data.search.sessionDisconnectedMessage', {
          defaultMessage:
            'Your session has expired. Please refresh the page to reconnect and continue your work.',
        })}
      </>
    );
  }
}

/**
 * Checks if an error indicates a session disconnect/authentication failure
 * @param error - The error to check
 * @returns true if the error indicates session disconnect
 */
export function isSessionDisconnectError(error: any): boolean {
  // Check HTTP status codes
  const statusCode = error?.body?.statusCode || error?.status || error?.response?.status;
  if (statusCode === 401 || statusCode === 403) {
    return true;
  }

  // Check error message patterns
  const errorMessage =
    error?.body?.message ||
    error?.message ||
    error?.body?.error ||
    JSON.stringify(error?.body || error);

  if (typeof errorMessage === 'string') {
    const message = errorMessage.toLowerCase();

    // Common session/authentication timeout patterns
    const timeoutPatterns = [
      'session expired',
      'session timeout',
      'session invalid',
      'token expired',
      'token invalid',
      'authentication failed',
      'authentication expired',
      'unauthorized',
      'not authorized',
      'login required',
      'login expired',
      'credentials expired'
    ];

    return timeoutPatterns.some(pattern => message.includes(pattern));
  }

  return false;
}