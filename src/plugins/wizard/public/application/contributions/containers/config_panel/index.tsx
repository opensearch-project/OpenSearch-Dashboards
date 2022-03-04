/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm } from '@elastic/eui';
import React, { useMemo } from 'react';
import { useVisualizationType } from '../../../utils/use';
import { DroppableBoxContribution, MainItemContribution, TitleItemContribution } from './items';
import './index.scss';
import { ITEM_TYPES } from './items';
import { useTypedSelector } from '../../../utils/state_management';
import { mapItemToPanelComponents } from './utils/item_to_panel';

const CONTAINER_ID = 'config-panel';
const DEFAULT_ITEMS: MainItemContribution[] = [getTitleContribution()];

export function ConfigPanel() {
  const {
    contributions: { items },
  } = useVisualizationType();
  const activeItem = useTypedSelector((state) => state.config.activeItem);

  const hydratedItems: MainItemContribution[] = [
    ...(items?.[CONTAINER_ID] ?? []),
    ...DEFAULT_ITEMS,
  ];
  const activeDropbox = hydratedItems.find(
    (item: MainItemContribution) => item.type === ITEM_TYPES.DROPBOX && item?.id === activeItem?.id
  ) as DroppableBoxContribution | undefined;

  const mainPanel = useMemo(() => mapItemToPanelComponents(hydratedItems), [hydratedItems]);
  const secondaryPanel = useMemo(
    () =>
      activeDropbox
        ? mapItemToPanelComponents(
            [getTitleContribution(activeDropbox.label), ...activeDropbox.items],
            true
          )
        : null,
    [activeDropbox]
  );

  return (
    <EuiForm className={`wizConfig ${activeItem ? 'showSecondary' : ''}`}>
      <div className="wizConfig__section">{mainPanel}</div>
      <div className="wizConfig__section wizConfig--secondary">{secondaryPanel}</div>
    </EuiForm>
  );
}

function getTitleContribution(title?: string): TitleItemContribution {
  return {
    type: ITEM_TYPES.TITLE,
    title: [title, 'Configuration'].join(' '),
  };
}

export { CONTAINER_ID, DEFAULT_ITEMS };
export * from './items';
