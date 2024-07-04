/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { EuiIcon, EuiPopover, EuiContextMenuPanel, EuiContextMenuItem } from '@elastic/eui';
import { i18n } from '@osd/i18n';

// TODO: include more types once VisBuilder supports more visualization types
const types = ['Area', 'Vertical Bar', 'Line', 'Metric', 'Table'];

export interface VisualizationItem {
  typeTitle: string;
  id?: string;
  version?: number;
}

interface EditActionDropdownProps {
  item: VisualizationItem;
  editItem?(item: VisualizationItem): void;
  visbuilderEditItem?(item: VisualizationItem): void;
}

export const EditActionDropdown: React.FC<EditActionDropdownProps> = ({
  item,
  editItem,
  visbuilderEditItem,
}) => {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const onButtonClick = () => {
    setPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopoverOpen(false);
  };
  // A saved object will only have the 'Import to VisBuilder' option
  // if it is a VisBuilder-compatible type and its version is <= 1.
  const typeName = item.typeTitle;
  const itemVersion = item.version;
  const isVisBuilderCompatible =
    types.includes(typeName) && itemVersion !== undefined && itemVersion <= 1;

  const items = [
    <EuiContextMenuItem
      key="edit"
      icon={<EuiIcon type="pencil" />}
      onClick={() => {
        closePopover();
        editItem?.(item);
      }}
      data-test-subj="dashboardEditDashboard"
    >
      {i18n.translate('editActionDropdown.edit', { defaultMessage: 'Edit' })}
    </EuiContextMenuItem>,
  ];
  if (isVisBuilderCompatible) {
    items.push(
      <EuiContextMenuItem
        key="importToVisBuilder"
        icon={<EuiIcon type="importAction" />}
        onClick={() => {
          closePopover();
          visbuilderEditItem?.(item);
        }}
        data-test-subj="dashboardImportToVisBuilder"
      >
        {i18n.translate('editActionDropdown.importToVisBuilder', {
          defaultMessage: 'Import to VisBuilder',
        })}
      </EuiContextMenuItem>
    );
  }

  return (
    <EuiPopover
      button={<EuiIcon type="pencil" onClick={onButtonClick} data-test-subj="dashboardEditBtn" />}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      anchorPosition="downLeft"
      initialFocus="none"
    >
      <EuiContextMenuPanel items={items} size="s" />
    </EuiPopover>
  );
};
