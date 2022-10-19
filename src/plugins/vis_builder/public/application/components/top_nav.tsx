/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useUnmount } from 'react-use';
import { i18n } from '@osd/i18n';
import { PLUGIN_ID } from '../../../common';
import { useOpenSearchDashboards } from '../../../../opensearch_dashboards_react/public';
import { getTopNavConfig } from '../utils/get_top_nav_config';
import { WizardServices } from '../../types';

import './top_nav.scss';
import { useIndexPatterns, useSavedWizardVis } from '../utils/use';
import { useTypedSelector, useTypedDispatch } from '../utils/state_management';
import { setEditorState } from '../utils/state_management/metadata_slice';
import { useCanSave } from '../utils/use/use_can_save';
import { saveStateToSavedObject } from '../../saved_visualizations/transforms';
import { TopNavMenuData } from '../../../../navigation/public';

export const TopNav = () => {
  // id will only be set for the edit route
  const { id: visualizationIdFromUrl } = useParams<{ id: string }>();
  const { services } = useOpenSearchDashboards<WizardServices>();
  const {
    setHeaderActionMenu,
    navigation: {
      ui: { TopNavMenu },
    },
    onAppLeave,
  } = services;
  const rootState = useTypedSelector((state) => state);
  const dispatch = useTypedDispatch();

  const saveDisabledReason = useCanSave();
  const savedWizardVis = useSavedWizardVis(visualizationIdFromUrl);
  const { selected: indexPattern } = useIndexPatterns();
  const [config, setConfig] = useState<TopNavMenuData[] | undefined>();
  const [originatingAppInTopNav, setOriginatingAppInTopNav] = useState<string>();
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const editorState = useTypedSelector((state) => state.metadata.editor.state);

  /**
   * Need to set clickSave back to false when user made changes to the editor
   * to ensure the cancel window show up when user saves the vis builder changes,
   * remain on the editor by not toggling on 'return to dashboard', made further changes,
   * and then click cancel
   */
  useEffect(() => {
    if (editorState === 'dirty') {
      setSaveSuccess(false);
    }
  }, [editorState]);

  useEffect(() => {
    const getConfig = () => {
      if (!savedWizardVis || !indexPattern) return;

      return getTopNavConfig(
        {
          visualizationIdFromUrl,
          savedWizardVis: saveStateToSavedObject(savedWizardVis, rootState, indexPattern),
          saveDisabledReason,
          dispatch,
          setSaveSuccess,
        },
        services
      );
    };

    setConfig(getConfig());
  }, [
    rootState,
    savedWizardVis,
    services,
    visualizationIdFromUrl,
    saveDisabledReason,
    dispatch,
    indexPattern,
    setSaveSuccess,
  ]);

  useEffect(() => {
    const { originatingApp } =
      services.embeddable
        .getStateTransfer(services.scopedHistory)
        .getIncomingEditorState({ keysToRemoveAfterFetch: ['id', 'input'] }) || {};
    setOriginatingAppInTopNav(originatingApp);
  }, [services]);

  useEffect(() => {
    onAppLeave((actions) => {
      // Confirm when user coming from the dashboard, and also exit the dashboard
      // by clicking cancel button, not the save, save as or save and return button

      // TODO: use editorState to differentiate the cancel flow and the save flow
      // currently it does not work because of the metadata state management flow
      // the editorState will always reset to default initial state 'loading' inside the onAppLeave function
      if (
        originatingAppInTopNav &&
        originatingAppInTopNav === 'dashboards' &&
        saveSuccess !== true
      ) {
        return actions.confirm(
          i18n.translate('visualize.confirmModal.confirmTextDescription', {
            defaultMessage: 'Leave Visualize editor with unsaved changes?',
          }),
          i18n.translate('visualize.confirmModal.title', {
            defaultMessage: 'Unsaved changes',
          })
        );
      }
      return actions.default();
    });
  }, [onAppLeave, originatingAppInTopNav, setSaveSuccess, saveSuccess]);

  // reset validity before component destroyed
  useUnmount(() => {
    dispatch(setEditorState({ state: 'loading' }));
  });

  return (
    <div className="vbTopNav">
      <TopNavMenu
        appName={PLUGIN_ID}
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
