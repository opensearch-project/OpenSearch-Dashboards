/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { BehaviorSubject } from 'rxjs';

/**
 * Boxed so consumers can hold it in React state: a bare function handed to a state setter is
 * treated as an updater callback and invoked instead of stored.
 */
export interface SaveSearchAction {
  run: () => void;
}

/**
 * The header "Save search" action, republished so the query panel footer's Saved searches popover
 * can offer the same thing.
 *
 * Assembling the action needs the saved object plus the live search context, and `TopNav` — which
 * already has both — is a *sibling* of the query panel, not an ancestor. Re-deriving them in the
 * footer would issue a second fetch and hand the footer a different saved-object instance than the
 * one the header saves, so the two entry points could disagree about what "the current search" is.
 *
 * `undefined` means "no save target yet" (no mounted TopNav, or nothing loaded); consumers should
 * disable their control rather than render a no-op.
 */
const saveSearchAction$ = new BehaviorSubject<SaveSearchAction | undefined>(undefined);

export const setSaveSearchRun = (run?: () => void) => {
  saveSearchAction$.next(run ? { run } : undefined);
};

export const getSaveSearchAction$ = () => saveSearchAction$;
