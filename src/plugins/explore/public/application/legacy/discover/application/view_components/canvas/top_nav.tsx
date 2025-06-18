/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from 'opensearch-dashboards/public';
import { Query, TimeRange } from '../../../../../../../../data/common';
import { QueryStatus, useSyncQueryStateWithUrl } from '../../../../../../../../data/public';
import { createOsdUrlStateStorage } from '../../../../../../../../opensearch_dashboards_utils/public';
import { useOpenSearchDashboards } from '../../../../../../../../opensearch_dashboards_react/public';
import { RequestAdapter } from '../../../../../../../../inspector/public';
import { PLUGIN_ID } from '../../../../../../../common';
import { ExploreServices } from '../../../../../../types';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getTopNavLinks } from '../../components/top_nav/get_top_nav_links';
import { useDispatch, useSelector } from '../../utils/state_management';
import { setSavedQuery } from '../../../../../utils/state_management/slices/legacy_slice';
import { useIndexPatternContext } from '../../../../../components/index_pattern_context';

import './discover_canvas.scss';
import { TopNavMenuItemRenderType } from '../../../../../../../../navigation/public';
import { ResultStatus } from '../utils';
import {
  selectSavedQuery,
  selectSavedSearch,
} from '../../../../../utils/state_management/selectors';
import { SavedExplore } from '../../../../../../saved_explore';

export interface TopNavProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
    onQuerySubmit: (payload: { dateRange: TimeRange; query?: Query }, isUpdate?: boolean) => void;
    optionalRef?: Record<string, React.RefObject<HTMLDivElement>>;
  };
  showSaveQuery: boolean;
  isEnhancementsEnabled?: boolean;
}

export const TopNav = ({ opts, showSaveQuery, isEnhancementsEnabled }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<ExploreServices>();
  const dispatch = useDispatch();

  const savedExploreId = useSelector(selectSavedSearch);
  const savedQueryId = useSelector(selectSavedQuery);
  const isLoading = useSelector((state: any) => state.ui.status === ResultStatus.LOADING);

  // Replace inspectorAdapters
  const inspectorAdapters = useMemo(() => ({ requests: new RequestAdapter() }), []);

  // Replace savedSearch - use legacy state
  // const savedSearch = useMemo(() => {
  //   return legacyState?.savedSearch;
  // }, [legacyState?.savedSearch]);

  // Get IndexPattern from centralized context
  const { indexPattern } = useIndexPatternContext();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);
  const [screenTitle, setScreenTitle] = useState<string>('');
  const [queryStatus, setQueryStatus] = useState<QueryStatus>({ status: ResultStatus.READY });
  const [savedExplore, setSavedExplore] = useState<SavedExplore>();

  const {
    navigation: {
      ui: { TopNavMenu },
    },
    data,
    uiSettings,
    history,
    getSavedExploreById,
  } = services;

  useEffect(() => {
    const loadSavedExplore = async () => {
      const savedObject = await getSavedExploreById(savedExploreId);
      setSavedExplore(savedObject);
    };
    loadSavedExplore();
  }, [savedExploreId, getSavedExploreById]);

  // Create osdUrlStateStorage from storage
  const osdUrlStateStorage = useMemo(() => {
    return createOsdUrlStateStorage({
      useHash: uiSettings.get('state:storeInSessionStorage', false),
      history: history(),
    });
  }, [uiSettings, history]);

  const { startSyncingQueryStateWithUrl } = useSyncQueryStateWithUrl(
    data.query,
    osdUrlStateStorage
  );
  const showActionsInGroup = uiSettings.get('home:useNewHomePage');
  // const showActionsInGroup = false; // Use portal approach to display actions in nav bar

  const topNavLinks = getTopNavLinks(
    services,
    inspectorAdapters,
    startSyncingQueryStateWithUrl,
    savedExplore // Provide empty object if savedSearch is null
  );

  // Replace data$ subscription with Redux state-based queryStatus
  useEffect(() => {
    const status = isLoading ? ResultStatus.LOADING : ResultStatus.READY;
    setQueryStatus({ status });
  }, [isLoading]);

  useEffect(() => {
    let isMounted = true;
    const initializeDataset = async () => {
      await data.indexPatterns.ensureDefaultIndexPattern();
      const defaultIndexPattern = await data.indexPatterns.getDefault();
      if (!isMounted) return;

      setIndexPatterns(defaultIndexPattern ? [defaultIndexPattern] : undefined);
    };

    initializeDataset();

    return () => {
      isMounted = false;
    };
  }, [data.indexPatterns, data.query]);

  useEffect(() => {
    setScreenTitle(
      savedExplore?.title ||
        i18n.translate('explore.discover.savedSearch.newTitle', {
          defaultMessage: 'New search',
        })
    );
  }, [savedExplore?.title]);

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
      data={data}
      showSearchBar={false}
      showDatePicker={showDatePicker && TopNavMenuItemRenderType.IN_PORTAL}
      showSaveQuery={showSaveQuery}
      useDefaultBehaviors
      setMenuMountPoint={opts.setHeaderActionMenu}
      indexPatterns={indexPattern ? [indexPattern] : indexPatterns}
      onQuerySubmit={opts.onQuerySubmit}
      savedQueryId={savedQueryId}
      onSavedQueryIdChange={updateSavedQueryId}
      datasetSelectorRef={opts?.optionalRef?.datasetSelectorRef}
      datePickerRef={opts?.optionalRef?.datePickerRef}
      groupActions={showActionsInGroup}
      screenTitle={screenTitle}
      queryStatus={queryStatus}
      showQueryBar={false}
    />
  );
};
