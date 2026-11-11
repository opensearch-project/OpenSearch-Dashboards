/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { ExploreServices } from '../../../types';

/** HTTP status of a failed request, from the several shapes OSD/opensearch-js surface it in. */
export const getErrorStatus = (e: unknown): number | undefined => {
  const err = e as
    | {
        statusCode?: number;
        status?: number;
        body?: { statusCode?: number; status?: number };
        response?: { status?: number };
      }
    | undefined;
  return (
    err?.statusCode ??
    err?.status ??
    err?.body?.statusCode ??
    err?.body?.status ??
    err?.response?.status ??
    undefined
  );
};

const SECURITY_MESSAGE =
  /forbidden|unauthorized|not authorized|no permissions for|security_exception/i;

/**
 * Was this failure an auth/permission error? The drilldown hits several APIs (resolve_index /
 * cat.indices for the list + metadata, PPL search for previews and histograms), and a locked-down
 * role can be denied on any of them. True for a 401/403, or for a security-plugin message. Any
 * other status (e.g. 400 for an unsupported request, 404 for an API the engine doesn't expose) is
 * not a permission problem unless its message says so.
 */
export const isClientAuthError = (e: unknown): boolean => {
  const status = getErrorStatus(e);
  if (status === 401 || status === 403) return true;
  // HttpFetchError carries a generic `message` (e.g. "Bad Request") and the engine's reason in
  // `body.message`, so check both.
  const err = e as { message?: unknown; body?: { message?: unknown } } | undefined;
  const messages = [err?.message, err?.body?.message].filter((m) => typeof m === 'string');
  const raw = messages.length ? messages.join(' ') : String(e ?? '');
  if (typeof status === 'number') return SECURITY_MESSAGE.test(raw);
  return /\b40[13]\b/.test(raw) || SECURITY_MESSAGE.test(raw);
};

/**
 * Show a SINGLE permission-denied toast for the whole Logs Drilldown view, no matter how many of its
 * API calls are denied. The drilldown fires up to three kinds of request (index list/metadata via
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

/** If the error is an auth/permission error (see isClientAuthError), surface the one-time toast. Returns whether it was. */
export const maybeNotifyPermissionDenied = (services: ExploreServices, e: unknown): boolean => {
  if (!isClientAuthError(e)) return false;
  notifyPermissionDenied(services);
  return true;
};
