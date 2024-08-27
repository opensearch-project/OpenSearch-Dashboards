/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ApplicationStart,
  HttpSetup,
  NotificationsStart,
  PublicAppInfo,
} from 'opensearch-dashboards/public';
import { useObservable } from 'react-use';
import { useCallback, useMemo } from 'react';
import { i18n } from '@osd/i18n';
import { getDirectQueryConnections, mergeDataSourcesWithConnections } from './utils';
import { DataSource } from '../common/types';

export function useApplications(applicationInstance: ApplicationStart) {
  const applications = useObservable(applicationInstance.applications$);
  return useMemo(() => {
    const apps: PublicAppInfo[] = [];
    applications?.forEach((app) => {
      apps.push(app);
    });
    return apps;
  }, [applications]);
}
