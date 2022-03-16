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
  ITEM_TYPES,
} from './items';
import { useTypedSelector } from '../../../utils/state_management';
import { mapItemToPanelComponents } from './utils/item_to_panel';
import { ItemTypes } from '../../constants';
import { SelectContribution } from '../common/items';
import { INDEX_FIELD_KEY } from './items/use/use_form_field';
import { DATA_TAB_ID } from '.';
import './config_panel.scss';

const DEFAULT_ITEMS: MainItemContribution[] = [getTitleContribution()];

export function ConfigPanel() {
  const {
    contributions: { items },
  } = useVisualizationType();
  const activeItem = useTypedSelector((state) => state.config.activeItem);
  const configItemState = useTypedSelector((state) => state.config.items[activeItem?.id || '']);

  const hydratedItems: MainItemContribution[] = [...(items?.[DATA_TAB_ID] ?? []), ...DEFAULT_ITEMS];

  const mainPanel = useMemo(() => mapItemToPanelComponents(hydratedItems), [hydratedItems]);
  const secondaryPanel = useMemo(() => {
    if (!activeItem || !configItemState || typeof configItemState === 'string') return;

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

      const dropboxFieldInstance = configItemState.instances.find(
        ({ id }) => id === activeItem.instanceId
      );
      if (dropboxFieldInstance && dropboxFieldInstance.properties.fieldName) {
        itemsToRender = [...itemsToRender, ...activeDropboxContribution.items];
      }

      return mapItemToPanelComponents(itemsToRender, true);
    }
  }, [activeItem, configItemState, hydratedItems]);

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
