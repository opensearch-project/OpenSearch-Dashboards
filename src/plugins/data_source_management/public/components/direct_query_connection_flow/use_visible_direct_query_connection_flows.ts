/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  DirectQueryConnectionFlow,
  IDirectQueryConnectionFlowRegistry,
  isDirectQueryConnectionFlowAllowed,
} from '../../direct_query_connection_flow_registry';

const NO_FLOWS: DirectQueryConnectionFlow[] = [];

/**
 * The registered flows that are visible, in registration order. Each flow's visibility is
 * resolved on its own, so a slow or hung `isVisible` only keeps that flow out of the list; the
 * others appear as soon as they are known.
 *
 * @param registry the flow registry, if any
 * @param canManageDataSources whether the user can manage data sources (`dataSource.canManage`):
 * a flow that requires it (the default, see `requiresDataSourceManagement`) is hidden without it
 */
export const useVisibleDirectQueryConnectionFlows = (
  registry: IDirectQueryConnectionFlowRegistry | undefined,
  canManageDataSources: boolean
): DirectQueryConnectionFlow[] => {
  const [visibleIds, setVisibleIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setVisibleIds(new Set());
    if (!registry?.hasFlows()) {
      return;
    }
    let cancelled = false;
    registry
      .getAllFlows()
      .filter((flow) => isDirectQueryConnectionFlowAllowed(flow, canManageDataSources))
      .forEach((flow) => {
        registry.isFlowVisible(flow.id).then((visible) => {
          if (!cancelled && visible) {
            setVisibleIds((ids) => new Set(ids).add(flow.id));
          }
        });
      });
    return () => {
      cancelled = true;
    };
  }, [registry, canManageDataSources]);

  return useMemo(() => {
    if (!registry || visibleIds.size === 0) {
      return NO_FLOWS;
    }
    return registry.getAllFlows().filter((flow) => visibleIds.has(flow.id));
  }, [registry, visibleIds]);
};

const NO_VISIBILITY: ReadonlyMap<string, boolean> = new Map();

/**
 * Each registered flow's visibility once it is known (flow id to visible). A flow that is not in
 * the map yet is still being resolved, so a page can tell "still loading" from "none". Each flow
 * is resolved on its own, from the registry's shared results, as in
 * `useVisibleDirectQueryConnectionFlows`.
 *
 * @param registry the flow registry, if any
 * @param canManageDataSources whether the user can manage data sources (`dataSource.canManage`):
 * a flow that requires it (the default, see `requiresDataSourceManagement`) is known to be hidden
 * without it
 */
export const useDirectQueryConnectionFlowVisibility = (
  registry: IDirectQueryConnectionFlowRegistry | undefined,
  canManageDataSources: boolean
): ReadonlyMap<string, boolean> => {
  const [visibility, setVisibility] = useState<ReadonlyMap<string, boolean>>(NO_VISIBILITY);

  useEffect(() => {
    if (!registry?.hasFlows()) {
      setVisibility(NO_VISIBILITY);
      return;
    }
    const flows = registry.getAllFlows();
    // A flow the user may not have is known to be hidden at once; the others are resolved.
    setVisibility(
      new Map(
        flows
          .filter((flow) => !isDirectQueryConnectionFlowAllowed(flow, canManageDataSources))
          .map((flow) => [flow.id, false])
      )
    );
    let cancelled = false;
    flows
      .filter((flow) => isDirectQueryConnectionFlowAllowed(flow, canManageDataSources))
      .forEach((flow) => {
        registry.isFlowVisible(flow.id).then((visible) => {
          if (!cancelled) {
            setVisibility((known) => new Map(known).set(flow.id, visible));
          }
        });
      });
    return () => {
      cancelled = true;
    };
  }, [registry, canManageDataSources]);

  return visibility;
};
