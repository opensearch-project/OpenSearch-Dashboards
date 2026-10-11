/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * In-memory view state of the JSON trees, kept outside React so that what a user expanded or
 * switched to raw text survives re-renders, pagination and a row being expanded. It is not
 * persisted across page loads.
 */

export interface JsonTreeState {
  showRaw: boolean;
  // nodeId -> collapsed, only for the nodes the user toggled
  collapsed: Record<string, boolean>;
  // nodeId -> number of children rendered, only for the nodes where more were requested
  shown: Record<string, number>;
}

// Bounds memory when many documents are browsed in one session.
const MAX_TREES = 1000;

let trees = new Map<string, JsonTreeState>();
let expandAll = false;
let version = 0;
const listeners = new Set<() => void>();

const notify = () => {
  version++;
  listeners.forEach((listener) => listener());
};

export const subscribeJsonTrees = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** Changes whenever every tree must drop its own state (expand all / collapse all). */
export const getJsonTreesVersion = () => version;

export const isExpandAllJsonTrees = () => expandAll;

/** Returns the state stored for `key`, creating it when missing. */
export const getJsonTreeState = (key: string): JsonTreeState => {
  let state = trees.get(key);
  if (!state) {
    if (trees.size >= MAX_TREES) trees.clear();
    state = { showRaw: false, collapsed: {}, shown: {} };
    trees.set(key, state);
  }
  return state;
};

/** Expands every node of every tree, discarding per-tree choices. */
export const expandAllJsonTrees = () => {
  trees = new Map();
  expandAll = true;
  notify();
};

/** Collapses every tree back to its root fields, discarding per-tree choices. */
export const collapseAllJsonTrees = () => {
  trees = new Map();
  expandAll = false;
  notify();
};
