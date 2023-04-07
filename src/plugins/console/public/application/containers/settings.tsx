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

import { HttpSetup } from 'opensearch-dashboards/public';
import { AutocompleteOptions, DevToolsSettingsModal } from '../components';

// @ts-ignore
import { retrieveAutoCompleteInfo } from '../../lib/mappings/mappings';
import { useServicesContext, useEditorActionContext } from '../contexts';
import { DevToolsSettings, Settings as SettingsService } from '../../services';

const getAutocompleteDiff = (newSettings: DevToolsSettings, prevSettings: DevToolsSettings) => {
  return Object.keys(newSettings.autocomplete).filter((key) => {
    // @ts-ignore
    return prevSettings.autocomplete[key] !== newSettings.autocomplete[key];
  });
};

const refreshAutocompleteSettings = (
  http: HttpSetup,
  settings: SettingsService,
  selectedSettings: any,
  dataSourceId?: string
) => {
  retrieveAutoCompleteInfo(http, settings, selectedSettings, dataSourceId);
};

const fetchAutocompleteSettingsIfNeeded = (
  http: HttpSetup,
  settings: SettingsService,
  newSettings: DevToolsSettings,
  prevSettings: DevToolsSettings
) => {
  // We'll only retrieve settings if polling is on. The expectation here is that if the user
  // disables polling it's because they want manual control over the fetch request (possibly
  // because it's a very expensive request given their cluster and bandwidth). In that case,
  // they would be unhappy with any request that's sent automatically.
  if (newSettings.polling) {
    const autocompleteDiff = getAutocompleteDiff(newSettings, prevSettings);

    const isSettingsChanged = autocompleteDiff.length > 0;
    const isPollingChanged = prevSettings.polling !== newSettings.polling;

    if (isSettingsChanged) {
      // If the user has changed one of the autocomplete settings, then we'll fetch just the
      // ones which have changed.
      const changedSettings: any = autocompleteDiff.reduce(
        (changedSettingsAccum: any, setting: string): any => {
          changedSettingsAccum[setting] = newSettings.autocomplete[setting as AutocompleteOptions];
          return changedSettingsAccum;
        },
        {}
      );
      retrieveAutoCompleteInfo(http, settings, changedSettings, dataSourceId);
    } else if (isPollingChanged && newSettings.polling) {
      // If the user has turned polling on, then we'll fetch all selected autocomplete settings.
      retrieveAutoCompleteInfo(http, settings, settings.getAutocomplete(), dataSourceId);
    }
  }
};

export interface Props {
  onClose: () => void;
  dataSourceId?: string;
}

export function Settings({ onClose, dataSourceId }: Props) {
  const {
    services: { settings, http },
  } = useServicesContext();

  const dispatch = useEditorActionContext();

  const onSaveSettings = (newSettings: DevToolsSettings) => {
    const prevSettings = settings.toJSON();
    fetchAutocompleteSettingsIfNeeded(http, settings, newSettings, prevSettings);

    // Update the new settings in localStorage
    settings.updateSettings(newSettings);

    // Let the rest of the application know settings have updated.
    dispatch({
      type: 'updateSettings',
      payload: newSettings,
    });
    onClose();
  };

  return (
    <DevToolsSettingsModal
      onClose={onClose}
      onSaveSettings={onSaveSettings}
      refreshAutocompleteSettings={(selectedSettings: any) =>
        refreshAutocompleteSettings(http, settings, selectedSettings, dataSourceId)
      }
      settings={settings.toJSON()}
    />
  );
}
