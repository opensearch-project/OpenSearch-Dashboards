/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  EuiButtonEmpty,
  EuiDataGridToolBarVisibilityOptions,
  EuiFormRow,
  EuiPopover,
  EuiRange,
} from '@elastic/eui';
import React, { useState } from 'react';
import { setMetadata, useDispatch, useSelector } from '../../utils/state_management';

const AddtitionalControls = () => {
  const { metadata } = useSelector((state) => state.discover);
  const dispatch = useDispatch();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const [localLineCount, setLocalLineCount] = useState(metadata?.lineCount || 1);

  const handleRangeChange = (e: any) => {
    setLocalLineCount(Number(e.target.value));
  };

  const handleRangeUpdateComplete = () => {
    dispatch(setMetadata({ lineCount: localLineCount }));
  };

  const onButtonClick = () => setIsPopoverOpen((open) => !open);
  const closePopover = () => setIsPopoverOpen(false);

  const button = (
    <EuiButtonEmpty
      iconType="controlsHorizontal"
      iconSide="left"
      onClick={onButtonClick}
      size="xs"
      color="text"
    >
      Display
    </EuiButtonEmpty>
  );

  return (
    <EuiPopover button={button} isOpen={isPopoverOpen} closePopover={closePopover}>
      <EuiFormRow label="Line Count" display="rowCompressed">
        <EuiRange
          value={localLineCount}
          min={1}
          max={50}
          compressed
          name="Line Count"
          showInput
          onChange={handleRangeChange}
          onMouseUp={handleRangeUpdateComplete}
          onBlur={handleRangeUpdateComplete}
        />
      </EuiFormRow>
    </EuiPopover>
  );
};

export const useToolbarOptions = () => {
  const toolbarOptions: EuiDataGridToolBarVisibilityOptions = {
    showColumnSelector: {
      allowHide: false,
      allowReorder: true,
    },
    showStyleSelector: false,
    showFullScreenSelector: false,
    additionalControls: <AddtitionalControls />,
  };

  return {
    toolbarOptions,
  };
};
