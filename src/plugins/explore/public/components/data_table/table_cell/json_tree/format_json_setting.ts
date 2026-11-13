/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useSyncExternalStore } from 'react';

/**
 * Whether string values that hold JSON are shown as a tree: a per-user choice from the table
 * settings, on by default and remembered in the browser.
 *
 * Kept out of the Redux UI state on purpose: that state is written to the URL (`_a`), and a
 * shared link must not replace the recipient's own choice. Storage is read once, on first use,
 * and every table cell then reads the value from memory.
 */

const STORAGE_KEY = 'explore:formatJson';
const DEFAULT_FORMAT_JSON = true;

let current: boolean | undefined;
const listeners = new Set<() => void>();

/** The stored choice; undefined when none was stored or storage is unavailable. */
const readStored = (): boolean | undefined => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
    return undefined;
  } catch (e) {
    return undefined;
  }
};

export const getFormatJson = (): boolean => {
  if (current === undefined) current = readStored() ?? DEFAULT_FORMAT_JSON;
  return current;
};

/** Sets the choice for this user, remembers it in the browser and re-renders the tables. */
export const setFormatJson = (enabled: boolean) => {
  current = enabled;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch (e) {
    // Storage can be unavailable (private mode, blocked site data); the choice then lasts
    // until the page is reloaded.
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useFormatJson = (): boolean => useSyncExternalStore(subscribe, getFormatJson);

/** Forgets the value read from storage, so the next read reads it again. For tests. */
export const resetFormatJsonForTests = () => {
  current = undefined;
};
