/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { ExploreFlavor } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { ExploreServices } from '../../types';
import { getFlavorFromAppId } from '../get_flavor_from_app_id';

export const useFlavorId = (): ExploreFlavor | null => {
  const [flavorId, setFlavorId] = useState<ExploreFlavor | null>(null);
  const { services } = useOpenSearchDashboards<ExploreServices>();

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
