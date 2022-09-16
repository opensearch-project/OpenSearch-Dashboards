/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import React from 'react';
import { i18n } from '@osd/i18n';
import { TopNavMenuData } from '../../../../navigation/public';
import {
  OnSaveProps,
  SavedObjectSaveModalOrigin,
  showSaveModal,
} from '../../../../saved_objects/public';
import { WizardServices } from '../..';
import { WizardVisSavedObject } from '../../types';
import { AppDispatch } from './state_management';
import { EDIT_PATH } from '../../../common';
import { setEditorState } from './state_management/metadata_slice';
import { EmbeddableStateTransfer } from '../../../../embeddable/public';
interface TopNavConfigParams {
  visualizationIdFromUrl: string;
  savedWizardVis: WizardVisSavedObject;
  saveDisabledReason?: string;
  dispatch: AppDispatch;
  originatingApp?: string;
  setOriginatingApp?: (originatingApp: string | undefined) => void;
  stateTransfer: EmbeddableStateTransfer;
}

export const getTopNavConfig = (
  { visualizationIdFromUrl, savedWizardVis, saveDisabledReason, dispatch }: TopNavConfigParams,
  { history, toastNotifications, i18n: { Context: I18nContext } }: WizardServices
) => {
  const topNavConfig: TopNavMenuData[] = [
    {
      id: 'save',
      iconType: 'save',
      emphasize: savedWizardVis && !savedWizardVis.id,
      description: i18n.translate('wizard.topNavMenu.saveVisualizationButtonAriaLabel', {
        defaultMessage: 'Save Visualization',
      }),
      className: 'saveButton',
      label: i18n.translate('wizard.topNavMenu.saveVisualizationButtonLabel', {
        defaultMessage: 'save',
      }),
      testId: 'wizardSaveButton',
      disableButton: !!saveDisabledReason,
      tooltip: saveDisabledReason,
      run: (_anchorElement) => {
        const onSave = async ({
          newTitle,
          newCopyOnSave,
          isTitleDuplicateConfirmed,
          onTitleDuplicate,
          newDescription,
          returnToOrigin,
        }: OnSaveProps & { returnToOrigin: boolean }) => {
          if (!savedWizardVis) {
            return;
          }
          const newlyCreated = !Boolean(savedWizardVis.id) || savedWizardVis.copyOnSave;
          const currentTitle = savedWizardVis.title;
          savedWizardVis.title = newTitle;
          savedWizardVis.description = newDescription;
          savedWizardVis.copyOnSave = newCopyOnSave;

          try {
            const id = await savedWizardVis.save({
              confirmOverwrite: false,
              isTitleDuplicateConfirmed,
              onTitleDuplicate,
              returnToOrigin,
            });

            if (id) {
              toastNotifications.addSuccess({
                title: i18n.translate(
                  'wizard.topNavMenu.saveVisualization.successNotificationText',
                  {
                    defaultMessage: `Saved '{visTitle}'`,
                    values: {
                      visTitle: savedWizardVis.title,
                    },
                  }
                ),
                'data-test-subj': 'saveVisualizationSuccess',
              });

              if (originatingApp && returnToOrigin) {
                // create or edit wizard directly from a dashboard
                if (newlyCreated && stateTransfer) {
                  // create and add a new wizard to the dashboard
                  stateTransfer.navigateToWithEmbeddablePackage(originatingApp, {
                    state: { type: 'wizard', input: { savedObjectId: id } },
                  });
                } else {
                  // edit an existing wizard from the dashboard
                  application.navigateToApp(originatingApp);
                }
              } else {
                // create wizard from creating visualization page, not related to any dashboard
                if (setOriginatingApp && originatingApp && newlyCreated) {
                  setOriginatingApp(undefined);
                }
              }

              // Update URL
              if (id !== visualizationIdFromUrl) {
                history.push({
                  ...history.location,
                  pathname: `${EDIT_PATH}/${id}`,
                });
              }
              dispatch(setEditorState({ state: 'clean' }));
            } else {
              // reset title if save not successful
              savedWizardVis.title = currentTitle;
            }

            // Even if id='', which it will be for a duplicate title warning, we still want to return it, to avoid closing the modal
            return { id };
          } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error(error);

            toastNotifications.addDanger({
              title: i18n.translate('wizard.topNavMenu.saveVisualization.failureNotificationText', {
                defaultMessage: `Error on saving '{visTitle}'`,
                values: {
                  visTitle: newTitle,
                },
              }),
              text: error.message,
              'data-test-subj': 'saveVisualizationError',
            });

            // reset title if save not successful
            savedWizardVis.title = currentTitle;
            return { error };
          }
        };

        const saveModal = (
          <SavedObjectSaveModalOrigin
            documentInfo={savedWizardVis}
            onSave={onSave}
            objectType={'wizard'}
            onClose={() => {}}
            originatingApp={originatingApp}
            getAppNameFromId={stateTransfer.getAppNameFromId}
          />
        );

        showSaveModal(saveModal, I18nContext);
      },
    },
  ];

  return topNavConfig;
};
