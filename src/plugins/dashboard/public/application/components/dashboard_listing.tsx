/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useMemo, } from 'react';
import { i18n } from '@osd/i18n';
import { parse } from 'query-string';
import { useMount } from 'react-use';
import { useLocation } from 'react-router-dom';
import {
  useOpenSearchDashboards,
  TableListView,
} from '../../../../opensearch_dashboards_react/public';
import { DashboardServices } from '../types';
import { CreateButton } from '../listing/create_button';
import { getTableColumns } from '../utils/get_table_columns';
import { getNoItemsMessage } from '../utils/get_no_items_message';
import { DashboardConstants } from '../../dashboard_constants'

export const EMPTY_FILTER = '';

export const DashboardListing = () => {
  const {
    services: {
      application,
      chrome,
      savedObjectsPublic,
      savedObjectsClient,
      dashboardConfig,
      history,
      uiSettings,
      notifications,
      savedDashboards,
      dashboardProviders,
      addBasePath,
    },
  } = useOpenSearchDashboards<DashboardServices>();

  const { pathname } = useLocation();
  const hideWriteControls = dashboardConfig.getHideWriteControls();
  const initialFilter = parse(history.location.search).filter || EMPTY_FILTER;

  const tableColumns = useMemo(() => getTableColumns(application, history, uiSettings), [
    application,
    history,
    uiSettings,
  ]);

  const createItem = () => {
    history.push(DashboardConstants.CREATE_NEW_DASHBOARD_URL)
  };

  const noItemsFragment = useMemo(
    () => getNoItemsMessage(hideWriteControls, createItem, application),
    [hideWriteControls, createItem, application]
  );

  const dashboardProvidersForListing = dashboardProviders() || {};

  const dashboardListTypes = Object.keys(dashboardProvidersForListing);
  const initialPageSize = savedObjectsPublic.settings.getPerPage();

  const mapListAttributesToDashboardProvider = (obj:any) => {
            const provider = dashboardProvidersForListing[obj.type];
            return {
              id: obj.id,
              appId: provider.appId,
              type: provider.savedObjectsName,
              ...obj.attributes,
              updated_at: obj.updated_at,
              viewUrl: provider.viewUrlPathFn(obj),
              editUrl: provider.editUrlPathFn(obj),
            };
          };

    const find = async (search:any) => {
            const res = await savedObjectsClient.find({
              type: dashboardListTypes,
              search: search ? `${search}*` : undefined,
              fields: ['title', 'type', 'description', 'updated_at'],
              perPage: initialPageSize,
              page: 1,
              searchFields: ['title^3', 'type', 'description'],
              defaultSearchOperator: 'AND',
            });
            const list = res.savedObjects?.map(mapListAttributesToDashboardProvider) || [];

            return {
              total: list.length,
              hits: list,
            };
          };

  const editItem = useCallback (
    ({ editUrl }:any) => {
      if(addBasePath){
        history.push(addBasePath(editUrl));
      }
  },
  [history]
  )

  const viewItem = useCallback (
    ({ viewUrl }:any) => {
      if(addBasePath){
        history.push(addBasePath(viewUrl));
      }
  },
  [history]
  )

  const deleteItems = useCallback ((dashboards: object[]) => {
    return savedDashboards.delete(dashboards.map((d:any) => d.id));
  }, 
  [savedDashboards]);

  useMount(() => {
    chrome.setBreadcrumbs([
      {
        text: i18n.translate('dashboard.dashboardBreadcrumbsTitle', {
          defaultMessage: 'Dashboards',
        }),
      },
    ]);

    chrome.docTitle.change(
      i18n.translate('dashboard.dashboardPageTitle', { defaultMessage: 'Dashboards' })
    );
  });

  return (
    <TableListView
      headingId="dashboardListingHeading"
      createItem={hideWriteControls ? undefined : createItem}
      createButton={
        hideWriteControls ? undefined : <CreateButton dashboardProviders={dashboardProviders() || {}} />
      }
      findItems={find}
      deleteItems={hideWriteControls ? undefined : deleteItems}
      editItem={hideWriteControls ? undefined : editItem}
      viewItem={hideWriteControls ? undefined : viewItem}
      tableColumns={tableColumns}
      listingLimit={savedObjectsPublic.settings.getListingLimit()}
      initialFilter={''}
      initialPageSize={initialPageSize}
      noItemsFragment={noItemsFragment}
      entityName={i18n.translate('dashboard.listing.table.entityName', {
        defaultMessage: 'dashboard',
      })}
      entityNamePlural={i18n.translate('dashboard.listing.table.entityNamePlural', {
        defaultMessage: 'dashboards',
      })}
      tableListTitle={i18n.translate('dashboard.listing.dashboardsTitle', {
        defaultMessage: 'Dashboards',
      })}
      toastNotifications={notifications.toasts}
      uiSettings={uiSettings}
    />
  );
};
