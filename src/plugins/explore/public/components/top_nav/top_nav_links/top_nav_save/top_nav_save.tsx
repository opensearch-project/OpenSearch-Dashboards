/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * TODO:
 * - make this file work correctly with the new saved explore
 * - write unit tests
 */

import { i18n } from '@osd/i18n';
import React from 'react';
import { TopNavMenuIconRun, TopNavMenuIconUIData } from '../types';
import { ExploreServices } from '../../../../types';
import { ExecutionContextSearch } from '../../../../../../expressions';
import { SavedExplore } from '../../../../types/saved_explore_types';
import {
  OnSaveProps,
  SavedObjectSaveModal,
  SaveResult,
  showSaveModal,
} from '../../../../../../saved_objects/public';
import { saveSavedExplore } from '../../../../helpers/save_explore';

export const saveTopNavData: TopNavMenuIconUIData = {
  tooltip: i18n.translate('explore.topNav.saveTitle', {
    defaultMessage: 'Save',
  }),
  ariaLabel: i18n.translate('explore.topNav.saveAriaLabel', {
    defaultMessage: `Save search`,
  }),
  testId: 'discoverSaveButton',
  iconType: 'save',
  controlType: 'icon',
};

export const getSaveButtonRun = (
  services: ExploreServices,
  startSyncingQueryStateWithUrl: () => void,
  searchContext: ExecutionContextSearch,
  savedExplore?: SavedExplore
): TopNavMenuIconRun => () => {
  if (!savedExplore) return;

  const onSave = async ({
    newTitle,
    newCopyOnSave,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
  }: OnSaveProps): Promise<SaveResult | undefined> => {
    const result = await saveSavedExplore({
      savedExplore,
      newTitle,
      saveOptions: { isTitleDuplicateConfirmed, onTitleDuplicate },
      searchContext,
      services,
      startSyncingQueryStateWithUrl,
      saveFromTopNav: true,
      newCopyOnSave,
    });

    return result;
  };
  const saveModal = (
    <SavedObjectSaveModal
      onSave={onSave}
      onClose={() => {}}
      title={savedExplore.title ?? ''}
      showCopyOnSave={!!savedExplore.id}
      // TODO: Does this need to be type "explore"?
      objectType="discover"
      description={i18n.translate('explore.localMenu.saveSaveSearchDescription', {
        defaultMessage:
          'Save your Discover search so you can use it in visualizations and dashboards',
      })}
      showDescription={false}
    />
  );
  showSaveModal(saveModal, services.core.i18n.Context);
};
