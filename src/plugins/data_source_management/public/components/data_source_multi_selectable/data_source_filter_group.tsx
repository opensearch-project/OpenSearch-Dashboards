/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  EuiNotificationBadge,
  EuiFilterSelectItem,
  EuiPopover,
  EuiPopoverTitle,
  EuiFieldSearch,
  FilterChecked,
  EuiPopoverFooter,
  EuiButtonGroup,
  EuiButtonEmpty,
} from '@elastic/eui';
import { DataSourceOption } from '../data_source_menu/types';
import { DataSourceItem } from '../data_source_item';
import './data_source_filter_group.scss';

export interface SelectedDataSourceOption extends DataSourceOption {
  label: string;
  id: string;
  visible: boolean;
  checked?: FilterChecked;
}

export interface DataSourceFilterGroupProps {
  selectedOptions: SelectedDataSourceOption[];
  setSelectedOptions: (options: SelectedDataSourceOption[]) => void;
  defaultDataSource: string | null;
}

type SelectionToggleOptionIds = 'select_all' | 'deselect_all';

const selectionToggleButtons = [
  {
    id: 'select_all',
    label: 'Select all',
  },
  {
    id: 'deselect_all',
    label: 'Deselect all',
  },
];

export const DataSourceFilterGroup: React.FC<DataSourceFilterGroupProps> = ({
  selectedOptions,
  setSelectedOptions,
  defaultDataSource,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectionToggleSelectedId, setSelectionToggleSelectedId] = useState<
    SelectionToggleOptionIds
  >('select_all');

  const onButtonClick = () => {
    setIsPopoverOpen(!isPopoverOpen);
  };

  const closePopover = () => {
    setIsPopoverOpen(false);
  };

  function toggleItem(index: number) {
    if (!selectedOptions[index]) {
      return;
    }

    const newItems = [...selectedOptions];

    if (newItems[index].checked === 'on') {
      newItems[index] = {
        ...newItems[index],
        checked: undefined,
      };
    } else {
      newItems[index] = {
        ...newItems[index],
        checked: 'on',
      };
    }

    setSelectedOptions(newItems);
  }

  function onSelectionToggleChange(optionId: string) {
    setSelectionToggleSelectedId(optionId as SelectionToggleOptionIds);
    toggleAll(optionId === 'select_all' ? 'on' : undefined);
  }

  function toggleAll(state: 'on' | undefined) {
    const optionsAfterToggle = selectedOptions.map((option) => ({
      ...option,
      checked: state,
    }));

    setSelectedOptions(optionsAfterToggle);
  }

  function search(term: string) {
    const optionsAfterSearch = selectedOptions.map((option) => {
      option.visible = option.label.toLowerCase().includes(term.toLowerCase());
      return option;
    });
    setSelectedOptions(optionsAfterSearch);
  }

  const numActiveSelections = selectedOptions.filter((option) => option.checked === 'on').length;
  const button = (
    <>
      <EuiButtonEmpty
        className="euiHeaderLink"
        onClick={onButtonClick}
        iconType="database"
        size="s"
        data-test-subj="dataSourceFilterGroupButton"
      >
        {'Data sources'}
      </EuiButtonEmpty>
      <EuiNotificationBadge color="subdued">{numActiveSelections}</EuiNotificationBadge>
    </>
  );

  return (
    <EuiPopover
      id="popoverExampleMultiSelect"
      button={button}
      isOpen={isPopoverOpen}
      closePopover={closePopover}
      panelPaddingSize="none"
    >
      <EuiPopoverTitle paddingSize="s">
        <EuiFieldSearch
          compressed
          onSearch={search}
          isClearable={true}
          data-test-subj="dataSourceMultiSelectFieldSearch"
        />
      </EuiPopoverTitle>
      <div className="dataSourceFilterGroupItems">
        {selectedOptions.map((item, index) => {
          const itemStyle: any = {};
          itemStyle.display = !item.visible ? 'none' : itemStyle.display;

          return (
            <EuiFilterSelectItem
              checked={item.checked}
              key={index}
              onClick={() => toggleItem(index)}
              showIcons={true}
              style={itemStyle}
            >
              <DataSourceItem
                option={item}
                defaultDataSource={defaultDataSource}
                className={'dataSourceFilterGroup'}
              />
            </EuiFilterSelectItem>
          );
        })}
      </div>
      <EuiPopoverFooter>
        <EuiButtonGroup
          legend="All options selection toggle group"
          options={selectionToggleButtons}
          idSelected={selectionToggleSelectedId}
          onChange={onSelectionToggleChange}
        />
      </EuiPopoverFooter>
    </EuiPopover>
  );
};
