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

export const getTopNavconfig = ({
  savedObjects: { client: savedObjectsClient },
  toastNotifications,
  i18n: { Context: I18nContext },
}: WizardServices) => {
  const topNavConfig: TopNavMenuData[] = [
    {
      id: 'save',
      iconType: 'save',
      emphasize: true,
      label: 'Save',
      testId: 'wizardSaveButton',
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
          const wizardSavedObject = await savedObjectsClient.create('wizard', {
            title: newTitle,
            description: newDescription,
            state: JSON.stringify({}),
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
            documentInfo={{ title: '' }}
            onSave={onSave}
            objectType={'visualization'}
            onClose={() => {}}
          />
        );

        showSaveModal(saveModal, I18nContext);
      },
    },
  ];

  return topNavConfig;
};
