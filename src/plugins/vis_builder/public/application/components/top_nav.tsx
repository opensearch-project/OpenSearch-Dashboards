/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUnmount } from 'react-use';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../utils/get_top_nav_config';
import { VisBuilderServices } from '../../types';

import './top_nav.scss';
import { useIndexPatterns, useSavedVisBuilderVis } from '../utils/use';
import { useTypedSelector, useTypedDispatch } from '../utils/state_management';
import { setEditorState } from '../utils/state_management/metadata_slice';
import { useCanSave } from '../utils/use/use_can_save';
import { saveStateToSavedObject } from '../../saved_visualizations/transforms';
import { TopNavMenuData } from '../../../../navigation/public';
import { opensearchFilters, connectStorageToQueryState } from '../../../../data/public';

export const TopNav = () => {
  // id will only be set for the edit route
  const { id: visualizationIdFromUrl } = useParams<{ id: string }>();
  const { services } = useOpenSearchDashboards<VisBuilderServices>();
  const {
    setHeaderActionMenu,
    navigation: {
      ui: { TopNavMenu },
    },
    appName,
  } = services;
  const rootState = useTypedSelector((state) => state);
  const dispatch = useTypedDispatch();

  const saveDisabledReason = useCanSave();
  const savedVisBuilderVis = useSavedVisBuilderVis(visualizationIdFromUrl);
  connectStorageToQueryState(services.data.query, services.osdUrlStateStorage, {
    filters: opensearchFilters.FilterStateStore.APP_STATE,
    query: true,
  });
  const { selected: indexPattern } = useIndexPatterns();
  const [config, setConfig] = useState<TopNavMenuData[] | undefined>();
  const originatingApp = useTypedSelector((state) => {
    return state.metadata.originatingApp;
  });

  useEffect(() => {
    const getConfig = () => {
      if (!savedVisBuilderVis || !indexPattern) return;

      return getTopNavConfig(
        {
          visualizationIdFromUrl,
          savedVisBuilderVis: saveStateToSavedObject(savedVisBuilderVis, rootState, indexPattern),
          saveDisabledReason,
          dispatch,
          originatingApp,
        },
        services
      );
    };

    setConfig(getConfig());
  }, [
    rootState,
    savedVisBuilderVis,
    services,
    visualizationIdFromUrl,
    saveDisabledReason,
    dispatch,
    indexPattern,
    originatingApp,
  ]);

  // reset validity before component destroyed
  useUnmount(() => {
    dispatch(setEditorState({ state: 'loading' }));
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
