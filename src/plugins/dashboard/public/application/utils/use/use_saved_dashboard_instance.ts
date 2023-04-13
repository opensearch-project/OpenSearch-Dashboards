import { i18n } from '@osd/i18n';
import { parse } from 'query-string';
import { EventEmitter } from 'events';
import { useEffect, useRef, useState } from 'react';
import  { redirectWhenMissing, SavedObjectNotFound } from '../../../../../opensearch_dashboards_utils/public'
import { DashboardServices } from '../../types';
import { DashboardConstants } from '../../../dashboard_constants';

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
    const [state, setState] = useState<{
        savedDashboardInstance?: savedDashboardInstance
    }>

    const dashboardEditorRef = useRef<HTMLDivElement>(null)
    const dashboardId = useRef('')

    const getSavedDashboardInstance = async () => {
        const {
            application: { navigateToApp },
            data,
            chrome,
            history,
            http: { basePath },
            setActiveUrl,
            notifications,
            savedDashboards
          } = services;
        try{
            let savedDashboardInstance: SavedDashboardInstance;
            if (history.location.pathname === '/create'){
                try{
                    savedDashboardInstance = await savedDashboards.get()
                } catch {
                    redirectWhenMissing({
                        history,
                        navigateToApp: navigateToApp,
                        mapping: {
                          dashboard: DashboardConstants.LANDING_PAGE_PATH,
                        },
                        toastNotifications: notifications.toasts,
                      })
                }
            } else {
                try{
                    savedDashboardInstance = await savedDashboards.get(dashboardIdFromUrl)
                    chrome.recentlyAccessed.add(
                        savedDashboardInstance.getFullPath(),
                        savedDashboardInstance.title,
                        dashboardIdFromUrl
                      );
                } catch (error){
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

        } catch (error) {

        }

    }

    useEffect(() => {

        if (isChromeVisible === undefined){
            return;
        }

        if (!dashboardId.current){

        }
    })

}