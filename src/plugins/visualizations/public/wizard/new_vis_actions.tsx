/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiModal } from '@elastic/eui';
import {
  ApplicationStart,
  IUiSettingsClient,
  OverlayStart,
  SavedObjectsStart,
} from 'opensearch-dashboards/public';
import { EuiIconType } from '@elastic/eui/src/components/icon/icon';
import { TypesServiceStart } from '../vis_types';
import { UiActionsStart } from '../../../ui_actions/public';
import { VISUALIZE_ENABLE_LABS_SETTING } from '../../common/constants';
import { DASHBOARD_ADD_PANEL_TRIGGER } from '../../../dashboard/public';
import { toMountPoint } from '../../../opensearch_dashboards_react/public';
import { SearchSelection } from './search_selection';
import { DataPublicPluginStart } from '../../../data/public';

export const createNewVisActions = (services: {
  types: TypesServiceStart;
  uiActions: UiActionsStart;
  uiSettings: IUiSettingsClient;
  overlays: OverlayStart;
  application: ApplicationStart;
  savedObjects: SavedObjectsStart;
  data: DataPublicPluginStart;
}) => {
  const { types, uiActions, uiSettings, overlays, application, savedObjects, data } = services;

  const isLabsEnabled = uiSettings.get(VISUALIZE_ENABLE_LABS_SETTING);

  const visTypes = types
    .all()
    .filter((t) => {
      if (t.hidden) {
        return false;
      }
      if (!isLabsEnabled && t.stage === 'experimental') {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  visTypes.forEach((visType, i) => {
    uiActions.addTriggerAction(DASHBOARD_ADD_PANEL_TRIGGER, {
      id: `add_vis_action_${visType.name}`,
      order: 10 * (visTypes.length - i),
      getDisplayName: () => visType.title,
      getIconType: () => visType.icon as EuiIconType,
      grouping: visType.grouping
        ? visType.grouping.map((g) => ({
            id: g.id,
            getDisplayName: () => g.title,
            getIconType: () => g.icon,
          }))
        : [],
      execute: async () => {
        const dialog = overlays.openModal(
          toMountPoint(
            <EuiModal onClose={() => dialog.close()} className="visNewVisSearchDialog">
              <SearchSelection
                onSearchSelected={(searchId: string, searchType: string) => {
                  const params = [`type=${encodeURIComponent(visType.name)}`];
                  searchId = encodeURIComponent(searchId || '');

                  if (searchType) {
                    params.push(
                      `${searchType === 'search' ? 'savedSearchId' : 'indexPattern'}=${searchId}`
                    );
                  }

                  dialog.close();
                  application.navigateToApp('visualize', {
                    path: `#/create?${params.join('&')}`,
                  });
                }}
                visType={visType}
                uiSettings={uiSettings}
                savedObjects={savedObjects}
                application={application}
                data={data}
              />
            </EuiModal>
          )
        );
      },
    });
  });
};
