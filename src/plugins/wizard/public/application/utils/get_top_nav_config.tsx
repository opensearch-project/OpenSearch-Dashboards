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
import { WIZARD_SAVED_OBJECT } from '../../../common';

interface TopNavConfigParams {
  visInstance: Record<string, any>; // TODO: fix this type
  hasUnappliedChanges: boolean;
}

export const getTopNavconfig = (
  { visInstance, hasUnappliedChanges }: TopNavConfigParams,
  {
    savedObjects: { client: savedObjectsClient },
    toastNotifications,
    i18n: { Context: I18nContext },
  }: WizardServices
) => {
  const { state } = visInstance;
  const topNavConfig: TopNavMenuData[] = [
    {
      id: 'save',
      iconType: 'save',
      emphasize: true, // TODO: need to be conditional for save vs create (save as)?
      description: 'Save Visualization', // TODO: i18n
      className: 'saveButton',
      label: 'save', // TODO: i18n
      testId: 'wizardSaveButton',
      disableButton: hasUnappliedChanges,
      tooltip() {
        if (hasUnappliedChanges) {
          return i18n.translate('visualize.topNavMenu.saveVisualizationDisabledButtonTooltip', {
            defaultMessage: 'Apply aggregation configuration changes before saving', // TODO: Update text to match agg save flow
          });
        }
      },
      run: (anchorElement) => {
        const onSave = async ({
          // TODO: Figure out what the other props here do
          newTitle,
          newCopyOnSave,
          isTitleDuplicateConfirmed,
          onTitleDuplicate,
          newDescription,
          returnToOrigin,
        }: OnSaveProps & { returnToOrigin: boolean }) => {
          // TODO: Save the actual state of the wizard
          const wizardSavedObject = visInstance.id
            ? await savedObjectsClient.update(WIZARD_SAVED_OBJECT, visInstance.id, {
                title: newTitle,
                description: newDescription,
                state,
              })
            : await savedObjectsClient.create(WIZARD_SAVED_OBJECT, {
                title: newTitle,
                description: newDescription,
                state,
              });

          try {
            const id = await wizardSavedObject.save();

            if (id) {
              toastNotifications.addSuccess({
                title: i18n.translate(
                  'wizard.topNavMenu.saveVisualization.successNotificationText',
                  {
                    defaultMessage: `Saved '{visTitle}'`,
                    values: {
                      visTitle: newTitle,
                    },
                  }
                ),
                'data-test-subj': 'saveVisualizationSuccess',
              });

              return { id };
            }

            throw new Error('Saved but no id returned');
          } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error(error);

            toastNotifications.addDanger({
              title: i18n.translate(
                'visualize.topNavMenu.saveVisualization.failureNotificationText',
                {
                  defaultMessage: `Error on saving '{visTitle}'`,
                  values: {
                    visTitle: newTitle,
                  },
                }
              ),
              text: error.message,
              'data-test-subj': 'saveVisualizationError',
            });
            return { error };
          }
        };

        const saveModal = (
          <SavedObjectSaveModalOrigin
            documentInfo={visInstance || { title: '' }}
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
