/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSyncExternalStore } from 'react';
import { Dataset } from '../../../../data/common';

export interface PPLRunner {
  executeQuery(dataset: Dataset, pplQuery: string): Promise<unknown>;
}

const CHECK_TTL_MS = 5 * 60_000;

const FIELD_NOT_FOUND = /FIELD_NOT_FOUND|can't resolve Symbol|Field \[[^\]]*\] not found/i;

export const isFieldNotFound = (error: unknown): boolean => {
  const parts: unknown[] = [error];
  if (error && typeof error === 'object') {
    const e = error as { message?: unknown; body?: unknown };
    parts.push(e.message, e.body);
  }
  return parts.some((part) => {
    if (part === undefined || part === null) return false;
    const text = typeof part === 'string' ? part : JSON.stringify(part);
    return FIELD_NOT_FOUND.test(text ?? '');
  });
};

export interface FieldMappingCheck {
  /**
   * Checks once per dataset (re-checked after a few minutes, so a newly mapped field is picked
   * up) whether the field is in the index mapping. A one-row query on the field fails while it is
   * unmapped.
   */
  ensureChecked(
    ppl: PPLRunner | undefined,
    dataset: Dataset | undefined | null,
    sourceCommand: string
  ): Promise<void>;
  /** The field was found in the mapping. */
  isPresent(datasetId: string | undefined): boolean;
  /** The field was reported missing. A check that has not run or failed otherwise is neither. */
  isMissing(datasetId: string | undefined): boolean;
  /** A check for the dataset is running. */
  isChecking(datasetId: string | undefined): boolean;
  /** Changes whenever a check result changes; use in memo dependencies or to re-render. */
  useVersion(): number;
  /** For tests and callers that already know the mapping. */
  setPresent(datasetId: string, present: boolean): void;
  /** For tests. */
  reset(): void;
}

/** Remembers, per dataset, whether a field is in the index mapping. */
export const createFieldMappingCheck = (fieldPPL: string): FieldMappingCheck => {
  const checks = new Map<string, { at: number; present: boolean }>();
  const pending = new Map<string, Promise<void>>();
  let version = 0;
  const listeners = new Set<() => void>();
  const notify = () => {
    version += 1;
    listeners.forEach((listener) => listener());
  };
  const record = (datasetId: string, present: boolean) => {
    const changed = checks.get(datasetId)?.present !== present;
    checks.set(datasetId, { at: Date.now(), present });
    if (changed) notify();
  };
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  };

  return {
    ensureChecked: async (ppl, dataset, sourceCommand) => {
      if (!ppl || !dataset?.id || !sourceCommand) return;
      const cached = checks.get(dataset.id);
      if (cached && Date.now() - cached.at < CHECK_TTL_MS) return;
      const inFlight = pending.get(dataset.id);
      if (inFlight) return inFlight;
      const check = ppl
        .executeQuery(dataset, `${sourceCommand} | where isnotnull(${fieldPPL}) | head 1`)
        .then(
          () => record(dataset.id, true),
          (error: unknown) => {
            // Cache "unmapped" only when the field is reported missing; a timeout or 5xx is
            // retried on the next query instead of hiding data for the whole cache period.
            if (isFieldNotFound(error)) record(dataset.id, false);
          }
        )
        .then(() => undefined)
        .finally(() => {
          pending.delete(dataset.id);
          notify();
        });
      pending.set(dataset.id, check);
      notify();
      return check;
    },
    isPresent: (datasetId) => !!datasetId && !!checks.get(datasetId)?.present,
    isMissing: (datasetId) => !!datasetId && checks.get(datasetId)?.present === false,
    isChecking: (datasetId) => !!datasetId && pending.has(datasetId),
    useVersion: () => useSyncExternalStore(subscribe, () => version),
    setPresent: record,
    reset: () => {
      checks.clear();
      pending.clear();
    },
  };
};
