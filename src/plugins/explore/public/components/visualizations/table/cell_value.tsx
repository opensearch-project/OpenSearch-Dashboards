/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { EuiDataGridCellValueElementProps } from '@elastic/eui';
import { useEffect } from 'react';
import { getTextColor } from '../utils/utils';

type Props = Pick<EuiDataGridCellValueElementProps, 'setCellProps'> & {
  textAlign: 'left' | 'right' | 'center';
  value: any;
  colorMode?: 'auto' | 'colored_text' | 'colored_background';
  color?: string;
};

export const CellValue = (props: Props) => {
  const { setCellProps, textAlign, value, color, colorMode } = props;

  useEffect(() => {
    const cellStyle: React.CSSProperties = { textAlign };

    if (colorMode !== 'auto') {
      if (color) {
        if (colorMode === 'colored_text') {
          cellStyle.color = color;
        } else if (colorMode === 'colored_background') {
          cellStyle.backgroundColor = color;
          cellStyle.color = getTextColor(color);
        }
      }
    }

    setCellProps({
      style: cellStyle,
    });
  }, [setCellProps, value, textAlign, color, colorMode]);

  return value;
};
