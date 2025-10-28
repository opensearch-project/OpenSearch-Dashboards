/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiContextMenu, EuiDataGridCellValueElementProps, EuiPopover } from '@elastic/eui';
import { useEffect } from 'react';
import { getTextColor } from './table_vis_utils';
import { ColorMode } from '../types';
import { DataLink } from './data_link_options';

import './cell_value.scss';

type Props = Pick<EuiDataGridCellValueElementProps, 'setCellProps'> & {
  textAlign: 'left' | 'right' | 'center';
  value: any;
  colorMode?: ColorMode;
  color?: string;
  dataLinks?: DataLink[];
  isPopoverOpen?: boolean;
  setPopoverOpen?: (open: boolean) => void;
  columnId?: string;
};

export const CellValue = (props: Props) => {
  const {
    setCellProps,
    textAlign,
    value,
    color,
    colorMode,
    dataLinks,
    isPopoverOpen,
    setPopoverOpen,
    columnId,
  } = props;

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

  const resolveUrl = (url: string) => {
    return url.replace('${__value.text}', encodeURIComponent(value || ''));
  };

  const applicableLinks =
    dataLinks?.filter((link) => columnId && link.fields.includes(columnId)) || [];

  if (!applicableLinks || applicableLinks.length === 0) {
    return <span>{value}</span>;
  }

  if (applicableLinks.length === 1) {
    const link = applicableLinks[0];
    const resolvedUrl = resolveUrl(link.url);
    return (
      <a
        href={resolvedUrl}
        target={link.openInNewTab ? '_blank' : '_self'}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
      >
        {value}
      </a>
    );
  }

  const contextMenuItems = applicableLinks.map((link) => ({
    name: link.title,
    href: resolveUrl(link.url),
    target: link.openInNewTab ? '_blank' : '_self',
    rel: link.openInNewTab ? 'noopener noreferrer' : undefined,
    icon: 'link',
  }));

  if (setPopoverOpen && isPopoverOpen !== undefined) {
    return (
      <EuiPopover
        button={
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPopoverOpen(true);
            }}
          >
            {value}
          </a>
        }
        isOpen={isPopoverOpen}
        closePopover={() => setPopoverOpen(false)}
        panelPaddingSize="none"
        anchorClassName="cell-value-popover-anchor"
        repositionOnScroll
      >
        <EuiContextMenu
          size="s"
          initialPanelId={0}
          panels={[
            {
              id: 0,
              items: contextMenuItems,
            },
          ]}
        />
      </EuiPopover>
    );
  }
  return <span>{value}</span>;
};
