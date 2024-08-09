/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiContextMenu, EuiIcon, EuiPopover } from '@elastic/eui';
import React, { useState } from 'react';
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

  const panels = [
    {
      id: 0,
      items: [
        {
          name: i18n.translate('editActionDropdown.edit', {
            defaultMessage: 'Edit',
          }),
          icon: 'pencil',
          onClick: () => {
            closePopover();
            editItem?.(item);
          },
        },
        ...(isVisBuilderCompatible
          ? [
              {
                name: i18n.translate('editActionDropdown.importToVisBuilder', {
                  defaultMessage: 'Import to VisBuilder',
                }),
                icon: 'importAction',
                onClick: () => {
                  closePopover();
                  visbuilderEditItem?.(item);
                },
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <EuiPopover
      button={<EuiIcon type="pencil" onClick={onButtonClick} />}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
      initialFocus={false}
    >
      <EuiContextMenu initialPanelId={0} panels={panels} />
    </EuiPopover>
  );
};
