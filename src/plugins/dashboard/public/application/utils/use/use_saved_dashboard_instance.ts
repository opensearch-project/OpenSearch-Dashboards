import { i18n } from '@osd/i18n';
import { parse } from 'query-string';
import { EventEmitter } from 'events';
import { useEffect, useRef, useState } from 'react';
import  { redirectWhenMissing, SavedObjectNotFound } from '../../../../../opensearch_dashboards_utils/public'
import { DashboardServices } from '../../../types';
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
        savedDashboardInstance?: any
    }>({})

    const dashboardEditorRef = useRef<HTMLDivElement>(null)
    const dashboardId = useRef('')

    useEffect(() => {
      const getSavedDashboardInstance = async () => {
        const {
          application: { navigateToApp },
          data,
          chrome,
          history,
          http: { basePath },
          notifications,
          savedDashboards
        } = services;
        try{
          console.log("trying to get saved dashboard")
          let savedDashboardInstance: any;
          if (history.location.pathname === '/create'){
              try{
                  savedDashboardInstance = await savedDashboards.get()
                  //console.log("saved dashboard", savedDashboardInstance)
              } catch {
                  redirectWhenMissing({
                      history,
                      basePath,
                      navigateToApp: navigateToApp,
                      mapping: {
                        dashboard: DashboardConstants.LANDING_PAGE_PATH,
                      },
                      toastNotifications: notifications.toasts,
                    })
              }
          } else if (dashboardIdFromUrl){
              try{
                  savedDashboardInstance = await savedDashboards.get(dashboardIdFromUrl)
                  chrome.recentlyAccessed.add(
                      savedDashboardInstance.getFullPath(),
                      savedDashboardInstance.title,
                      dashboardIdFromUrl
                    );
                    console.log("saved dashboard", savedDashboardInstance)
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

          setState({savedDashboardInstance})

        } catch (error) {

         
       }
      }

      if (isChromeVisible === undefined){
        // waiting for specifying chrome
        return;
      }
  
      if (!dashboardId.current){
        dashboardId.current =  dashboardIdFromUrl || 'new'
        getSavedDashboardInstance()
      }
      else if(dashboardIdFromUrl && dashboardId.current!=dashboardIdFromUrl
        && state.savedDashboardInstance?.id !== dashboardIdFromUrl){
          dashboardId.current = dashboardIdFromUrl
          setState({})
          getSavedDashboardInstance()
      }
    },[
      eventEmitter,
      isChromeVisible,
      services,
      state.savedDashboardInstance,
      dashboardIdFromUrl
    ])

    return {
      ...state
    } 
}