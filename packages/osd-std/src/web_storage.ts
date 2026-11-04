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

export interface WritableWebStorage {
  setItem(key: string, value: string): void;
}

/**
 * The name is authoritative; the legacy numeric codes are a fallback for
 * engines that may not set one. Code 22 is never matched alone -- it is also
 * InvalidStateError and SecurityError, which are not quota failures.
 */
export function isQuotaExceededError(e: unknown): boolean {
  if (!e || typeof e !== 'object') {
    return false;
  }
  const err = e as { name?: string; code?: number };

  if (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.name === 'QUOTA_EXCEEDED_ERR'
  ) {
    return true;
  }
  if (err.code === 1014) {
    return true;
  }
  if (err.code === 22 && err.name !== 'InvalidStateError' && err.name !== 'SecurityError') {
    return true;
  }
  return false;
}

/**
 * Write to web storage without crashing when the store is full. The quota is
 * per origin, so a write can be rejected because of data another feature
 * wrote. Returns whether it persisted; non-quota failures still throw.
 * Eviction is left to callers -- what is safe to discard depends on the key.
 */
export function safeSetItem(storage: WritableWebStorage, key: string, value: string): boolean {
  try {
    storage.setItem(key, value);
    return true;
  } catch (e) {
    if (!isQuotaExceededError(e)) {
      throw e;
    }
    return false;
  }
}
