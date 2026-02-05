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
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const currentAppId$ = services.core.application.currentAppId$;

  // Seed the initial state synchronously. currentAppId$ is a BehaviorSubject
  // that already has the app ID by the time components mount, so subscribing
  // captures the value immediately. This avoids a null → value transition that
  // causes downstream components (e.g., DatasetSelect) to fetch data twice.
  const [flavorId, setFlavorId] = useState<ExploreFlavor | null>(() => {
    let initial: ExploreFlavor | null = null;
    const sub = currentAppId$.subscribe((value) => {
      initial = getFlavorFromAppId(value);
    });
    sub.unsubscribe();
    return initial;
  });

  useEffect(() => {
    const subscription = currentAppId$.subscribe((value) => {
      setFlavorId(getFlavorFromAppId(value));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentAppId$]);

  return flavorId;
};
