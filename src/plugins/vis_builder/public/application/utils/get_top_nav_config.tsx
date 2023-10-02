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
  SavedObjectSaveModalOrigin,
  SavedObjectSaveOpts,
  showSaveModal,
} from '../../../../saved_objects/public';
import { VisBuilderServices } from '../..';
import { VisBuilderSavedObject } from '../../types';
import { AppDispatch } from './state_management';
import { EDIT_PATH, VISBUILDER_SAVED_OBJECT } from '../../../common';
import { setEditorState } from './state_management/metadata_slice';
export interface TopNavConfigParams {
  visualizationIdFromUrl: string;
  savedVisBuilderVis: VisBuilderSavedObject;
  saveDisabledReason?: string;
  dispatch: AppDispatch;
  originatingApp?: string;
}

export const getTopNavConfig = (
  {
    visualizationIdFromUrl,
    savedVisBuilderVis,
    saveDisabledReason,
    dispatch,
    originatingApp,
  }: TopNavConfigParams,
  services: VisBuilderServices
) => {
  const {
    i18n: { Context: I18nContext },
    embeddable,
  } = services;

  const stateTransfer = embeddable.getStateTransfer();

  const topNavConfig: TopNavMenuData[] = [
    {
      id: 'save',
      iconType: savedVisBuilderVis?.id && originatingApp ? undefined : ('save' as const),
      emphasize: savedVisBuilderVis && !savedVisBuilderVis.id,
      description: i18n.translate('visBuilder.topNavMenu.saveVisualizationButtonAriaLabel', {
        defaultMessage: 'Save Visualization',
      }),
      className: savedVisBuilderVis?.id && originatingApp ? 'saveAsButton' : '',
      label:
        savedVisBuilderVis?.id && originatingApp
          ? i18n.translate('visBuilder.topNavMenu.saveVisualizationAsButtonLabel', {
              defaultMessage: 'save as',
            })
          : i18n.translate('visBuilder.topNavMenu.saveVisualizationButtonLabel', {
              defaultMessage: 'save',
            }),
      testId: 'visBuilderSaveButton',
      disableButton: !!saveDisabledReason,
      tooltip: saveDisabledReason,
      run: (_anchorElement) => {
        const saveModal = (
          <SavedObjectSaveModalOrigin
            documentInfo={savedVisBuilderVis}
            onSave={getOnSave(
              savedVisBuilderVis,
              originatingApp,
              visualizationIdFromUrl,
              dispatch,
              services
            )}
            objectType={'visualization'}
            onClose={() => {}}
            originatingApp={originatingApp}
            getAppNameFromId={stateTransfer.getAppNameFromId}
          />
        );

        showSaveModal(saveModal, I18nContext);
      },
    },
    ...(originatingApp && savedVisBuilderVis && savedVisBuilderVis.id
      ? [
          {
            id: 'saveAndReturn',
            label: i18n.translate('visualize.topNavMenu.saveAndReturnVisualizationButtonLabel', {
              defaultMessage: 'Save and return',
            }),
            emphasize: true,
            iconType: 'checkInCircleFilled' as const,
            description: i18n.translate(
              'visBuilder.topNavMenu.saveAndReturnVisualizationButtonAriaLabel',
              {
                defaultMessage: 'Finish editing visBuilder and return to the last app',
              }
            ),
            testId: 'visBuilderSaveAndReturnButton',
            disableButton: !!saveDisabledReason,
            tooltip: saveDisabledReason,
            run: async () => {
              const saveOptions = {
                newTitle: savedVisBuilderVis.title,
                newCopyOnSave: false,
                isTitleDuplicateConfirmed: false,
                newDescription: savedVisBuilderVis.description,
                returnToOrigin: true,
              };

              const onSave = getOnSave(
                savedVisBuilderVis,
                originatingApp,
                visualizationIdFromUrl,
                dispatch,
                services
              );

              return onSave(saveOptions);
            },
          },
        ]
      : []),
  ];

  return topNavConfig;
};

export const getOnSave = (
  savedVisBuilderVis,
  originatingApp,
  visualizationIdFromUrl,
  dispatch,
  services
) => {
  const onSave = async ({
    newTitle,
    newCopyOnSave,
    isTitleDuplicateConfirmed,
    onTitleDuplicate,
    newDescription,
    returnToOrigin,
  }: SavedObjectSaveOpts & {
    newTitle: string;
    newCopyOnSave: boolean;
    returnToOrigin: boolean;
    newDescription?: string;
  }) => {
    const { embeddable, toastNotifications, application, history } = services;
    const stateTransfer = embeddable.getStateTransfer();

    if (!savedVisBuilderVis) {
      return;
    }

    const currentTitle = savedVisBuilderVis.title;
    savedVisBuilderVis.title = newTitle;
    savedVisBuilderVis.description = newDescription;
    savedVisBuilderVis.copyOnSave = newCopyOnSave;
    const newlyCreated = !savedVisBuilderVis.id || savedVisBuilderVis.copyOnSave;

    try {
      const id = await savedVisBuilderVis.save({
        confirmOverwrite: false,
        isTitleDuplicateConfirmed,
        onTitleDuplicate,
        returnToOrigin,
      });

      if (id) {
        toastNotifications.addSuccess({
          title: i18n.translate('visBuilder.topNavMenu.saveVisualization.successNotificationText', {
            defaultMessage: `Saved '{visTitle}'`,
            values: {
              visTitle: savedVisBuilderVis.title,
            },
          }),
          'data-test-subj': 'saveVisualizationSuccess',
        });

        if (originatingApp && returnToOrigin) {
          // create or edit visBuilder directly from another app, such as `dashboard`
          if (newlyCreated && stateTransfer) {
            // create new embeddable to transfer to originatingApp
            stateTransfer.navigateToWithEmbeddablePackage(originatingApp, {
              state: { type: VISBUILDER_SAVED_OBJECT, input: { savedObjectId: id } },
            });
            return { id };
          } else {
            // update an existing visBuilder from another app
            application.navigateToApp(originatingApp);
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
        savedVisBuilderVis.title = currentTitle;
      }

      // Even if id='', which it will be for a duplicate title warning, we still want to return it, to avoid closing the modal
      return { id };
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error(error);

      toastNotifications.addDanger({
        title: i18n.translate('visBuilder.topNavMenu.saveVisualization.failureNotificationText', {
          defaultMessage: `Error on saving '{visTitle}'`,
          values: {
            visTitle: newTitle,
          },
        }),
        text: error.message,
        'data-test-subj': 'saveVisualizationError',
      });

      // reset title if save not successful
      savedVisBuilderVis.title = currentTitle;
      return { error };
    }
  };
  return onSave;
};
