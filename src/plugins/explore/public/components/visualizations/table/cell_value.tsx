/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiContextMenu, EuiDataGridCellValueElementProps, EuiPopover } from '@elastic/eui';
import { useEffect } from 'react';
import { getTextColor } from './table_vis_utils';
import { ColorMode } from '../types';
import { DataLink } from './data_link_options';

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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [columnWidth, setColumnWidth] = useState<number | null>(null);

  useEffect(() => {
    if (columnId && buttonRef.current) {
      const cell = buttonRef.current.closest('.euiDataGridRowCell');
      if (cell) {
        const updateWidth = () => {
          const width = cell.getBoundingClientRect().width;
          setColumnWidth(width);
        };
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(cell);
        return () => observer.disconnect();
      }
    }
  }, [columnId]);

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

  const getAnchorPosition = () => {
    if (!buttonRef.current || !columnWidth) return 'downCenter';
    const textWidth = buttonRef.current.scrollWidth;
    if (textWidth > columnWidth || columnWidth > 200) {
      return textAlign === 'right' ? 'downRight' : 'downLeft';
    }
    return 'downCenter';
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
  }));

  if (setPopoverOpen && isPopoverOpen !== undefined) {
    return (
      <EuiPopover
        button={
          <button
            ref={buttonRef}
            type="button"
            onClick={() => setPopoverOpen(true)}
            style={{
              cursor: 'pointer',
              textDecoration: 'underline',
              ...(columnWidth ? { maxWidth: `${columnWidth}px` } : {}),
            }}
          >
            {value}
          </button>
        }
        isOpen={isPopoverOpen}
        closePopover={() => setPopoverOpen(false)}
        panelPaddingSize="none"
        anchorPosition={getAnchorPosition()}
        repositionOnScroll
      >
        <EuiContextMenu
          initialPanelId={0}
          panels={[
            {
              id: 0,
              title: i18n.translate('explore.stylePanel.table.cellValue.selectLink', {
                defaultMessage: 'Select a link',
              }),
              items: contextMenuItems,
            },
          ]}
        />
      </EuiPopover>
    );
  }
  return <span>{value}</span>;
};
