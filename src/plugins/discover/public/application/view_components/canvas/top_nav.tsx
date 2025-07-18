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
  connectStorageToQueryState,
  opensearchFilters,
  QueryStatus,
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
  useNoIndexPatternsTopNav?: boolean;
}

export const TopNav = ({
  opts,
  showSaveQuery,
  isEnhancementsEnabled,
  useNoIndexPatternsTopNav = false,
}: TopNavProps) => {
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

  const showActionsInGroup = uiSettings.get('home:useNewHomePage');

  const topNavLinks = savedSearch
    ? getTopNavLinks(
        services,
        inspectorAdapters,
        savedSearch,
        isEnhancementsEnabled,
        useNoIndexPatternsTopNav
      )
    : [];

  connectStorageToQueryState(
    services.data.query,
    osdUrlStateStorage,
    {
      filters: opensearchFilters.FilterStateStore.APP_STATE,
      query: true,
    },
    uiSettings
  );

  useEffect(() => {
    const subscription = data$.subscribe((queryData) => {
      const result = {
        status: queryData.status,
        ...queryData.queryStatus,
      };
      setQueryStatus(result);
    });
  }, [data$]);

  useEffect(() => {
    let isMounted = true;
    const initializeDataset = async () => {
      await data.indexPatterns.ensureDefaultIndexPattern(isEnhancementsEnabled ? false : true);
      const defaultIndexPattern = await data.indexPatterns.getDefault();
      // TODO: ROCKY do we need this?
      // const queryString = data.query.queryString;
      // const defaultDataset = queryString.getDatasetService().getDefault();

      if (!isMounted) return;

      setIndexPatterns(defaultIndexPattern ? [defaultIndexPattern] : undefined);
      // if (defaultDataset) {
      //   datasetManager.setDataset(defaultDataset);
      // }
    };

    initializeDataset();

    return () => {
      isMounted = false;
    };
  }, [data.indexPatterns, data.query, isEnhancementsEnabled]);

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

  return (
    <>
      {displayToNavLinkInPortal &&
        createPortal(
          <EuiFlexGroup gutterSize="m">
            {topNavLinks.map((topNavLink) => (
              <EuiFlexItem grow={false} key={topNavLink.id}>
                <EuiToolTip position="bottom" content={topNavLink.label}>
                  <EuiButtonIcon
                    onClick={(event) => {
                      topNavLink.run(event.currentTarget);
                    }}
                    iconType={topNavLink.iconType}
                    aria-label={topNavLink.ariaLabel}
                  />
                </EuiToolTip>
              </EuiFlexItem>
            ))}
          </EuiFlexGroup>,
          opts.optionalRef.topLinkRef.current
        )}
      <TopNavMenu
        appName={PLUGIN_ID}
        config={displayToNavLinkInPortal ? [] : topNavLinks}
        showSearchBar={
          useNoIndexPatternsTopNav
            ? TopNavMenuItemRenderType.OMITTED
            : TopNavMenuItemRenderType.IN_PLACE
        }
        showDatePicker={showDatePicker && TopNavMenuItemRenderType.IN_PORTAL}
        showSaveQuery={useNoIndexPatternsTopNav ? false : showSaveQuery}
        useDefaultBehaviors
        setMenuMountPoint={opts.setHeaderActionMenu}
        indexPatterns={
          useNoIndexPatternsTopNav ? [] : indexPattern ? [indexPattern] : indexPatterns
        }
        onQuerySubmit={useNoIndexPatternsTopNav ? () => {} : opts.onQuerySubmit}
        savedQueryId={useNoIndexPatternsTopNav ? undefined : state.savedQuery}
        onSavedQueryIdChange={useNoIndexPatternsTopNav ? () => {} : updateSavedQueryId}
        datePickerRef={useNoIndexPatternsTopNav ? undefined : opts?.optionalRef?.datePickerRef}
        groupActions={showActionsInGroup}
        screenTitle={
          useNoIndexPatternsTopNav
            ? i18n.translate('discover.noIndexPatterns.screenTitle', {
                defaultMessage: 'Select data',
              })
            : screenTitle
        }
        queryStatus={queryStatus}
      />
    </>
  );
};
