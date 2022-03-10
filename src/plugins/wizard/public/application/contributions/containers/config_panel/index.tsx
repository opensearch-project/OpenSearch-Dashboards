/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiForm } from '@elastic/eui';
import React, { useMemo } from 'react';
import { useVisualizationType } from '../../../utils/use';
import {
  DropboxContribution,
  MainItemContribution,
  SecondaryItemContribution,
  TitleItemContribution,
} from './items';
import './index.scss';
import { ITEM_TYPES } from './items';
import { useTypedSelector } from '../../../utils/state_management';
import { mapItemToPanelComponents } from './utils/item_to_panel';
import { ItemTypes } from '../../constants';
import { SelectContribution } from '../common/items';
import { INDEX_FIELD_KEY } from './items/use/use_form_field';

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

  const mainPanel = useMemo(() => mapItemToPanelComponents(hydratedItems), [hydratedItems]);
  const secondaryPanel = useMemo(() => {
    if (!activeItem) {
      return;
    }

    // Generate each secondary panel base on active item type
    if (activeItem.type === ITEM_TYPES.DROPBOX) {
      const activeDropboxContribution = hydratedItems.find(
        (item: MainItemContribution) =>
          item.type === ITEM_TYPES.DROPBOX && item?.id === activeItem?.id
      ) as DropboxContribution | undefined;

      if (!activeDropboxContribution) return null;

      let itemsToRender: SecondaryItemContribution[] = [
        getTitleContribution(activeDropboxContribution.label),
        getFieldSelectorContribution(),
      ];

      if (activeItem.fieldName) {
        itemsToRender = [...itemsToRender, ...activeDropboxContribution.items];
      }

      return mapItemToPanelComponents(itemsToRender, true);
    }
  }, [activeItem, hydratedItems]);

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

function getFieldSelectorContribution(): SelectContribution<string> {
  return {
    type: ItemTypes.SELECT,
    id: INDEX_FIELD_KEY,
    label: 'Select a Field',
    options: (state) => {
      return state.dataSource.visualizableFields.map((field) => ({
        value: field.name,
        inputDisplay: field.displayName,
      }));
    },
  };
}

export { CONTAINER_ID, DEFAULT_ITEMS };
export * from './items';
