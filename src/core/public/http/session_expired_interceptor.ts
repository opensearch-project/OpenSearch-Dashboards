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

import { HttpSetup } from './types';
import { NotificationsSetup } from '../notifications';

const SESSION_REDIRECT_DELAY_MS = 5000;

export function setupSessionExpiredInterceptor(http: HttpSetup, notifications: NotificationsSetup) {
  let isRedirecting = false;

  http.intercept({
    responseError(httpErrorResponse, controller) {
      const response = httpErrorResponse.response;

      if (response && response.status === 401 && !isRedirecting) {
        const redirectURL = response.headers.get('X-Auth-Redirect-URL');

        if (redirectURL) {
          isRedirecting = true;

          notifications.toasts.addWarning(
            {
              title: 'Session expired',
              text: 'Your session has expired. Redirecting to the login page...',
            },
            { toastLifeTimeMs: SESSION_REDIRECT_DELAY_MS }
          );

          setTimeout(() => {
            window.location.href = redirectURL;
          }, SESSION_REDIRECT_DELAY_MS);

          controller.halt();
        }
      }
    },
  });
}
