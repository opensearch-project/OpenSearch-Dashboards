/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';
import { EuiText, EuiButton, EuiLink } from '@elastic/eui';
import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { SimpleSavedObject, CoreStart } from 'src/core/public';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';
import { createOsdUrlStateStorage } from '../../../../opensearch_dashboards_utils/public';
import { SavedExplore } from '../../saved_explore';
import { AddToDashboardModal } from './add_to_dashboard_modal';
import { ExploreServices } from '../../types';
import { selectUIState, selectTabState } from '../../application/utils/state_management/selectors';
import { ExecutionContextSearch } from '../../../../expressions/common';
import {
  DataView as Dataset,
  IndexPattern,
  useSyncQueryStateWithUrl,
} from '../../../../data/public';
import { saveStateToSavedObject } from '../../saved_explore/transforms';
import { addToDashboard } from './utils/add_to_dashboard';
import { saveSavedExplore } from '../../helpers/save_explore';
import { useCurrentExploreId } from '../../application/utils/hooks/use_current_explore_id';
import { useFlavorId } from '../../../public/helpers/use_flavor_id';

interface DashboardAttributes {
  title?: string;
}
export type DashboardInterface = SimpleSavedObject<DashboardAttributes>;

export interface OnSaveProps {
  savedExplore: SavedExplore;
  newTitle: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
  mode: 'existing' | 'new';
  selectDashboard: DashboardInterface | null;
  newDashboardName: string;
}

export const SaveAndAddButtonWithModal = ({
  services,
  searchContext,
  dataset,
}: {
  services: Partial<CoreStart> & ExploreServices;
  searchContext: ExecutionContextSearch;
  dataset?: IndexPattern | Dataset;
}) => {
  const { core, dashboard, savedObjects, toastNotifications, uiSettings, history, data } = services;

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

  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);

  const uiState = useSelector(selectUIState);
  const tabDefinition = services.tabRegistry?.getTab?.(uiState.activeTabId);

  const tabState = useSelector(selectTabState);

  const savedExploreIdFromUrl = useCurrentExploreId();
  const flavorId = useFlavorId();

  const saveObjectsClient = savedObjects.client;

  const handleSave = async ({
    savedExplore,
    newTitle,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
    mode,
    selectDashboard,
    newDashboardName,
  }: OnSaveProps) => {
    const savedExploreWithState = saveStateToSavedObject(
      savedExplore,
      flavorId ?? 'logs',
      tabDefinition!,
      tabState,
      dataset
    );

    const saveOptions = {
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    };
    try {
      // by passing newCopyOnSave as true, to ensure every time add to dashboard will create a new explore
      const result = await saveSavedExplore({
        savedExplore: savedExploreWithState,
        newTitle,
        saveOptions,
        searchContext,
        services,
        startSyncingQueryStateWithUrl,
        openAfterSave: false,
        newCopyOnSave: true,
      });

      let dashboardId;

      if (result && 'id' in result && result?.id) {
        const id = result?.id;
        let props;
        if (mode === 'new') {
          props = {
            newDashboardName,
            createDashboardOptions: saveOptions,
          };
        } else {
          props = {
            existingDashboardId: selectDashboard!.id,
          };
        }
        dashboardId = await addToDashboard(dashboard, { id, type: 'explore' }, mode, props);
      }

      if (dashboardId) {
        const url = core.application.getUrlForApp('dashboards', {
          path: `#/view/${dashboardId}`,
        });

        const toastContent = (
          <div>
            {url ? (
              <EuiText size="s">
                <p>
                  {i18n.translate('explore.addToDashboard.notification.success.message', {
                    defaultMessage: `Explore '{newTitle}' is successfully added to the dashboard.`,
                    values: { newTitle },
                  })}
                  &nbsp;
                  <EuiLink href={url} target="_blank">
                    {i18n.translate(
                      'explore.addToDashboard.notification.success.viewDashboardLink',
                      {
                        defaultMessage: 'View Dashboard',
                      }
                    )}
                  </EuiLink>
                </p>
              </EuiText>
            ) : (
              <EuiText size="s" color="danger">
                {i18n.translate('explore.addToDashboard.notification.failure.message', {
                  defaultMessage: 'Dashboard creation failed.',
                })}
              </EuiText>
            )}
          </div>
        );

        if (mode === 'new') {
          toastNotifications.add({
            title: i18n.translate('explore.addToDashboard.notification.success.new', {
              defaultMessage: 'Dashboard Generation',
            }),
            color: 'success',
            iconType: 'check',
            text: toMountPoint(toastContent),
            'data-test-subj': 'addToNewDashboardSuccessToast',
          });
        } else {
          toastNotifications.add({
            title: i18n.translate('explore.addToDashboard.notification.success.existing', {
              defaultMessage: 'Panel added to dashboard',
            }),
            color: 'success',
            iconType: 'check',
            text: toMountPoint(toastContent),
            'data-test-subj': 'addToNewDashboardSuccessToast',
          });
        }

        setShowAddToDashboardModal(false);
      }
    } catch (error) {
      toastNotifications.add({
        title: i18n.translate('explore.addToDashboard.notification.fail', {
          defaultMessage: 'Fail to add to dashboard',
        }),
        color: 'danger',
        iconType: 'alert',
        text: toMountPoint(error),
        'data-test-subj': 'addToNewDashboarddFailToast',
      });

      setShowAddToDashboardModal(false);
    }
  };

  return (
    <>
      <EuiButton size="s" onClick={() => setShowAddToDashboardModal(true)}>
        {i18n.translate('explore.addtoDashboardButton.name', {
          defaultMessage: 'Add to dashboard',
        })}
      </EuiButton>
      {showAddToDashboardModal && (
        <AddToDashboardModal
          savedExploreId={savedExploreIdFromUrl}
          savedObjectsClient={saveObjectsClient}
          onCancel={() => setShowAddToDashboardModal(false)}
          onConfirm={handleSave}
        />
      )}
    </>
  );
};
