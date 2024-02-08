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
import { useLocalStorage } from 'react-use';

const AddtitionalControls = ({
  setLineCount,
  lineCount,
}: {
  setLineCount: (lineCount: number) => void;
  lineCount: number;
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleRangeChange = (e: any) => {
    setLineCount(Number(e.target.value));
  };

  const onButtonClick = () => setIsPopoverOpen((open) => !open);
  const closePopover = () => {};

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
          onChange={handleRangeChange}
        />
      </EuiFormRow>
    </EuiPopover>
  );
};

export const useToolbarOptions = (): {
  toolbarOptions: EuiDataGridToolBarVisibilityOptions | boolean;
  lineCount: number;
} => {
  const [lineCount, setLineCount] = useLocalStorage('discover:lineCount', 1);

  const toolbarOptions = {
    showColumnSelector: {
      allowHide: false,
      allowReorder: true,
    },
    showStyleSelector: false,
    showFullScreenSelector: false,
    additionalControls: <AddtitionalControls setLineCount={setLineCount} lineCount={lineCount} />,
  };

  return {
    toolbarOptions,
    lineCount,
  };
};
