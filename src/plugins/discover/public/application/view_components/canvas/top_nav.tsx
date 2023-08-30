/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import React, { useEffect, useState } from 'react';
import { AppMountParameters } from '../../../../../../core/public';
import { NEW_DISCOVER_APP, PLUGIN_ID } from '../../../../common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverViewServices } from '../../../build_services';
import { IndexPattern } from '../../../opensearch_dashboards_services';
import { getTopNavLinks } from '../../components/top_nav/get_top_nav_links';
import { useDiscoverContext } from '../context';

export interface TopNavProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const TopNav = ({ opts }: TopNavProps) => {
  const { services } = useOpenSearchDashboards<DiscoverViewServices>();
  const { inspectorAdapters, savedSearch } = useDiscoverContext();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);

  const {
    uiSettings,
    navigation: {
      ui: { TopNavMenu },
    },
    core: {
      application: { navigateToApp },
    },
    data,
    chrome,
  } = services;

  const topNavLinks = savedSearch ? getTopNavLinks(services, inspectorAdapters, savedSearch) : [];

  useEffect(() => {
    if (uiSettings.get(NEW_DISCOVER_APP) === false) {
      const path = window.location.hash;
      navigateToApp('discoverLegacy', {
        replace: true,
        path,
      });
    }

    return () => {};
  }, [navigateToApp, uiSettings]);

  useEffect(() => {
    let isMounted = true;
    const getDefaultIndexPattern = async () => {
      await data.indexPatterns.ensureDefaultIndexPattern();
      const indexPattern = await data.indexPatterns.getDefault();

      if (!isMounted) return;

      setIndexPatterns(indexPattern ? [indexPattern] : undefined);
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
        {
          text: i18n.translate('discover.discoverBreadcrumbTitle', {
            defaultMessage: 'Discover',
          }),
          href: '#/',
        },
        { text: savedSearch.title },
      ]);
    } else {
      chrome.setBreadcrumbs([
        {
          text: i18n.translate('discover.discoverBreadcrumbTitle', {
            defaultMessage: 'Discover',
          }),
          href: '#/',
        },
      ]);
    }
  }, [chrome, savedSearch?.id, savedSearch?.title]);

  return (
    <TopNavMenu
      appName={PLUGIN_ID}
      config={topNavLinks}
      showSearchBar
      showSaveQuery
      useDefaultBehaviors
      setMenuMountPoint={opts.setHeaderActionMenu}
      indexPatterns={indexPatterns}
    />
  );
};
