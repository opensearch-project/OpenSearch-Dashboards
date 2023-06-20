/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EventEmitter } from 'events';
import { useEffect, useRef, useState } from 'react';
import {
  redirectWhenMissing,
  SavedObjectNotFound,
} from '../../../../../opensearch_dashboards_utils/public';
import { DashboardConstants } from '../../../dashboard_constants';
import { DashboardServices } from '../../../types';

/**
 * This effect is responsible for instantiating a saved dashboard or creating a new one
 * using url parameters, embedding and destroying it in DOM
 */
export const useSavedDashboardInstance = (
  services: DashboardServices,
  eventEmitter: EventEmitter,
  isChromeVisible: boolean | undefined,
  dashboardIdFromUrl: string | undefined
) => {
  const [savedDashboardInstance, setSavedDashboardInstance] = useState<any>();
  const dashboardId = useRef('');

  useEffect(() => {
    const {
      application: { navigateToApp },
      chrome,
      history,
      http: { basePath },
      notifications,
      savedDashboards,
    } = services;

    const getSavedDashboardInstance = async () => {
      try {
        console.log('trying to get saved dashboard');
        let savedDashboard: any;
        if (history.location.pathname === '/create') {
          try {
            savedDashboard = await savedDashboards.get();
          } catch {
            redirectWhenMissing({
              history,
              basePath,
              navigateToApp,
              mapping: {
                dashboard: DashboardConstants.LANDING_PAGE_PATH,
              },
              toastNotifications: notifications.toasts,
            });
          }
        } else if (dashboardIdFromUrl) {
          try {
            savedDashboard = await savedDashboards.get(dashboardIdFromUrl);
            chrome.recentlyAccessed.add(
              savedDashboard.getFullPath(),
              savedDashboard.title,
              dashboardIdFromUrl
            );
            console.log('saved dashboard', savedDashboard);
          } catch (error) {
            // Preserve BWC of v5.3.0 links for new, unsaved dashboards.
            // See https://github.com/elastic/kibana/issues/10951 for more context.
            if (error instanceof SavedObjectNotFound && dashboardIdFromUrl === 'create') {
              // Note preserve querystring part is necessary so the state is preserved through the redirect.
              history.replace({
                ...history.location, // preserve query,
                pathname: DashboardConstants.CREATE_NEW_DASHBOARD_URL,
              });

              notifications.toasts.addWarning(
                i18n.translate('dashboard.urlWasRemovedInSixZeroWarningMessage', {
                  defaultMessage:
                    'The url "dashboard/create" was removed in 6.0. Please update your bookmarks.',
                })
              );
              return new Promise(() => {});
            } else {
              // E.g. a corrupt or deleted dashboard
              notifications.toasts.addDanger(error.message);
              history.push(DashboardConstants.LANDING_PAGE_PATH);
              return new Promise(() => {});
            }
          }
        }

        setSavedDashboardInstance(savedDashboard);
      } catch (error) {}
    };

    if (isChromeVisible === undefined) {
      // waiting for specifying chrome
      return;
    }

    if (!dashboardId.current) {
      dashboardId.current = dashboardIdFromUrl || 'new';
      getSavedDashboardInstance();
    } else if (
      dashboardIdFromUrl &&
      dashboardId.current !== dashboardIdFromUrl &&
      savedDashboardInstance?.id !== dashboardIdFromUrl
    ) {
      dashboardId.current = dashboardIdFromUrl;
      setSavedDashboardInstance({});
      getSavedDashboardInstance();
    }
  }, [eventEmitter, isChromeVisible, services, savedDashboardInstance, dashboardIdFromUrl]);

  return savedDashboardInstance;
};
