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
  public readonly redirectUrl: string | null;

  constructor(err: Error) {
    super(`Session disconnected: ${JSON.stringify(err?.message)}`);

    // Extract location header from 303 responses
    this.redirectUrl = this.extractLocationHeader(err);

    console.info('[SessionDisconnectError] Extracted redirect URL:', this.redirectUrl);
  }

  /**
   * Extracts the location header from HTTP 303 responses
   * @param error - The error object containing response details
   * @returns The location URL if available, null otherwise
   */
  private extractLocationHeader(error: any): string | null {
    // Debug: log the error object structure to understand what we're working with
    console.info('[SessionDisconnectError] Error object structure:', {
      hasResponse: !!error?.response,
      hasRes: !!error?.res,
      responseType: error?.response?.constructor?.name,
      hasHeaders: !!error?.response?.headers,
      headersMethods: error?.response?.headers ? Object.getOwnPropertyNames(error.response.headers) : 'N/A'
    });

    // For HttpFetchError, the response is a browser Response object
    // Headers must be accessed using response.headers.get() method
    let locationHeader: string | null = null;

    if (error?.response?.headers && typeof error.response.headers.get === 'function') {
      // Try both 'location' and 'Location' (case-insensitive)
      locationHeader = error.response.headers.get('location') ||
                      error.response.headers.get('Location');

      console.info('[SessionDisconnectError] Tried response.headers.get():', locationHeader);
    } else if (error?.res?.headers && typeof error.res.headers.get === 'function') {
      // Alternative property name for response
      locationHeader = error.res.headers.get('location') ||
                      error.res.headers.get('Location');

      console.info('[SessionDisconnectError] Tried res.headers.get():', locationHeader);
    }

    // Fallback: check if headers are stored as plain object (for other error types)
    if (!locationHeader) {
      locationHeader = error?.response?.headers?.location ||
                      error?.response?.headers?.Location ||
                      error?.headers?.location ||
                      error?.headers?.Location;

      console.info('[SessionDisconnectError] Tried fallback object access:', locationHeader);
    }

    console.info('[SessionDisconnectError] Final location header:', locationHeader);
    return locationHeader && typeof locationHeader === 'string' ? locationHeader : null;
  }

  public getErrorMessage(application: ApplicationStart) {
    return (
      <>
        {i18n.translate('data.search.sessionDisconnectedMessage', {
          defaultMessage:
            'Your session has timed out. You will be redirected to the login page automatically.',
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

  // 401/403 - Traditional auth errors
  // 303 - See Other redirect (AWS AOSD uses this for session timeout redirects)
  // 302 - Found redirect (some auth systems use this)
  // 307 - Temporary redirect (some auth systems use this)
  if (
    statusCode === 401 ||
    statusCode === 403 ||
    statusCode === 303 ||
    statusCode === 302 ||
    statusCode === 307
  ) {
    return true;
  }

  // Check redirect URLs that indicate login required (from backend redirects)
  const redirectUrl = error?.response?.url || error?.request?.responseURL || error?.config?.url;
  if (typeof redirectUrl === 'string') {
    const loginRedirectPatterns = [
      '/_login', // Standard AOSD login endpoint
      '/IDPSelect.html', // IDC provider selection from backend
      'console.aws.amazon', // AWS console redirect
      'signin.aws.amazon', // AWS signin redirect
    ];

    if (loginRedirectPatterns.some((pattern) => redirectUrl.includes(pattern))) {
      return true;
    }
  }

  // Check error message patterns
  const errorMessage =
    error?.body?.message ||
    error?.message ||
    error?.body?.error ||
    JSON.stringify(error?.body || error);

  if (typeof errorMessage === 'string') {
    const message = errorMessage.toLowerCase();

    // Common session/authentication timeout patterns (from backend + neo)
    const timeoutPatterns = [
      'session expired',
      'session timeout',
      'session invalid',
      'token expired',
      'token invalid',
      'authentication failed',
      'authentication expired',
      'authentication required', // Added from backend error messages
      'unauthorized',
      'not authorized',
      'login required',
      'login expired',
      'credentials expired',
    ];

    return timeoutPatterns.some((pattern) => message.includes(pattern));
  }

  return false;
}
