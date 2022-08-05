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
import { StyleState, VisualizationState } from './state_management';
import { EDIT_PATH } from '../../../common';
interface TopNavConfigParams {
  visualizationIdFromUrl: string;
  savedWizardVis: WizardVisSavedObject;
  visualizationState: VisualizationState;
  styleState: StyleState;
  hasUnappliedChanges: boolean;
}

export const getTopNavConfig = (
  {
    visualizationIdFromUrl,
    savedWizardVis,
    visualizationState,
    styleState,
    hasUnappliedChanges,
  }: TopNavConfigParams,
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
      disableButton: hasUnappliedChanges,
      tooltip() {
        if (hasUnappliedChanges) {
          return i18n.translate('wizard.topNavMenu.saveVisualizationDisabledButtonTooltip', {
            defaultMessage: 'Apply aggregation configuration changes before saving', // TODO: Update text to match agg save flow
          });
        }
      },
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
          const currentTitle = savedWizardVis.title;
          savedWizardVis.visualizationState = JSON.stringify(visualizationState);
          savedWizardVis.styleState = JSON.stringify(styleState);
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

              // Update URL
              if (id !== visualizationIdFromUrl) {
                history.push({
                  ...history.location,
                  pathname: `${EDIT_PATH}/${id}`,
                });
              }
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
          />
        );

        showSaveModal(saveModal, I18nContext);
      },
    },
  ];

  return topNavConfig;
};
