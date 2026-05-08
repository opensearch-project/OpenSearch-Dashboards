/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AgentTracesFlavor } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { AgentTracesServices } from '../../types';
import { getFlavorFromAppId } from '../get_flavor_from_app_id';

export const useFlavorId = (): AgentTracesFlavor | null => {
  // For agentTraces plugin, default to Traces flavor
  // This ensures TracesTable renders on initial mount before subscription fires
  const [flavorId, setFlavorId] = useState<AgentTracesFlavor | null>(AgentTracesFlavor.Traces);
  const { services } = useOpenSearchDashboards<AgentTracesServices>();

  useEffect(() => {
    const subscription = services.core.application.currentAppId$.subscribe((value) => {
      const flavorFromAppId = getFlavorFromAppId(value);
      setFlavorId(flavorFromAppId);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [services.core.application.currentAppId$]);

  return flavorId;
};
