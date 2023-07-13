/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import { AppMountParameters } from '../../../../../../core/public';
import { NEW_DISCOVER_APP, PLUGIN_ID } from '../../../../common';
import { useOpenSearchDashboards } from '../../../../../opensearch_dashboards_react/public';
import { DiscoverServices } from '../../../build_services';
import { IndexPattern } from '../../../opensearch_dashboards_services';

export interface TopNavProps {
  opts: {
    setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
  };
}

export const TopNav = ({ opts }: TopNavProps) => {
  const {
    services: {
      uiSettings,
      navigation: {
        ui: { TopNavMenu },
      },
      core: {
        application: { navigateToApp },
      },
      data,
    },
  } = useOpenSearchDashboards<DiscoverServices>();
  const [indexPatterns, setIndexPatterns] = useState<IndexPattern[] | undefined>(undefined);

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
    const getDefaultIndexPattern = async () => {
      await data.indexPatterns.ensureDefaultIndexPattern();
      const indexPattern = await data.indexPatterns.getDefault();

      setIndexPatterns(indexPattern ? [indexPattern] : undefined);
    };

    getDefaultIndexPattern();
  }, [data.indexPatterns]);

  return (
    <TopNavMenu
      appName={PLUGIN_ID}
      config={[
        {
          label: i18n.translate('discover.localMenu.legacyDiscoverTitle', {
            defaultMessage: 'Legacy Discover',
          }),
          run: async () => {
            await uiSettings.set(NEW_DISCOVER_APP, false);
            window.location.reload();
          },
          emphasize: true,
        },
      ]}
      showSearchBar
      useDefaultBehaviors
      setMenuMountPoint={opts.setHeaderActionMenu}
      indexPatterns={indexPatterns}
    />
  );
};
