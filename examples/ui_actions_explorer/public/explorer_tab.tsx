/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiCallOut, EuiTitle, EuiSpacer, EuiBasicTable } from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import React, { useMemo } from 'react';
import { UiActionsExplorerServices } from './types';
import { useOpenSearchDashboards } from '../../../src/plugins/opensearch_dashboards_react/public';
import {} from '../../../src/plugins/ui_actions/public';

interface TriggerItem {
  actions: string[];
  id: any;
  title?: string | undefined;
  description?: string | undefined;
}

export const ExplorerTab = () => {
  const {
    services: { uiActions },
  } = useOpenSearchDashboards<UiActionsExplorerServices>();
  const triggers: TriggerItem[] = useMemo(
    () =>
      Array.from(uiActions.getTriggers().values()).map(({ trigger }) => {
        return {
          ...trigger,
          actions: uiActions.getTriggerActions(trigger.id).map((action) => action.id),
        };
      }),
    [uiActions]
  );

  return (
    <>
      <EuiSpacer />
      <EuiCallOut
        title={i18n.translate('uiActionsExplorer.tab.explorer.title', {
          defaultMessage: 'UI Actions Explorer',
        })}
        iconType="gear"
      >
        <FormattedMessage
          id="uiActionsExplorer.tab.explorer.description"
          defaultMessage="Finding the registered UI Actions/triggers and their properties can be tedious sometimes. Use this explorer to find out the registered UI Actions and their triggers and their properties"
        />
      </EuiCallOut>

      <EuiSpacer />
      <EuiTitle>
        <h2>Triggers</h2>
      </EuiTitle>

      <EuiBasicTable
        itemId="triggers"
        columns={[
          {
            field: 'id',
            name: 'ID',
          },
          {
            field: 'title',
            name: 'Title',
          },
          {
            field: 'description',
            name: 'Description',
            truncateText: true,
          },
          {
            name: 'Associated Actions',
            render: ({ actions }: TriggerItem) => (
              <ul>
                {actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            ),
          },
        ]}
        items={triggers}
      />
    </>
  );
};
