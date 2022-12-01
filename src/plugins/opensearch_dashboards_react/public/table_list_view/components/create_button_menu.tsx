/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import {
  EuiButton,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFlexItem,
  EuiPopover,
} from '@elastic/eui';
import { FormattedMessage } from 'react-intl';
import type { DashboardCreator, DashboardCreatorFn, DashboardCreators } from '../../context/types';

interface CreateButtonProps {
  // createItem: () => {};
  dashboardItemCreatorClickHandler: (creatorFn: DashboardCreatorFn) => (event: any) => void;
  dashboardItemCreators: () => DashboardCreators;
}

const CreateButton = (props: CreateButtonProps) => {
  const [isPopoverOpen, setPopover] = useState(false);

  const onButtonClick = () => {
    setPopover(!isPopoverOpen);
  };

  const closePopover = () => {
    setPopover(false);
  };

  const getItems = (creators: DashboardCreators) => {
    return creators.map((creator: DashboardCreator) => (
      <EuiContextMenuItem
        key={creator.id}
        onClick={props.dashboardItemCreatorClickHandler(creator.creatorFn)}
      >
        {creator.defaultText}
      </EuiContextMenuItem>
    ));
  };

  const forceSingleButtonOnly = false;

  const creators: DashboardCreators = props.dashboardItemCreators();

  const renderMenu = () => {
    if (creators.length === 0) {
      return null;
    } else if (forceSingleButtonOnly || creators.length === 1) {
      const creator = creators[0];
      return (
        <EuiFlexItem grow={false}>
          <EuiButton
            onClick={props.dashboardItemCreatorClickHandler(creator.creatorFn)}
            data-test-subj="newItemButton"
            iconType="plusInCircle"
            fill
          >
            Create {creator.defaultText}
            <FormattedMessage
              id="opensearch-dashboards-react.tableListView.listing.createNewItemButtonLabel"
              defaultMessage={creator.defaultText}
              values={{ entityName: creator.i18nEntityName }}
            />
          </EuiButton>
        </EuiFlexItem>
      );
    } else {
      const button = (
        <EuiButton iconType="arrowDown" iconSide="right" onClick={onButtonClick} fill>
          Create
        </EuiButton>
      );

      return (
        <EuiFlexItem grow={false}>
          <EuiPopover
            id="contextMenuExample"
            button={button}
            isOpen={isPopoverOpen}
            closePopover={closePopover}
            panelPaddingSize="none"
            anchorPosition="downRight"
          >
            <EuiContextMenuPanel items={getItems(creators)} size="s" />
          </EuiPopover>
        </EuiFlexItem>
      );
    }
  };

  return renderMenu();
};

export { CreateButton };
