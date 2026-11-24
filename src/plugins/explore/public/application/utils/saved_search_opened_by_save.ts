/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Saving a new search (or a copy) moves the page to the saved search's URL, which loads the saved
 * search like any other. The page already shows what was saved, and possibly unrun edits in the
 * editor that the save didn't store, so loading it must not reset the editor or the results.
 *
 * The save marks the id it is about to open; the page initialization takes the mark when it loads
 * that id, and clears it when the load fails. Any other id clears it too, so a later visit to the
 * same saved search loads normally.
 */
let openedBySaveId: string | undefined;

export const markSavedSearchOpenedBySave = (id: string) => {
  openedBySaveId = id;
};

/** Whether the saved search with this id is being opened by its own save. Clears the mark. */
export const takeSavedSearchOpenedBySave = (id: string | undefined): boolean => {
  const openedBySave = !!id && id === openedBySaveId;
  openedBySaveId = undefined;
  return openedBySave;
};
