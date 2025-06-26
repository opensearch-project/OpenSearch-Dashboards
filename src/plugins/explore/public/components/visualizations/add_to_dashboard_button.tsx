/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import './visualization_container.scss';
import { i18n } from '@osd/i18n';
import { EuiText, EuiButton, EuiLink } from '@elastic/eui';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { SimpleSavedObject, CoreStart } from 'src/core/public';
import { toMountPoint } from '../../../../opensearch_dashboards_react/public';
import { SavedExplore } from '../../saved_explore';
import { AddToDashboardModal } from './add_to_dashboard_modal';
import { ExploreServices } from '../../types';
import { setSavedSearch } from '../../application/utils/state_management/slices/legacy_slice';
import {
  selectUIState,
  selectSavedSearchName,
  selectSavedSearch,
} from '../../application/utils/state_management/selectors';
import { ExecutionContextSearch } from '../../../../expressions/common';
import { IndexPattern } from '../../../../data/public';
import { Query } from '../../../../data/common';
import { saveStateToSavedObject } from '../../saved_explore/transforms';
import { addToDashboard } from './utils/add_to_dashboard';

interface DashboardAttributes {
  title?: string;
}
export type DashboardInterface = SimpleSavedObject<DashboardAttributes>;

export interface OnSaveProps {
  savedExplore?: SavedExplore;
  newTitle: string;
  isTitleDuplicateConfirmed: boolean;
  onTitleDuplicate: () => void;
  mode: 'existing' | 'new';
  selectDashboard: DashboardInterface | null;
  newDashboardName: string;
  isDashboardDuplicateConfirmed: boolean;
  onDashboardDuplicate: () => void;
}

export const SaveAndAddButtonWithModal = ({
  startSyncingQueryStateWithUrl,
  services,
  searchContext,
  indexPattern,
}: {
  startSyncingQueryStateWithUrl: () => void;
  services: Partial<CoreStart> & ExploreServices;
  searchContext: ExecutionContextSearch;
  indexPattern?: IndexPattern;
}) => {
  const {
    core,
    data: { search },
    dashboard,
    getSavedExploreById,
    savedObjects,
    history,
    toastNotifications,
    store,
  } = services;

  const [showAddToDashboardModal, setShowAddToDashboardModal] = useState(false);
  const [savedExplore, setSavedExplore] = useState<SavedExplore>();
  const saveObjectsClient = savedObjects.client;

  const savedExploreId = useSelector(selectSavedSearch);
  const savedExploreName = useSelector(selectSavedSearchName);
  const uiState = useSelector(selectUIState);

  useEffect(() => {
    /**
     * Load the savedExplore object when:
     * - The component mounts
     * - savedExploreId changes
     * - savedExploreName changes externally (e.g., renamed via top nav)
     */
    const loadSavedExplore = async () => {
      const savedObject = await getSavedExploreById(savedExploreId);
      setSavedExplore(savedObject);
    };
    loadSavedExplore();
  }, [savedExploreId, getSavedExploreById, savedExploreName]);

  // Promise<SaveResult | undefined>
  const handleSave = async ({
    // eslint-disable-next-line no-shadow
    savedExplore,
    newTitle,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
    mode,
    selectDashboard,
    newDashboardName,
    isDashboardDuplicateConfirmed,
    onDashboardDuplicate,
  }: OnSaveProps) => {
    const currentTitle = savedExplore?.title;
    savedExplore!.title = newTitle;
    const saveOptions = {
      isTitleDuplicateConfirmed,
      onTitleDuplicate,
    };

    const createDashboardOptions = {
      isTitleDuplicateConfirmed: isDashboardDuplicateConfirmed,
      onTitleDuplicate: onDashboardDuplicate,
    };

    if (savedExplore) {
      const searchSource = search.searchSource.createEmpty();
      searchSource.setField('query', searchContext.query as Query);
      searchSource.setField('filter', searchContext.filters);
      searchSource.setField('index', indexPattern);
      savedExplore.searchSource = searchSource;
    }

    try {
      // update or creating existing save explore
      const id = await savedExplore?.save(saveOptions);

      // toast only display when creating new savedExplore objects, not updating existing ones.
      if (id && id !== savedExploreId) {
        toastNotifications.addSuccess({
          title: i18n.translate('explore.notifications.savedQueryTitle', {
            defaultMessage: `Search '{savedQueryTitle}' was saved`,
            values: {
              savedQueryTitle: savedExplore?.title,
            },
          }),
          'data-test-subj': 'savedExploreSuccess',
        });
        history().push(`/view/${encodeURIComponent(id)}`);
      }

      store!.dispatch(setSavedSearch(id));

      // starts syncing `_g` portion of url with query services
      startSyncingQueryStateWithUrl();

      let dashboardId;
      if (id) {
        if (mode === 'new') {
          dashboardId = await addToDashboard(dashboard, { id, type: 'explore' }, mode, {
            newDashboardName,
            createDashboardOptions,
          });
        } else {
          dashboardId = await addToDashboard(dashboard, { id, type: 'explore' }, mode, {
            existingDashboardId: selectDashboard!.id,
          });
        }
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
                    defaultMessage:
                      mode === 'new'
                        ? 'Dashboard created successfully'
                        : 'Dashboard added successfully',
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

        toastNotifications.add({
          title: i18n.translate('explore.addToDashboard.notification.success', {
            defaultMessage: mode === 'new' ? 'Dashboard Generation' : 'Panel added to dashboard',
          }),
          color: 'success',
          iconType: 'check',
          text: toMountPoint(toastContent),
          'data-test-subj': 'addToNewDashboardSuccessToast',
        });

        setShowAddToDashboardModal(false);
      }
    } catch (error) {
      toastNotifications.add({
        title: i18n.translate('explore.addToDashboard.notification.fail', {
          defaultMessage: 'Dashboard Generation',
        }),
        color: 'danger',
        iconType: 'alert',
        text: toMountPoint(error),
        'data-test-subj': 'addToNewDashboarddFailToast',
      });

      // Reset the original title
      if (savedExplore && currentTitle) {
        savedExplore.title = currentTitle;
      }
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
      {showAddToDashboardModal && savedExplore && (
        <AddToDashboardModal
          savedExplore={
            savedExplore ? saveStateToSavedObject(savedExplore, uiState, indexPattern) : undefined
          }
          savedObjectsClient={saveObjectsClient}
          onCancel={() => setShowAddToDashboardModal(false)}
          onConfirm={handleSave}
        />
      )}
    </>
  );
};
