/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiIcon,
  EuiPopover,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiText,
  EuiConfirmModal,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { useOpenSearchDashboards } from '../context';

// TODO: include more types once VisBuilder supports more visualization types
const types = ['Area', 'Vertical Bar', 'Line', 'Metric', 'Table'];

export interface VisualizationItem {
  typeTitle: string;
  id?: string;
  version?: number;
  overlays?: any;
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
  const { overlays } = useOpenSearchDashboards();
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

  const handleImportToVisBuilder = () => {
    closePopover(); // Close the popover first

    const modal = overlays.openModal(
      <EuiConfirmModal
        title="Partial Import"
        onCancel={() => modal.close()}
        onConfirm={async () => {
          modal.close();
          // Call visbuilderEditItem with the item
          if (visbuilderEditItem) {
            await visbuilderEditItem(item);
          }
        }}
        cancelButtonText="Cancel"
        confirmButtonText="Import"
      >
        <EuiText>
          <p>
            {' '}
            Note that not all settings have been migrated from the original visualization. More will
            be included as VisBuilder supports additional settings.{' '}
          </p>
        </EuiText>
      </EuiConfirmModal>
    );
  };

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
      {i18n.translate('opensearch-dashboards-react.editActionDropdown.edit', {
        defaultMessage: 'Edit',
      })}
    </EuiContextMenuItem>,
  ];
  if (isVisBuilderCompatible) {
    items.push(
      <EuiContextMenuItem
        key="importToVisBuilder"
        icon={<EuiIcon type="importAction" />}
        onClick={handleImportToVisBuilder}
        data-test-subj="dashboardImportToVisBuilder"
      >
        {i18n.translate('opensearch-dashboards-react.editActionDropdown.importToVisBuilder', {
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
