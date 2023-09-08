/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AppMountParameters } from '../../../../../../core/public';
import { PLUGIN_ID } from '../../../../common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getTopNavLinks } from '../../components/top_nav/get_top_nav_links';
import { useDiscoverContext } from '../context';
import { getRootBreadcrumbs } from '../../helpers/breadcrumbs';

export interface TopNavProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const TopNav = ({ opts }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { inspectorAdapters, savedSearch, indexPattern } = useDiscoverContext();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);

  const {
    navigation: {
      ui: { TopNavMenu },
    },
    core: {
      application: { getUrlForApp },
    },
    data,
    chrome,
  } = services;

  const topNavLinks = savedSearch ? getTopNavLinks(services, inspectorAdapters, savedSearch) : [];

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
      chrome.setBreadcrumbs([
        ...getRootBreadcrumbs(getUrlForApp(PLUGIN_ID)),
        { text: savedSearch.title },
      ]);
    } else {
      chrome.setBreadcrumbs([...getRootBreadcrumbs(getUrlForApp(PLUGIN_ID))]);
    }
  }, [chrome, getUrlForApp, savedSearch?.id, savedSearch?.title]);

  const showDatePicker = useMemo(() => (indexPattern ? indexPattern.isTimeBased() : false), [
    indexPattern,
  ]);

  return (
    <TopNavMenu
      appName={PLUGIN_ID}
      config={topNavLinks}
      showSearchBar
      showDatePicker={showDatePicker}
      showSaveQuery
      useDefaultBehaviors
      setMenuMountPoint={opts.setHeaderActionMenu}
      indexPatterns={indexPattern ? [indexPattern] : indexPatterns}
    />
  );
};
