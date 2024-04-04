/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useUnmount } from 'react-use';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../utils/get_top_nav_config';
import { VisBuilderViewServices } from '../../types';

import './top_nav.scss';
import { useTypedDispatch } from '../utils/state_management';
import { setStatus } from '../utils/state_management/editor_slice';
import { useCanSave } from '../utils/use/use_can_save';
import { saveStateToSavedObject } from '../../saved_visualizations/transforms';
import { TopNavMenuData } from '../../../../navigation/public';
import { opensearchFilters, connectStorageToQueryState } from '../../../../data/public';
import { AppMountParameters } from '../../../../../core/public';
import { useVisBuilderContext } from '../view_components/context';

export const TopNav = ({
  setHeaderActionMenu,
}: {
  setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'];
}) => {
  const { services } = useOpenSearchDashboards<VisBuilderViewServices>();

  const {
    navigation: {
      ui: { TopNavMenu },
    },
    appName,
  } = services;
  const { indexPattern, rootState, savedVisBuilderId, savedVisBuilderVis } = useVisBuilderContext();
  const dispatch = useTypedDispatch();

  const saveDisabledReason = useCanSave();
  connectStorageToQueryState(services.data.query, services.osdUrlStateStorage, {
    filters: opensearchFilters.FilterStateStore.APP_STATE,
    query: true,
  });
  const [config, setConfig] = useState<TopNavMenuData[] | undefined>();

  useEffect(() => {
    const getConfig = () => {
      if (!savedVisBuilderVis || !indexPattern) return;
      const topNavConfigs = getTopNavConfig(
        {
          visualizationIdFromUrl: savedVisBuilderId,
          savedVisBuilderVis: saveStateToSavedObject(savedVisBuilderVis, rootState, indexPattern),
          saveDisabledReason,
          dispatch,
          originatingApp: rootState.metadata.originatingApp,
        },
        services
      );

      return topNavConfigs;
    };
    setConfig(getConfig());
  }, [
    savedVisBuilderVis,
    rootState,
    indexPattern,
    saveDisabledReason,
    dispatch,
    services,
    savedVisBuilderId,
  ]);

  useUnmount(() => {
    dispatch(setStatus({ status: 'loading' }));
  });

  return (
    <div className="vbTopNav">
      <TopNavMenu
        appName={appName}
        config={config}
        setMenuMountPoint={setHeaderActionMenu}
        indexPatterns={indexPattern ? [indexPattern] : []}
        showDatePicker={!!indexPattern?.timeFieldName ?? true}
        showSearchBar
        showSaveQuery
        useDefaultBehaviors
      />
    </div>
  );
};
