/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ChromeBreadcrumb, CoreStart, ScopedHistory } from 'src/core/public';
import { DataConnectionType } from '../../../data_source/common';

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
  /**
   * History scoped to the flow, `/flows/<id>`: its locations are relative to the flow, so a flow
   * can render its own `Router` with it. The flow's own sub-routes are `''` (the create page) and
   * `'/manage/<savedObjectId>'` (the manage page of a connection the flow owns, linked from the
   * Direct query connections table); both are stable. A flow may add other sub-routes. The flow
   * stays mounted while the location stays under `/flows/<id>`.
   */
  history: ScopedHistory;
  /** Sets the data sources app's breadcrumbs, as `ManagementAppMountParams.setBreadcrumbs` does. */
  setBreadcrumbs: (crumbs: ChromeBreadcrumb[]) => void;
  /**
   * Sub-path after `/flows/<id>` when the flow is mounted, e.g. `''` (create page) or
   * `'/manage/<savedObjectId>'`. A helper over `history.location.pathname`; later changes are
   * reported through `onPathChange`.
   */
  path: string;
  /**
   * Navigate within the flow, a helper over `history.push`. `''` is the create page,
   * `'/manage/<id>'` a manage page; a missing leading slash is added. The flow stays mounted: the
   * new sub-path is reported through `onPathChange`.
   */
  navigate: (subPath: string) => void;
  /**
   * Subscribes to sub-path changes while the flow is mounted, whether they come from `navigate`
   * or from outside the flow (browser back and forward, a link to another page of the same flow).
   * A helper over `history.listen`. On subscribe, the listener is told the current sub-path at once
   * if it differs from `path` (it changed while an async `mount` was pending). Returns an
   * unsubscribe function. The flow is mounted once per visit to `/flows/<id>`, so a flow that
   * renders more than one page without its own router reads its current page from here.
   */
  onPathChange: (listener: (path: string) => void) => () => void;
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
  /**
   * Label shown in the Type column of the Direct query connections table for the connections this
   * flow owns (see `ownsConnection`), e.g. "Example data connection". Optional: without it (or when
   * blank) the row shows the stored `attributes.type`. The stored value itself is never changed.
   */
  typeLabel?: string;
  /**
   * Defaults to visible. A rejected promise or a thrown error hides the flow for that check (fail
   * closed) and is logged; the next check calls `isVisible` again. Use it for capability or feature
   * checks: flows can only be registered during setup, so a flow that depends on something known
   * only at start registers unconditionally and decides here.
   *
   * A result is shared by the data sources app's home panel, connections table and flow route, and
   * reused for the page load, so it must be cheap, idempotent and free of side effects. Each flow is
   * resolved on its own: a slow `isVisible` only delays its own flow.
   */
  isVisible?: () => Promise<boolean> | boolean;
  /**
   * Renders the flow into `params.element` and returns an unmount callback. Called once per visit
   * to `/flows/<id>`: navigating between the flow's own pages does not unmount it (see
   * `params.onPathChange`).
   */
  mount: (params: DirectQueryConnectionFlowMountParams) => (() => void) | Promise<() => void>;
  /**
   * Whether the given `data-connection` saved object is managed by this flow. Owned rows in the
   * Direct query connections table link to `/flows/<id>/manage/<savedObjectId>`.
   *
   * Ownership convention: decide from the saved object's own attributes (for example a marker
   * attribute the flow writes when it creates the connection), and treat the attributes as
   * untrusted, raw saved-object values. A flow's connections use their own `attributes.type`
   * value: claims on a connection whose `type` is a built-in `DataConnectionType` are ignored. A
   * plugin that also registers a workspace data source association filter should use the same
   * predicate there, so both extension points agree on which connections it governs. At most one
   * visible flow should claim a connection; when more than one does, the first registered wins.
   */
  ownsConnection?: (savedObject: DirectQueryConnectionFlowSavedObject) => boolean;
}

export type IDirectQueryConnectionFlowRegistry = Omit<
  DirectQueryConnectionFlowRegistry,
  'registerDirectQueryConnectionFlow'
>;

const FLOW_ID_PATTERN = /^[A-Za-z0-9_.-]+$/;

const BUILT_IN_DATA_CONNECTION_TYPES = new Set<string>(Object.values(DataConnectionType));

export class DirectQueryConnectionFlowRegistry {
  private readonly flows = new Map<string, DirectQueryConnectionFlow>();
  // Each flow's resolved visibility, so one slow or hung `isVisible` only delays its own flow. A
  // check that failed is not kept, so the next call asks the flow again.
  private readonly visibility = new Map<string, Promise<boolean>>();

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
   * The visible flows, in registration order. Waits for every flow's `isVisible`; callers that
   * must not be held up by one slow flow use `isFlowVisible` per flow instead.
   */
  public async getVisibleFlows(): Promise<DirectQueryConnectionFlow[]> {
    const flows = this.getAllFlows();
    const visibility = await Promise.all(flows.map((flow) => this.isFlowVisible(flow.id)));
    return flows.filter((_, i) => visibility[i]);
  }

  /**
   * Whether the flow with the given id is registered and visible. Waits only on that flow's own
   * `isVisible`. A successful result is resolved once and shared by every caller, so the home
   * panel, the connections table and the flow route agree; a failed check is logged, counts as
   * hidden, and is retried on the next call.
   */
  public isFlowVisible(id: string): Promise<boolean> {
    const flow = this.getFlow(id);
    if (!flow) {
      return Promise.resolve(false);
    }
    const cached = this.visibility.get(id);
    if (cached) {
      return cached;
    }
    const visible = resolveDirectQueryConnectionFlowVisibility(flow).then(
      ({ visible: v, failed }) => {
        if (failed && this.visibility.get(id) === visible) {
          this.visibility.delete(id);
        }
        return v;
      }
    );
    this.visibility.set(id, visible);
    return visible;
  }
}

/**
 * Returns the first of the given flows that owns the given saved object, if any. A throwing
 * `ownsConnection` is logged and treated as "not owned", and claims on a connection whose
 * `attributes.type` is a built-in `DataConnectionType` are ignored. Outside production builds, a
 * warning names the flows when more than one claims the same connection.
 */
export const findOwningDirectQueryConnectionFlow = (
  flows: DirectQueryConnectionFlow[],
  savedObject: DirectQueryConnectionFlowSavedObject
): DirectQueryConnectionFlow | undefined => {
  const type = savedObject?.attributes?.type;
  if (typeof type === 'string' && BUILT_IN_DATA_CONNECTION_TYPES.has(type)) {
    return undefined;
  }
  const owners: DirectQueryConnectionFlow[] = [];
  for (const flow of flows) {
    if (!flow.ownsConnection) continue;
    try {
      if (flow.ownsConnection(savedObject) === true) {
        owners.push(flow);
        if (process.env.NODE_ENV === 'production') break;
      }
    } catch (e) {
      // fail closed: a broken predicate never claims a connection
      // eslint-disable-next-line no-console
      console.error(
        `Direct query connection flow '${flow.id}': ownsConnection threw for saved object '${savedObject?.id}'`,
        e
      );
    }
  }
  if (owners.length > 1) {
    // eslint-disable-next-line no-console
    console.warn(
      `Direct query connection flows ${owners
        .map((flow) => `'${flow.id}'`)
        .join(', ')} all claim saved object '${savedObject.id}'; '${owners[0].id}' is used.`
    );
  }
  return owners[0];
};

const resolveDirectQueryConnectionFlowVisibility = async (
  flow: DirectQueryConnectionFlow
): Promise<{ visible: boolean; failed: boolean }> => {
  if (!flow.isVisible) {
    return { visible: true, failed: false };
  }
  try {
    return { visible: (await flow.isVisible()) === true, failed: false };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Direct query connection flow '${flow.id}': isVisible failed`, e);
    return { visible: false, failed: true };
  }
};

/**
 * Resolves a flow's visibility. Missing `isVisible` means visible; an error or a rejection is
 * logged and means hidden.
 */
export const isDirectQueryConnectionFlowVisible = async (
  flow: DirectQueryConnectionFlow
): Promise<boolean> => (await resolveDirectQueryConnectionFlowVisibility(flow)).visible;
