/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { useMount } from 'react-use';
import { useLocation } from 'react-router-dom';
import {
  useOpenSearchDashboards,
  TableListView,
} from '../../../../../opensearch_dashboards_react/public';
import { CreateButton } from './create_button';
import { DashboardConstants, createDashboardEditUrl } from '../../../dashboard_constants';
import { DashboardServices } from '../../../types';
import { getTableColumns } from '../../utils/get_table_columns';
import { getNoItemsMessage } from '../../utils/get_no_items_message';
import { syncQueryStateWithUrl } from '../../../../../data/public';

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
      dashboardProviders,
      data: { query },
      osdUrlStateStorage,
    },
  } = useOpenSearchDashboards<DashboardServices>();

  const location = useLocation();
  const queryParameters = useMemo(() => new URLSearchParams(location.search), [location]);
  const initialFiltersFromURL = queryParameters.get('filter');
  const [initialFilter, setInitialFilter] = useState<string | null>(initialFiltersFromURL);

  useEffect(() => {
    // syncs `_g` portion of url with query services
    const { stop } = syncQueryStateWithUrl(query, osdUrlStateStorage);

    return () => stop();

    // this effect should re-run when pathname is changed to preserve querystring part,
    // so the global state is always preserved
  }, [query, osdUrlStateStorage, location]);

  useEffect(() => {
    const getDashboardsBasedOnUrl = async () => {
      const title = queryParameters.get('title');

      try {
        if (title) {
          const results = await savedObjectsClient.find<any>({
            search: `"${title}"`,
            searchFields: ['title'],
            type: 'dashboard',
          });

          const matchingDashboards = results.savedObjects.filter(
            (dashboard) => dashboard.attributes.title.toLowerCase() === title.toLowerCase()
          );

          if (matchingDashboards.length === 1) {
            history.replace(createDashboardEditUrl(matchingDashboards[0].id));
          } else {
            history.replace(`${DashboardConstants.LANDING_PAGE_PATH}?filter="${title}"`);
            setInitialFilter(title);
            // Reload here is needed since we are using a URL param to render the table
            // Previously, they called $route.reload() on angular routing
            history.go(0);
          }
          return new Promise(() => {});
        }
      } catch (e) {
        notifications.toasts.addWarning(
          i18n.translate('dashboard.listing. savedObjectWarning', {
            defaultMessage: 'Unable to filter by title',
          })
        );
      }
    };
    getDashboardsBasedOnUrl();
  }, [savedObjectsClient, history, notifications.toasts, queryParameters]);

  const hideWriteControls = dashboardConfig.getHideWriteControls();

  const tableColumns = useMemo(() => getTableColumns(application, history, uiSettings), [
    application,
    history,
    uiSettings,
  ]);

  const createItem = useCallback(() => {
    history.push(DashboardConstants.CREATE_NEW_DASHBOARD_URL);
  }, [history]);

  const noItemsFragment = useMemo(
    () => getNoItemsMessage(hideWriteControls, createItem, application),
    [hideWriteControls, createItem, application]
  );

  const dashboardProvidersForListing = dashboardProviders() || {};

  const dashboardListTypes = Object.keys(dashboardProvidersForListing);
  const initialPageSize = savedObjectsPublic.settings.getPerPage();
  const listingLimit = savedObjectsPublic.settings.getListingLimit();

  const mapListAttributesToDashboardProvider = (obj: any) => {
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

  const find = async (search: any) => {
    const res = await savedObjectsClient.find({
      type: dashboardListTypes,
      search: search ? `${search}*` : undefined,
      fields: ['title', 'type', 'description', 'updated_at'],
      perPage: listingLimit,
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

  const editItem = useCallback(
    ({ appId, editUrl }: any) => {
      if (appId === 'dashboard') {
        history.push(editUrl);
      } else {
        application.navigateToUrl(editUrl);
      }
    },
    [history, application]
  );

  // TODO: Currently, dashboard listing is using a href to view items.
  // Dashboard listing should utilize a callback to take us away from using a href in favor
  // of using onClick.
  //
  // https://github.com/opensearch-project/OpenSearch-Dashboards/issues/3365
  //
  // const viewItem = useCallback(
  //   ({ appId, viewUrl }: any) => {
  //     if (appId === 'dashboard') {
  //       history.push(viewUrl);
  //     } else {
  //       application.navigateToUrl(viewUrl);
  //     }
  //   },
  //   [history, application]
  // );

  const deleteItems = useCallback(
    async (dashboards: object[]) => {
      await Promise.all(
        dashboards.map((dashboard: any) => savedObjectsClient.delete(dashboard.appId, dashboard.id))
      ).catch((error) => {
        notifications.toasts.addError(error, {
          title: i18n.translate('dashboard.dashboardListingDeleteErrorTitle', {
            defaultMessage: 'Error deleting dashboard',
          }),
        });
      });
    },
    [savedObjectsClient, notifications]
  );

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
        hideWriteControls ? undefined : <CreateButton dashboardProviders={dashboardProviders()} />
      }
      findItems={find}
      deleteItems={hideWriteControls ? undefined : deleteItems}
      editItem={hideWriteControls ? undefined : editItem}
      tableColumns={tableColumns}
      listingLimit={listingLimit}
      initialFilter={initialFilter ?? ''}
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
    />
  );
};
