/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { isEqual } from 'lodash';
import { useParams } from 'react-router-dom';
import { useUnmount } from 'react-use';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getLegacyTopNavConfig, getNavActions, getTopNavConfig } from '../utils/get_top_nav_config';
import { VisBuilderServices } from '../../types';

import './top_nav.scss';
import { useIndexPatterns, useSavedVisBuilderVis } from '../utils/use';
import { useTypedSelector, useTypedDispatch } from '../utils/state_management';
import { setSavedQuery } from '../utils/state_management/visualization_slice';
import { setEditorState } from '../utils/state_management/metadata_slice';
import { useCanSave } from '../utils/use/use_can_save';
import { saveStateToSavedObject } from '../../saved_visualizations/transforms';
import { TopNavMenuData, TopNavMenuItemRenderType } from '../../../../navigation/public';
import { opensearchFilters, useConnectStorageToQueryState } from '../../../../data/public';
import { RootState } from '../../../../data_explorer/public';

function useDeepEffect(callback, dependencies) {
  const currentDepsRef = useRef(dependencies);

  if (!isEqual(currentDepsRef.current, dependencies)) {
    callback();
    currentDepsRef.current = dependencies;
  }
}

export const TopNav = () => {
  // id will only be set for the edit route
  const { id: visualizationIdFromUrl } = useParams<{ id: string }>();
  const { services } = useOpenSearchDashboards<VisBuilderServices>();
  const {
    data,
    setHeaderActionMenu,
    navigation: {
      ui: { TopNavMenu },
    },
    uiSettings,
    appName,
    capabilities,
  } = services;
  const rootState = useTypedSelector((state: RootState) => state);
  const dispatch = useTypedDispatch();
  const showActionsInGroup = uiSettings.get('home:useNewHomePage');

  useDeepEffect(() => {
    dispatch(setEditorState({ state: 'dirty' }));
  }, [data.query.queryString.getQuery(), data.query.filterManager.getFilters()]);

  const saveDisabledReason = useCanSave();
  const savedVisBuilderVis = useSavedVisBuilderVis(visualizationIdFromUrl);
  const { selected: indexPattern } = useIndexPatterns();
  const [config, setConfig] = useState<TopNavMenuData[] | undefined>();
  const originatingApp = useTypedSelector((state) => {
    return state.metadata.originatingApp;
  });

  const syncConfig = useMemo(() => {
    return {
      filters: opensearchFilters.FilterStateStore.APP_STATE,
      query: true,
    };
  }, []);

  useConnectStorageToQueryState(services.data.query, services.osdUrlStateStorage, syncConfig);

  useEffect(() => {
    const getConfig = () => {
      if (!savedVisBuilderVis || !indexPattern) return;

      const navActions = getNavActions(
        {
          visualizationIdFromUrl,
          savedVisBuilderVis: saveStateToSavedObject(savedVisBuilderVis, rootState, indexPattern),
          saveDisabledReason,
          dispatch,
          originatingApp,
        },
        services
      );

      return showActionsInGroup
        ? getTopNavConfig(
            {
              visualizationIdFromUrl,
              savedVisBuilderVis: saveStateToSavedObject(
                savedVisBuilderVis,
                rootState,
                indexPattern
              ),
              saveDisabledReason,
              dispatch,
              originatingApp,
            },
            services,
            navActions
          )
        : getLegacyTopNavConfig(
            {
              visualizationIdFromUrl,
              savedVisBuilderVis: saveStateToSavedObject(
                savedVisBuilderVis,
                rootState,
                indexPattern
              ),
              saveDisabledReason,
              dispatch,
              originatingApp,
            },
            services,
            navActions
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
    showActionsInGroup,
  ]);

  // reset validity before component destroyed
  useUnmount(() => {
    dispatch(setEditorState({ state: 'loading' }));
  });

  const updateSavedQueryId = (newSavedQueryId: string | undefined) => {
    dispatch(setSavedQuery(newSavedQueryId));
  };
  const showSaveQuery = !!capabilities['visualization-visbuilder']?.saveQuery;

  return (
    <div className="vbTopNav">
      <TopNavMenu
        appName={appName}
        config={config}
        setMenuMountPoint={setHeaderActionMenu}
        indexPatterns={indexPattern ? [indexPattern] : []}
        showDatePicker={!!indexPattern?.timeFieldName ?? true}
        showSearchBar={TopNavMenuItemRenderType.IN_PORTAL}
        showSaveQuery={showSaveQuery}
        useDefaultBehaviors
        savedQueryId={rootState.visualization.savedQuery}
        onSavedQueryIdChange={updateSavedQueryId}
        groupActions={showActionsInGroup}
        screenTitle={
          savedVisBuilderVis?.title ||
          i18n.translate('visBuilder.savedSearch.newTitle', {
            defaultMessage: 'New visualization',
          })
        }
      />
    </div>
  );
};
