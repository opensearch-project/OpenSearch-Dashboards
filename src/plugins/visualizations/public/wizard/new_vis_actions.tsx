/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiBadge, EuiFlexGroup, EuiFlexItem, EuiModal, EuiText } from '@elastic/eui';
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
import { reactToUiComponent, toMountPoint } from '../../../opensearch_dashboards_react/public';
import { SearchSelection } from './search_selection';
import { DataPublicPluginStart } from '../../../data/public';

const VisualizationActionMenuItem = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <>
      <EuiFlexGroup gutterSize="xs" justifyContent="spaceBetween" alignItems="center">
        <EuiFlexItem style={{ whiteSpace: 'nowrap' }}>{title}</EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiBadge color="hollow">New!</EuiBadge>
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiText size="xs" color="subdued">
        {description}
      </EuiText>
    </>
  );
};

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

  const visTypes = types.all();
  const aliasTypes = types.getAliases();
  const allTypes = [...visTypes, ...aliasTypes]
    .filter((t) => {
      if (!isLabsEnabled && t.stage === 'experimental') {
        return false;
      }
      return true;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  allTypes.forEach((visType, i) => {
    const actionConfig = {
      id: `add_vis_action_${visType.name}`,
      order: 10 * (visTypes.length - i),
      getDisplayName: () => visType.title,
      getIconType: () => visType.icon as EuiIconType,
      grouping: [],
    };
    if ('aliasApp' in visType) {
      if (visType.promotion) {
        uiActions.addTriggerAction(DASHBOARD_ADD_PANEL_TRIGGER, {
          ...actionConfig,
          order: 10 * (visTypes.length + i),
          MenuItem: reactToUiComponent(() => (
            <VisualizationActionMenuItem
              title={visType.title}
              description={visType.promotion?.description ?? ''}
            />
          )),
          execute: async () => {
            application.navigateToApp(visType.aliasApp, { path: visType.aliasPath });
          },
          isCompatible: async () => {
            return !Boolean(
              [...types.all(), ...types.getAliases()].find((t) => t.name === visType.name)?.hidden
            );
          },
        });
      } else {
        uiActions.addTriggerAction(DASHBOARD_ADD_PANEL_TRIGGER, {
          ...actionConfig,
          order: 10 * (visTypes.length - i),
          execute: async () => {
            application.navigateToApp(visType.aliasApp, { path: visType.aliasPath });
          },
        });
      }
    } else {
      uiActions.addTriggerAction(DASHBOARD_ADD_PANEL_TRIGGER, {
        ...actionConfig,
        execute: async () => {
          if (visType.requiresSearch && visType.options.showIndexSelection) {
            const dialog = overlays.openModal(
              toMountPoint(
                <EuiModal onClose={() => dialog.close()} className="visNewVisSearchDialog">
                  <SearchSelection
                    onSearchSelected={(searchId: string, searchType: string) => {
                      const params = [`type=${encodeURIComponent(visType.name)}`];
                      searchId = encodeURIComponent(searchId || '');

                      if (searchType) {
                        params.push(
                          `${
                            searchType === 'search' ? 'savedSearchId' : 'indexPattern'
                          }=${searchId}`
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
          } else {
            const params = [`type=${encodeURIComponent(visType.name)}`];
            application.navigateToApp('visualize', {
              path: `#/create?${params.join('&')}`,
            });
          }
        },
      });
    }
  });
};
