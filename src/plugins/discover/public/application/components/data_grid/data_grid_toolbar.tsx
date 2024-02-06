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

const AddtitionalControls = ({
  lineCount,
  setLineCount,
}: {
  lineCount: number;
  setLineCount: (height: number) => void;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
          value={lineCount}
          min={1}
          max={50}
          compressed
          name="Line Count"
          showInput
          onChange={(e: any) => setLineCount(Number(e.target.value))}
        />
      </EuiFormRow>
    </EuiPopover>
  );
};

export const useToolbarOptions = () => {
  const [lineCount, setLineCount] = useState(3);

  const toolbarOptions: EuiDataGridToolBarVisibilityOptions = {
    showColumnSelector: {
      allowHide: false,
      allowReorder: true,
    },
    showStyleSelector: false,
    showFullScreenSelector: false,
    additionalControls: <AddtitionalControls lineCount={lineCount} setLineCount={setLineCount} />,
  };

  return {
    toolbarOptions,
    lineCount,
  };
};
