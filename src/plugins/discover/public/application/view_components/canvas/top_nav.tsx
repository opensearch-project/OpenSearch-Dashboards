/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Query, TimeRange } from 'src/plugins/data/common';
import { createPortal } from 'react-dom';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from '../../../../../../core/public';
import {
  useConnectStorageToQueryState,
  opensearchFilters,
  QueryStatus,
  useSyncQueryStateWithUrl,
} from '../../../../../data/public';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { PLUGIN_ID } from '../../../../common';
import { DiscoverViewServices } from '../../../build_services';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getTopNavLinks } from '../../components/top_nav/get_top_nav_links';
import { getRootBreadcrumbs } from '../../helpers/breadcrumbs';
import { useDiscoverContext } from '../context';
import { useDispatch, setSavedQuery, useSelector } from '../../utils/state_management';

import './discover_canvas.scss';
import { TopNavMenuItemRenderType } from '../../../../../navigation/public';
import { ResultStatus } from '../utils';

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
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { data$, inspectorAdapters, savedSearch, indexPattern } = useDiscoverContext();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);
  const [screenTitle, setScreenTitle] = useState<string>('');
  const [queryStatus, setQueryStatus] = useState<QueryStatus>({ status: ResultStatus.READY });
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
    uiSettings,
  } = services;

  const { startSyncingQueryStateWithUrl } = useSyncQueryStateWithUrl(
    data.query,
    osdUrlStateStorage
  );
  const showActionsInGroup = uiSettings.get('home:useNewHomePage');

  const topNavLinks = savedSearch
    ? getTopNavLinks(
        services,
        inspectorAdapters,
        savedSearch,
        startSyncingQueryStateWithUrl,
        isEnhancementsEnabled
      )
    : [];

  const syncConfig = useMemo(() => {
    return {
      filters: opensearchFilters.FilterStateStore.APP_STATE,
      query: true,
    };
  }, []);

  useConnectStorageToQueryState(services.data.query, osdUrlStateStorage, syncConfig);

  useEffect(() => {
    const subscription = data$.subscribe((queryData) => {
      const result = {
        status: queryData.status,
        ...queryData.queryStatus,
      };
      setQueryStatus(result);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [data$]);

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
    const pageTitleSuffix = savedSearch?.id && savedSearch.title ? `: ${savedSearch.title}` : '';
    chrome.docTitle.change(`Discover${pageTitleSuffix}`);

    if (savedSearch?.id) {
      chrome.setBreadcrumbs([...getRootBreadcrumbs(), { text: savedSearch.title }]);
    } else {
      chrome.setBreadcrumbs([...getRootBreadcrumbs()]);
    }
  }, [chrome, getUrlForApp, savedSearch?.id, savedSearch?.title]);

  useEffect(() => {
    setScreenTitle(
      savedSearch?.title ||
        i18n.translate('discover.savedSearch.newTitle', {
          defaultMessage: 'New search',
        })
    );
  }, [savedSearch?.title]);

  const showDatePicker = useMemo(() => (indexPattern ? indexPattern.isTimeBased() : false), [
    indexPattern,
  ]);

  const updateSavedQueryId = (newSavedQueryId: string | undefined) => {
    dispatch(setSavedQuery(newSavedQueryId));
  };

  const displayToNavLinkInPortal =
    isEnhancementsEnabled && !!opts?.optionalRef?.topLinkRef?.current && !showActionsInGroup;

  // Debug logging for comparison with explore
  console.log('Discover TopNav Debug:', {
    isEnhancementsEnabled,
    topLinkRefExists: !!opts?.optionalRef?.topLinkRef?.current,
    showActionsInGroup,
    displayToNavLinkInPortal,
    topNavLinksLength: topNavLinks?.length,
    config: displayToNavLinkInPortal ? 'EMPTY_ARRAY' : 'topNavLinks',
  });

  // Deep debug: Check opts.optionalRef structure
  console.log('Discover opts.optionalRef Debug:', {
    hasOptionalRef: !!opts?.optionalRef,
    topLinkRef: opts?.optionalRef?.topLinkRef ? 'EXISTS' : 'MISSING',
    topLinkRefCurrent: opts?.optionalRef?.topLinkRef?.current ? 'EXISTS' : 'NULL',
    datasetSelectorRef: opts?.optionalRef?.datasetSelectorRef ? 'EXISTS' : 'MISSING',
    datasetSelectorRefCurrent: opts?.optionalRef?.datasetSelectorRef?.current ? 'EXISTS' : 'NULL',
    datePickerRef: opts?.optionalRef?.datePickerRef ? 'EXISTS' : 'MISSING',
    datePickerRefCurrent: opts?.optionalRef?.datePickerRef?.current ? 'EXISTS' : 'NULL',
  });

  // Ultra deep debug: Check TopNavMenu props
  console.log('Discover TopNavMenu Props Debug:', {
    appName: PLUGIN_ID,
    configLength: (displayToNavLinkInPortal ? [] : topNavLinks)?.length,
    showSearchBar: TopNavMenuItemRenderType.IN_PLACE,
    showDatePicker: showDatePicker && TopNavMenuItemRenderType.IN_PORTAL,
    groupActions: showActionsInGroup,
    showQueryBar: !!opts?.optionalRef?.datasetSelectorRef,
    screenTitle,
  });

  // Detailed action structure comparison
  console.log('Discover Action Structure Debug:', {
    totalActions: topNavLinks?.length,
    actions: topNavLinks?.map((link, index) => ({
      index,
      id: (link as any).id,
      label: (link as any).label,
      tooltip: (link as any).tooltip,
      iconType: (link as any).iconType,
      controlType: (link as any).controlType,
      hasRun: !!(link as any).run,
      ariaLabel: (link as any).ariaLabel,
    })),
  });

  return (
    <>
      {displayToNavLinkInPortal &&
        createPortal(
          <EuiFlexGroup gutterSize="m">
            {topNavLinks.map((topNavLink, index) => (
              <EuiFlexItem grow={false} key={(topNavLink as any).id || index}>
                <EuiToolTip
                  position="bottom"
                  content={(topNavLink as any).label || (topNavLink as any).tooltip}
                >
                  <EuiButtonIcon
                    onClick={(event: any) => {
                      (topNavLink as any).run(event.currentTarget);
                    }}
                    iconType={(topNavLink as any).iconType}
                    aria-label={(topNavLink as any).ariaLabel}
                  />
                </EuiToolTip>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>,
          opts.optionalRef?.topLinkRef?.current!
        )}
      <TopNavMenu
        appName={PLUGIN_ID}
        config={displayToNavLinkInPortal ? [] : topNavLinks}
        showSearchBar={TopNavMenuItemRenderType.IN_PLACE}
        showDatePicker={showDatePicker && TopNavMenuItemRenderType.IN_PORTAL}
        showSaveQuery={showSaveQuery}
        useDefaultBehaviors
        setMenuMountPoint={opts.setHeaderActionMenu}
        indexPatterns={indexPattern ? [indexPattern] : indexPatterns}
        onQuerySubmit={opts.onQuerySubmit}
        savedQueryId={state.savedQuery}
        onSavedQueryIdChange={updateSavedQueryId}
        datasetSelectorRef={opts?.optionalRef?.datasetSelectorRef}
        datePickerRef={opts?.optionalRef?.datePickerRef}
        groupActions={showActionsInGroup}
        screenTitle={screenTitle}
        queryStatus={queryStatus}
        showQueryBar={!!opts?.optionalRef?.datasetSelectorRef}
      />
    </>
  );
};
