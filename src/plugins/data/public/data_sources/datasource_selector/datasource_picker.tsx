/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import {
  OuiPopover,
  OuiButton,
  OuiSelectable,
  OuiPopoverFooter,
  OuiFlexGroup,
  OuiFlexItem,
  OuiPopoverTitle,
} from '@elastic/eui';
import { OuiSelectableLIOption } from '@elastic/eui/src/components/selectable/selectable_option';
import {
  IDatasourcePickerProps,
  IDatasourceListOption,
  IDatasourceSelectableOption,
  ISelectedSourceOption,
} from '../types';
import {
  SOURCE_PICKER_BTN_DEFAULT_TEXT,
  SOURCE_PICKER_BTN_DEFAULT_WIDTH,
  SOURCE_PICKER_PANEL_DEFAULT_WIDTH,
  SOURCE_PICKER_TITLE,
  SOURCE_PICKER_PANEL_TEST_SUBJ,
  SOURCE_PICKER_FOOTER_CANCEL_BTN_TEXT,
  SOURCE_PICKER_FOOTER_SELECT_BTN_TEXT,
  SOURCE_PICKER_BTN_TEST_SUBJ,
  SOURCE_PICKER_PANEL_SEARCH_TEST_SUBJ,
} from './constants';

export const DatasourcePicker = ({
  datasourceList,
  selectedSource,
  onSelect,
  styles,
}: IDatasourcePickerProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedSourceOption, setSelectedSourceOption] = useState<
    ISelectedSourceOption | undefined
  >(selectedSource);

  const PickerButton = useMemo(
    () => (
      <OuiButton
        style={{ width: styles?.pickerBtnWidth || SOURCE_PICKER_BTN_DEFAULT_WIDTH }}
        size="s"
        iconType="arrowDown"
        iconSide="right"
        onClick={() => setIsPopoverOpen((isOpen) => !isOpen)}
        data-test-subj={SOURCE_PICKER_BTN_TEST_SUBJ}
      >
        {selectedSource?.title || SOURCE_PICKER_BTN_DEFAULT_TEXT}
      </OuiButton>
    ),
    [selectedSource, styles, setIsPopoverOpen]
  );

  const closeDatasourcePopover = () => setIsPopoverOpen(false);

  const onSelectSource = () => {
    if (selectedSourceOption !== undefined) onSelect(selectedSourceOption);
    closeDatasourcePopover();
  };

  return (
    <OuiPopover
      id="contextMenuExample"
      button={PickerButton}
      isOpen={isPopoverOpen}
      closePopover={() => closeDatasourcePopover()}
      panelPaddingSize="none"
      anchorPosition="downLeft"
    >
      <OuiPopoverTitle>{SOURCE_PICKER_TITLE}</OuiPopoverTitle>
      <OuiSelectable
        style={{ width: styles?.sourceSelectorPanelWidth || SOURCE_PICKER_PANEL_DEFAULT_WIDTH }}
        aria-label="Multi-selectable source panel"
        searchable
        searchProps={{
          'data-test-subj': SOURCE_PICKER_PANEL_SEARCH_TEST_SUBJ,
        }}
        options={datasourceList.map((dsItem: IDatasourceListOption) => {
          return {
            label: dsItem.title,
            checked: dsItem.title === selectedSource?.title ? 'on' : undefined,
          } as OuiSelectableLIOption<IDatasourceSelectableOption>;
        })}
        listProps={{ bordered: true }}
        onChange={(options: IDatasourceSelectableOption[]) => {
          const selectedDatasource = (options.find(
            ({ checked }) => checked === 'on'
          ) as unknown) as IDatasourceSelectableOption;
          setSelectedSourceOption({
            title: selectedDatasource.label,
          });
        }}
        singleSelection={true}
        data-test-subj={SOURCE_PICKER_PANEL_TEST_SUBJ}
      >
        {(list, search) => (
          <>
            {search}
            {list}
          </>
        )}
      </OuiSelectable>
      <OuiPopoverFooter paddingSize="s">
        <OuiFlexGroup>
          <OuiFlexItem grow={3} />
          <OuiFlexItem grow={false}>
            <OuiButton size="s" onClick={closeDatasourcePopover}>
              {SOURCE_PICKER_FOOTER_CANCEL_BTN_TEXT}
            </OuiButton>
          </OuiFlexItem>
          <OuiFlexItem grow={false}>
            <OuiButton
              size="s"
              fill
              onClick={onSelectSource}
              data-test-subj="datasourcePickerSelect"
            >
              {SOURCE_PICKER_FOOTER_SELECT_BTN_TEXT}
            </OuiButton>
          </OuiFlexItem>
        </OuiFlexGroup>
      </OuiPopoverFooter>
    </OuiPopover>
  );
};
