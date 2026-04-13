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

import { i18n } from '@osd/i18n';
import { HttpSetup } from './types';
import { NotificationsSetup } from '../notifications';

const SESSION_REDIRECT_DELAY_MS = 5000;

/**
 * Validates that a redirect URL is safe to navigate to.
 * Only allows relative URLs or URLs on the same origin to prevent open redirect attacks.
 */
function isValidRedirectURL(url: string): boolean {
  // Allow relative URLs (starting with /)
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // Allow same-origin absolute URLs
  try {
    const parsed = new URL(url);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function setupSessionExpiredInterceptor(http: HttpSetup, notifications: NotificationsSetup) {
  let isRedirecting = false;

  http.intercept({
    responseError(httpErrorResponse, controller) {
      const response = httpErrorResponse.response;

      if (response && response.status === 401 && !isRedirecting) {
        const redirectURL = response.headers.get('X-Auth-Redirect-URL');

        if (redirectURL && isValidRedirectURL(redirectURL)) {
          isRedirecting = true;

          notifications.toasts.addWarning(
            {
              title: i18n.translate('core.http.sessionExpiredToastTitle', {
                defaultMessage: 'Session expired',
              }),
              text: i18n.translate('core.http.sessionExpiredToastText', {
                defaultMessage: 'Your session has expired. Redirecting to the login page...',
              }),
            },
            { toastLifeTimeMs: SESSION_REDIRECT_DELAY_MS }
          );

          // Halt the interceptor chain first to prevent downstream error handlers
          // from firing for this 401 response.
          controller.halt();

          setTimeout(() => {
            // Reset the flag before redirecting so that if the redirect fails
            // (e.g. navigation is blocked), subsequent 401s can still trigger
            // the toast and redirect flow again.
            isRedirecting = false;
            window.location.href = redirectURL;
          }, SESSION_REDIRECT_DELAY_MS);
        }
      }
    },
  });
}
