/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EuiContextMenu, EuiDataGridCellValueElementProps, EuiPopover } from '@elastic/eui';
import { useEffect } from 'react';
import { i18n } from '@osd/i18n';
import { cellValueText, getTextColor } from './table_vis_utils';
import { ColorMode } from '../types';
import { DataLink } from './data_link_options';
import { isNavigableDataLinkUrl, resolveDataLink } from './data_link_utils';
import type { VariableValue } from '../../../../../dashboard/public';

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
  row?: Record<string, unknown>;
  variables?: VariableValue[];
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
    row,
    variables,
  } = props;

  const valueDisplay = cellValueText(value);

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

  const resolvedLinks = (dataLinks ?? [])
    .filter((link) => columnId && link.fields.includes(columnId))
    .map((link) => ({ link, ...resolveDataLink(link.url, value, row, variables) }));

  if (resolvedLinks.length === 0) {
    return <span>{valueDisplay}</span>;
  }

  // A URL with an unresolved placeholder would not open anything useful, and
  // one with a script scheme, or a relative link a value moved to another host,
  // must not open at all.
  const applicableLinks = resolvedLinks.filter(
    ({ link, url, unresolved }) => unresolved.length === 0 && isNavigableDataLinkUrl(url, link.url)
  );

  if (applicableLinks.length === 0) {
    const placeholders = Array.from(new Set(resolvedLinks.flatMap((l) => l.unresolved)));
    const title =
      placeholders.length > 0
        ? i18n.translate('explore.stylePanel.table.dataLinks.unresolvedTitle', {
            defaultMessage: 'No link: {placeholders} could not be resolved for this row',
            values: { placeholders: placeholders.join(', ') },
          })
        : undefined;
    return <span title={title}>{valueDisplay}</span>;
  }

  if (applicableLinks.length === 1) {
    const { link, url } = applicableLinks[0];
    return (
      <a
        href={url}
        target={link.openInNewTab ? '_blank' : '_self'}
        rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
      >
        {valueDisplay}
      </a>
    );
  }

  const contextMenuItems = applicableLinks.map(({ link, url }) => ({
    name: link.title,
    href: url,
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
            {valueDisplay}
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
  return <span>{valueDisplay}</span>;
};
