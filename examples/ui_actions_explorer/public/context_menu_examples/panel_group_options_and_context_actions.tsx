/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from 'react';
import { EuiButton, EuiContextMenu, EuiPopover } from '@elastic/eui';
import useAsync from 'react-use/lib/useAsync';
import { buildContextMenuForActions, Action } from '../../../../src/plugins/ui_actions/public';
import { sampleAction } from './util';

export const PanelGroupOptionsAndContextActions: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  const context = {};
  const trigger: any = 'TEST_TRIGGER';
  const drilldownGrouping: Action['grouping'] = [
    {
      id: 'drilldowns',
      getDisplayName: () => 'Uncategorized group',
      getIconType: () => 'popout',
      order: 20,
    },
  ];
  const exampleGroup: Action['grouping'] = [
    {
      id: 'example',
      getDisplayName: () => 'Example group',
      getIconType: () => 'cloudStormy',
      order: 20,
      category: 'visAug',
    },
  ];
  const alertingGroup: Action['grouping'] = [
    {
      id: 'alerting',
      getDisplayName: () => 'Alerting',
      getIconType: () => 'cloudStormy',
      order: 20,
      category: 'visAug',
    },
  ];
  const anomaliesGroup: Action['grouping'] = [
    {
      id: 'anomalies',
      getDisplayName: () => 'Anomalies',
      getIconType: () => 'cloudStormy',
      order: 30,
      category: 'visAug',
    },
  ];
  const actions = [
    sampleAction('test-1', 100, 'Edit visualization', 'pencil'),
    sampleAction('test-2', 99, 'Clone panel', 'partial'),

    sampleAction('test-9', 10, 'Create drilldown', 'plusInCircle', drilldownGrouping),
    sampleAction('test-10', 9, 'Manage drilldowns', 'list', drilldownGrouping),

    sampleAction('test-11', 10, 'Example action', 'dashboardApp', exampleGroup),
    sampleAction('test-11', 10, 'Alertin action 1', 'dashboardApp', alertingGroup),
    sampleAction('test-12', 9, 'Alertin action 2', 'dashboardApp', alertingGroup),
    sampleAction('test-13', 8, 'Anomalies 1', 'cloudStormy', anomaliesGroup),
    sampleAction('test-14', 7, 'Anomalies 2', 'link', anomaliesGroup),
  ];

  const panels = useAsync(() =>
    buildContextMenuForActions({
      actions: actions.map((action) => ({ action, context, trigger })),
    })
  );

  return (
    <EuiPopover
      button={<EuiButton onClick={() => setOpen((x) => !x)}>Grouping with categories</EuiButton>}
      isOpen={open}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      closePopover={() => setOpen(false)}
    >
      <EuiContextMenu initialPanelId={'mainMenu'} panels={panels.value} />
    </EuiPopover>
  );
};
