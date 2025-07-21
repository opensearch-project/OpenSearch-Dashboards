/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ExploreFlavor } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';

export const useFlavorId = (): ExploreFlavor | null => {
  const [flavorId, setFlavorId] = useState<ExploreFlavor | null>(null);
  const { services } = useOpenSearchDashboards<ExploreServices>();

  useEffect(() => {
    const subscription = services.core.application.currentAppId$.subscribe((value) => {
      const flavorFromAppId = value?.split('/')?.[1];
      if (flavorFromAppId) {
        setFlavorId(flavorFromAppId as ExploreFlavor);
      } else {
        setFlavorId(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [services.core.application.currentAppId$]);

  return flavorId;
};
