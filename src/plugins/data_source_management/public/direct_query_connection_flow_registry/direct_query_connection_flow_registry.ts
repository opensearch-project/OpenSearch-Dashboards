/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { CoreStart } from 'src/core/public';

/**
 * Minimal structural view of a `data-connection` saved object that is handed to
 * {@link DirectQueryConnectionFlow.ownsConnection}.
 */
export interface DirectQueryConnectionFlowSavedObject {
  id: string;
  attributes: Record<string, any>;
  workspaces?: string[];
}

export interface DirectQueryConnectionFlowMountParams {
  /** Container the flow renders into. */
  element: HTMLElement;
  /** Sub-path after `/flows/<id>`, e.g. `''` (create page) or `'/manage/<savedObjectId>'`. */
  path: string;
  /** Navigate within the flow. `''` is the create page, `'/manage/<id>'` a manage page. */
  navigate: (subPath: string) => void;
  /** Navigate back to the Direct query connections tab of the data sources app. */
  navigateToList: () => void;
  core: CoreStart;
}

/**
 * A pluggable "connect a direct query data source" experience that is rendered inside the
 * data sources management app under `/flows/<id>`.
 */
export interface DirectQueryConnectionFlow {
  /** Unique id, used in the URL (`/flows/<id>`). */
  id: string;
  title: string;
  /** Label of the header button rendered on the Direct query connections tab. */
  buttonLabel: string;
  description?: string;
  /**
   * Label shown in the Type column of the Direct query connections table for the connections this
   * flow owns (see `ownsConnection`), e.g. "Example data connection". Optional: without it (or when
   * blank) the row shows the stored `attributes.type`. The stored value itself is never changed.
   */
  typeLabel?: string;
  /** Defaults to visible. A rejected promise or a thrown error hides the flow (fail closed). */
  isVisible?: () => Promise<boolean> | boolean;
  /** Renders the flow into `params.element` and returns an unmount callback. */
  mount: (params: DirectQueryConnectionFlowMountParams) => (() => void) | Promise<() => void>;
  /**
   * Whether the given `data-connection` saved object is managed by this flow. Owned rows in the
   * Direct query connections table link to `/flows/<id>/manage/<savedObjectId>`.
   */
  ownsConnection?: (savedObject: DirectQueryConnectionFlowSavedObject) => boolean;
}

export type IDirectQueryConnectionFlowRegistry = Omit<
  DirectQueryConnectionFlowRegistry,
  'registerDirectQueryConnectionFlow'
>;

const FLOW_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;

export class DirectQueryConnectionFlowRegistry {
  private readonly flows = new Map<string, DirectQueryConnectionFlow>();

  /**
   * Register a direct query connection flow. A flow id can only be registered once; subsequent
   * calls with the same id will throw an error.
   */
  public registerDirectQueryConnectionFlow(flow: DirectQueryConnectionFlow) {
    if (!flow || typeof flow.id !== 'string' || !FLOW_ID_PATTERN.test(flow.id)) {
      throw new Error(
        `Direct query connection flow id '${flow?.id}' is invalid; it must match ${FLOW_ID_PATTERN}`
      );
    }
    if (typeof flow.mount !== 'function') {
      throw new Error(`Direct query connection flow '${flow.id}' must provide a mount function`);
    }
    if (this.flows.has(flow.id)) {
      throw new Error(`Direct query connection flow '${flow.id}' is already registered`);
    }
    this.flows.set(flow.id, Object.freeze({ ...flow }));
  }

  public hasFlows() {
    return this.flows.size > 0;
  }

  public getAllFlows() {
    return [...this.flows.values()];
  }

  public getFlow(id: string) {
    return this.flows.get(id);
  }

  /**
   * Returns the first registered flow that owns the given saved object, if any. A throwing
   * `ownsConnection` is treated as "not owned".
   */
  public findOwningFlow(savedObject: DirectQueryConnectionFlowSavedObject) {
    return findOwningDirectQueryConnectionFlow(this.getAllFlows(), savedObject);
  }
}

/**
 * Returns the first of the given flows that owns the given saved object, if any. A throwing
 * `ownsConnection` is treated as "not owned".
 */
export const findOwningDirectQueryConnectionFlow = (
  flows: DirectQueryConnectionFlow[],
  savedObject: DirectQueryConnectionFlowSavedObject
): DirectQueryConnectionFlow | undefined => {
  for (const flow of flows) {
    if (!flow.ownsConnection) continue;
    try {
      if (flow.ownsConnection(savedObject) === true) {
        return flow;
      }
    } catch (e) {
      // fail closed: a broken predicate never claims a connection
    }
  }
  return undefined;
};

/**
 * Resolves a flow's visibility. Missing `isVisible` means visible; any error or rejection means
 * hidden.
 */
export const isDirectQueryConnectionFlowVisible = async (
  flow: DirectQueryConnectionFlow
): Promise<boolean> => {
  if (!flow.isVisible) {
    return true;
  }
  try {
    return (await flow.isVisible()) === true;
  } catch (e) {
    return false;
  }
};

/**
 * Resolves the visibility of all given flows and returns the visible ones, preserving order.
 */
export const getVisibleDirectQueryConnectionFlows = async (
  flows: DirectQueryConnectionFlow[]
): Promise<DirectQueryConnectionFlow[]> => {
  const visibility = await Promise.all(flows.map(isDirectQueryConnectionFlowVisible));
  return flows.filter((_, i) => visibility[i]);
};
