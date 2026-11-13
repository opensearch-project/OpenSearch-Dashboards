/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * In-memory view state of the JSON trees, kept outside React so that what a user expanded or
 * switched to raw text survives re-renders, pagination and a row being expanded. It is not
 * persisted across page loads.
 *
 * Only trees the user changed have an entry: an untouched tree reads `DEFAULT_JSON_TREE_STATE`.
 * Every change goes through `updateJsonTreeState`, which looks the entry up by key, so a tree
 * never holds on to an entry that is no longer in the store.
 */

export interface JsonTreeState {
  showRaw: boolean;
  // nodeId -> collapsed, only for the nodes the user toggled. A Map, not an object: node ids
  // come from the JSON keys, and a key such as `constructor` must not read Object.prototype.
  collapsed: Map<string, boolean>;
  // nodeId -> number of children rendered, only for the nodes where more were requested
  shown: Map<string, number>;
}

export const createJsonTreeState = (): JsonTreeState => ({
  showRaw: false,
  collapsed: new Map(),
  shown: new Map(),
});

/** What an untouched tree reads. Never mutated: changes create the tree's own entry. */
export const DEFAULT_JSON_TREE_STATE: Readonly<JsonTreeState> =
  Object.freeze(createJsonTreeState());

// Bounds memory when many documents are browsed in one session. Only changed trees count.
export const MAX_TREES = 1000;

// Insertion order is recency order: an entry is moved to the end when it changes, and the first
// entry is the one evicted.
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

/** The state of the tree `key`: its own entry when the user changed it, else the default. */
export const getJsonTreeState = (key: string): Readonly<JsonTreeState> =>
  trees.get(key) ?? DEFAULT_JSON_TREE_STATE;

/**
 * Applies `change` to the state of the tree `key`, creating its entry on the first change. The
 * entry becomes the most recent one; past MAX_TREES the least recently changed is evicted.
 */
export const updateJsonTreeState = (key: string, change: (state: JsonTreeState) => void) => {
  const state = trees.get(key) ?? createJsonTreeState();
  change(state);
  trees.delete(key);
  trees.set(key, state);
  if (trees.size > MAX_TREES) {
    const oldest = trees.keys().next().value;
    if (oldest !== undefined) trees.delete(oldest);
  }
};

/**
 * Identifies the tree of one value, for `JsonTree`'s `stateKey`: the document, the field and a
 * fingerprint of the JSON text. Some results make up document ids that repeat across queries
 * (streaming PPL numbers its rows `<generation>:<index>`, from 0 for every query), so the id
 * alone could hand one document's choices to another. With the fingerprint, a different value
 * under the same id starts from the default, and the same document queried again keeps them.
 */
export const jsonTreeStateKey = (
  scope: string,
  hit: { _index?: string; _id?: string } | undefined,
  field: string,
  rawText: string
): string | undefined =>
  hit?._id !== undefined
    ? `${scope}/${hit._index}/${hit._id}/${field}/${fingerprint(rawText)}`
    : undefined;

// A polynomial hash (mod the prime 2^31 - 1, so it stays exact in a double) and the length of
// the text: cheap next to the JSON.parse the text goes through.
const fingerprint = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 2147483647;
  }
  return `${text.length}:${hash.toString(36)}`;
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
