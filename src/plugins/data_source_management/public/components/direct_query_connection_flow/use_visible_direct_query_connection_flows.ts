/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  DirectQueryConnectionFlow,
  IDirectQueryConnectionFlowRegistry,
} from '../../direct_query_connection_flow_registry';

const NO_FLOWS: DirectQueryConnectionFlow[] = [];

/**
 * The registered flows that are visible, in registration order. Each flow's visibility is
 * resolved on its own, so a slow or hung `isVisible` only keeps that flow out of the list; the
 * others appear as soon as they are known.
 *
 * @param registry the flow registry, if any
 * @param enabled whether flows apply at all (e.g. the user can manage data sources)
 */
export const useVisibleDirectQueryConnectionFlows = (
  registry: IDirectQueryConnectionFlowRegistry | undefined,
  enabled: boolean
): DirectQueryConnectionFlow[] => {
  const [visibleIds, setVisibleIds] = useState<ReadonlySet<string>>(new Set());

  useEffect(() => {
    setVisibleIds(new Set());
    if (!enabled || !registry?.hasFlows()) {
      return;
    }
    let cancelled = false;
    registry.getAllFlows().forEach((flow) => {
      registry.isFlowVisible(flow.id).then((visible) => {
        if (!cancelled && visible) {
          setVisibleIds((ids) => new Set(ids).add(flow.id));
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [registry, enabled]);

  return useMemo(() => {
    if (!enabled || !registry || visibleIds.size === 0) {
      return NO_FLOWS;
    }
    return registry.getAllFlows().filter((flow) => visibleIds.has(flow.id));
  }, [registry, enabled, visibleIds]);
};
