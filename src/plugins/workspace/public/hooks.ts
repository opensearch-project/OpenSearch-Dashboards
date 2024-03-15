/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart, PublicAppInfo } from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { useMemo } from 'react';

export function useApplications(application: ApplicationStart) {
  const applications = useObservable(application.applications$);
  return useMemo(() => {
    const apps: PublicAppInfo[] = [];
    applications?.forEach((app) => {
      apps.push(app);
    });
    return apps;
  }, [applications]);
}
