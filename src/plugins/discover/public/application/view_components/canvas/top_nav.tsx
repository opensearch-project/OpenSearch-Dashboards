/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Query, TimeRange } from 'src/plugins/data/common';
import { AppMountParameters } from '../../../../../../core/public';
import { connectStorageToQueryState, opensearchFilters } from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../../common';
import { DiscoverViewServices } from '../../../build_services';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getTopNavLinks } from '../../components/top_nav/get_top_nav_links';
import { getRootBreadcrumbs } from '../../helpers/breadcrumbs';
import { useDiscoverContext } from '../context';
import { useDispatch, setSavedQuery, useSelector } from '../../utils/state_management';

export interface TopNavProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
    onQuerySubmit: (payload: { dateRange: TimeRange; query?: Query }, isUpdate?: boolean) => void;
  };
  showSaveQuery: boolean;
}

export const TopNav = ({ opts, showSaveQuery }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { inspectorAdapters, savedSearch, indexPattern } = useDiscoverContext();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);
  const state = useSelector((s) => s.discover);
  const dispatch = useDispatch();

  const {
    navigation: {
      ui: { TopNavMenu },
    },
    core: {
      application: { getUrlForApp },
    },
    data,
    chrome,
    osdUrlStateStorage,
  } = services;

  const topNavLinks = savedSearch ? getTopNavLinks(services, inspectorAdapters, savedSearch) : [];

  connectStorageToQueryState(services.data.query, osdUrlStateStorage, {
    filters: opensearchFilters.FilterStateStore.APP_STATE,
    query: true,
  });

  useEffect(() => {
    let isMounted = true;
    const getDefaultIndexPattern = async () => {
      await data.indexPatterns.ensureDefaultIndexPattern();
      const defaultIndexPattern = await data.indexPatterns.getDefault();

      if (!isMounted) return;

      setIndexPatterns(defaultIndexPattern ? [defaultIndexPattern] : undefined);
    };

    getDefaultIndexPattern();

    return () => {
      isMounted = false;
    };
  }, [data.indexPatterns]);

  useEffect(() => {
    const pageTitleSuffix = savedSearch?.id && savedSearch.title ? `: ${savedSearch.title}` : '';
    chrome.docTitle.change(`Discover${pageTitleSuffix}`);

    if (savedSearch?.id) {
      chrome.setBreadcrumbs([...getRootBreadcrumbs(), { text: savedSearch.title }]);
    } else {
      chrome.setBreadcrumbs([...getRootBreadcrumbs()]);
    }
  }, [chrome, getUrlForApp, savedSearch?.id, savedSearch?.title]);

  const showDatePicker = useMemo(() => (indexPattern ? indexPattern.isTimeBased() : false), [
    indexPattern,
  ]);

  const updateSavedQueryId = (newSavedQueryId: string | undefined) => {
    dispatch(setSavedQuery(newSavedQueryId));
  };

  return (
    <TopNavMenu
      appName={PLUGIN_ID}
      config={topNavLinks}
      showSearchBar
      showDatePicker={showDatePicker}
      showSaveQuery={showSaveQuery}
      useDefaultBehaviors
      setMenuMountPoint={opts.setHeaderActionMenu}
      indexPatterns={indexPattern ? [indexPattern] : indexPatterns}
      // TODO after
      // https://github.com/opensearch-project/OpenSearch-Dashboards/pull/6833
      // is ported to main, pass dataSource to TopNavMenu by picking
      // commit 328e08e688c again.
      onQuerySubmit={opts.onQuerySubmit}
      savedQueryId={state.savedQuery}
      onSavedQueryIdChange={updateSavedQueryId}
    />
  );
};
