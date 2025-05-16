/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { EuiText } from '@elastic/eui';
import { Observable } from 'rxjs';
import { useObservable } from 'react-use';

interface Props {
  currentAppId$: Observable<string | undefined>;
}

export const DashboardDirectQuerySync: React.FC<Props> = ({ currentAppId$ }) => {
  const appId = useObservable(currentAppId$);
  const [dashboardId, setDashboardId] = useState<string | undefined>(undefined);

  const updateRouteInfo = () => {
    const hash = window.location.hash;
    const isDashboardViewMatch = hash.match(/#\/view\/([^\/?]+)(\?.*)?$/);
    if (isDashboardViewMatch && isDashboardViewMatch[1]) {
      const newDashboardId = isDashboardViewMatch[1];
      setDashboardId(newDashboardId);
      console.log('Current Dashboard ID:', newDashboardId); // Log the dashboard ID for verification
    } else {
      setDashboardId(undefined);
    }
  };

  // Initial check on mount
  useEffect(() => {
    updateRouteInfo();

    // Listen for hash changes to handle in-app navigation
    window.addEventListener('hashchange', updateRouteInfo);

    // Cleanup the event listener on unmount
    return () => {
      window.removeEventListener('hashchange', updateRouteInfo);
    };
  }, []);

  // Hide the component if not on a dashboard view page or not in the Dashboard app
  if (appId !== 'dashboards' || !dashboardId) {
    return null;
  }

  return (
    <EuiText size="m">
      Data scheduled to sync every x mins. Last sync: 3 minutes ago. Synchronize Now
    </EuiText>
  );
};
