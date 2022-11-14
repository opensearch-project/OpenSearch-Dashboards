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

import * as React from 'react';
import { EuiButton, EuiContextMenu, EuiPopover } from '@elastic/eui';
import useAsync from 'react-use/lib/useAsync';
import { v4 as uuid } from 'uuid';
import { buildContextMenuForActions, Action } from '../../../../src/plugins/ui_actions/public';
import { sampleAction } from './util';

export const PanelWithContextMenuData: React.FC = () => {
  const [open, setOpen] = React.useState(false);

  const context = {};
  const trigger: any = 'TEST_TRIGGER';
  const panel1Id = uuid();
  const panel2Id = uuid();
  const panel3Id = uuid();
  const getContextMenuData: Action['getContextMenuData'] = () => ({
    additionalPanels: [
      {
        id: panel1Id,
        title: 'New panel 1',
        items: [
          {
            name: 'Deep nested item',
            icon: 'plusInCircle',
            panel: panel2Id,
          },
        ],
      },
      {
        id: panel2Id,
        title: 'New panel 2',
        items: [
          {
            name: 'Some item 2',
            icon: 'plusInCircle',
            panel: panel3Id,
          },
        ],
      },
      {
        id: panel3Id,
        title: 'New panel 3',
        items: [
          {
            name: 'The end',
            icon: 'plusInCircle',
          },
        ],
      },
    ],
    additionalFirstPanelItems: [
      {
        name: 'Nested panels',
        icon: 'bell',
        panel: panel1Id,
      },
    ],
    additionalFirstPanelItemsOrder: 100,
  });
  const actions = [
    sampleAction('test-1', 100, 'Edit visualization', 'pencil', undefined, getContextMenuData),
  ];

  const panels = useAsync(() =>
    buildContextMenuForActions({
      actions: actions.map((action: Action) => ({ action, context, trigger })),
    })
  );

  return (
    <EuiPopover
      button={
        <EuiButton onClick={() => setOpen((x) => !x)}>Panel with context menu data</EuiButton>
      }
      isOpen={open}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      closePopover={() => setOpen(false)}
    >
      <EuiContextMenu initialPanelId={'mainMenu'} panels={panels.value} />
    </EuiPopover>
  );
};
