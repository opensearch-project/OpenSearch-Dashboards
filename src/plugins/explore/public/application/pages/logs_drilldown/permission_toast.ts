/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../types';

/**
 * Was this failure a 4xx client error (typically 403 permission denied / 401 auth)? The drilldown
 * hits several APIs (resolve_index/cat.indices for the list + metadata, PPL search for previews and
 * histograms); a locked-down role can 4xx on any of them. We detect the status from the several
 * shapes OSD/opensearch-js surface it in, plus a text fallback for security-plugin messages.
 */
export const isClientAuthError = (e: unknown): boolean => {
  const err = e as
    | { statusCode?: number; status?: number; body?: { statusCode?: number; status?: number } }
    | undefined;
  const status =
    err?.statusCode ?? err?.status ?? err?.body?.statusCode ?? err?.body?.status ?? undefined;
  if (typeof status === 'number' && status >= 400 && status < 500) return true;
  const raw = e instanceof Error ? e.message : String(e ?? '');
  return /\b40[13]\b|forbidden|unauthorized|not authorized|no permissions for|security_exception/i.test(
    raw
  );
};

/**
 * Show a SINGLE permission-denied toast for the whole Logs Drilldown view, no matter how many of its
 * API calls 4xx. The drilldown fires up to three kinds of request (index list/metadata via
 * resolve_index + cat.indices, and per-card PPL preview/histogram); without this guard a locked-down
 * role would get a burst of identical toasts. The flag resets when a new view mounts (see reset()).
 */
let shown = false;

export const resetPermissionToast = (): void => {
  shown = false;
};

export const notifyPermissionDenied = (services: ExploreServices): void => {
  if (shown) return;
  shown = true;
  services.notifications.toasts.addWarning({
    title: i18n.translate('explore.logsDrilldown.permissionToast.title', {
      defaultMessage: 'Some index details are unavailable',
    }),
    text: i18n.translate('explore.logsDrilldown.permissionToast.text', {
      defaultMessage: 'Index health & size unavailable — check permissions.',
    }),
  });
};

/** If the error is a 4xx auth/permission error, surface the one-time toast. Returns whether it was. */
export const maybeNotifyPermissionDenied = (services: ExploreServices, e: unknown): boolean => {
  if (!isClientAuthError(e)) return false;
  notifyPermissionDenied(services);
  return true;
};
