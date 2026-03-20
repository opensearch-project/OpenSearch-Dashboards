/*
 * SPDX-License-Identifier: Apache-2.0
 *
 * The OpenSearch Contributors require contributions made to
 * this file be licensed under the Apache-2.0 license or a
 * compatible open source license.
 *
 * Any modifications Copyright OpenSearch Contributors. See
 * GitHub history for details.
 */

/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { i18n } from '@osd/i18n';
import classNames from 'classnames';
import React, { ReactNode, useState, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import { EuiButtonIcon, EuiPopover, EuiFlexGroup, EuiFlexItem, EuiCopy } from '@elastic/eui';
import { FieldMapping, DocViewFilterFn } from '../../doc_views/doc_views_types';
import { DocViewTableRowBtnFilterAdd } from './table_row_btn_filter_add';
import { DocViewTableRowBtnFilterRemove } from './table_row_btn_filter_remove';
import { DocViewTableRowBtnToggleColumn } from './table_row_btn_toggle_column';
import { DocViewTableRowBtnFilterExists } from './table_row_btn_filter_exists';
import { DocViewTableRowIconNoMapping } from './table_row_icon_no_mapping';
import { DocViewTableRowIconUnderscore } from './table_row_icon_underscore';
import { FieldName } from '../field_name/field_name';

export interface Props {
  field: string;
  fieldMapping?: FieldMapping;
  fieldType: string;
  displayNoMappingWarning: boolean;
  displayUnderscoreWarning: boolean;
  isCollapsible: boolean;
  isColumnActive: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onFilter?: DocViewFilterFn;
  onToggleColumn?: () => void;
  value: string | ReactNode;
  valueRaw: unknown;
}

function valueToClipboard(valueRaw: unknown): string {
  if (typeof valueRaw === 'string') return valueRaw;
  try {
    return JSON.stringify(valueRaw);
  } catch {
    return String(valueRaw);
  }
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

const TOOLTIP_DELAY = 38;
const TOOLTIP_GAP = 8;

function FastTooltip({ text, children }: { text: string; children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const mouse = useRef({ x: 0, y: 0 });

  const onMove = useCallback((e: React.MouseEvent) => {
    mouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onEnter = useCallback((e: React.MouseEvent) => {
    mouse.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      setPos({ x: mouse.current.x, y: mouse.current.y - TOOLTIP_GAP });
      setVisible(true);
    }, TOOLTIP_DELAY);
  }, []);

  const onLeave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setVisible(false);
  }, []);

  return (
    <span
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ display: 'contents' }}
    >
      {children}
      {visible && text && (
        <span className="osdDocViewer__fastTooltip" style={{ left: pos.x, top: pos.y }}>
          {text}
          <span className="osdDocViewer__fastTooltipArrow" />
        </span>
      )}
    </span>
  );
}

export function DocViewTableRow({
  field,
  fieldMapping,
  fieldType,
  displayNoMappingWarning,
  displayUnderscoreWarning,
  isCollapsible,
  isCollapsed,
  isColumnActive,
  onFilter,
  onToggleCollapse,
  onToggleColumn,
  value,
  valueRaw,
}: Props) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const toggleFilter = useCallback(() => setIsFilterOpen((prev) => !prev), []);
  const closeFilter = useCallback(() => setIsFilterOpen(false), []);

  const valueClassName = classNames({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    osdDocViewer__value: true,
    'truncate-by-height': isCollapsible && isCollapsed,
  });

  const rawText = valueToClipboard(valueRaw);
  const displayText = typeof value === 'string' ? stripHtml(value) : rawText;

  const filterButton = (
    <EuiButtonIcon
      aria-label={i18n.translate('discover.docViews.table.filterActionsLabel', {
        defaultMessage: 'Filter actions',
      })}
      iconType="filter"
      iconSize="s"
      size="xs"
      color="text"
      className="osdDocViewer__filterBtn"
      onClick={toggleFilter}
      data-test-subj="docViewerFilterBtn"
    />
  );

  return (
    <tr key={field} data-test-subj={`tableDocViewRow-${field}`}>
      {typeof onFilter === 'function' && (
        <td className="osdDocViewer__buttons" data-test-subj="osdDocViewerButtons">
          <EuiPopover
            button={filterButton}
            isOpen={isFilterOpen}
            closePopover={closeFilter}
            panelPaddingSize="xs"
            anchorPosition="downLeft"
            repositionOnScroll
            panelClassName="osdDocViewer__filterPopover"
          >
            <EuiFlexGroup gutterSize="xs" responsive={false} wrap={false}>
              <EuiFlexItem grow={false}>
                <DocViewTableRowBtnFilterAdd
                  disabled={!fieldMapping || !fieldMapping.filterable}
                  onClick={() => {
                    onFilter(fieldMapping, valueRaw, '+');
                    closeFilter();
                  }}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <DocViewTableRowBtnFilterRemove
                  disabled={!fieldMapping || !fieldMapping.filterable}
                  onClick={() => {
                    onFilter(fieldMapping, valueRaw, '-');
                    closeFilter();
                  }}
                />
              </EuiFlexItem>
              {typeof onToggleColumn === 'function' && (
                <EuiFlexItem grow={false}>
                  <DocViewTableRowBtnToggleColumn
                    active={isColumnActive}
                    onClick={() => {
                      onToggleColumn();
                      closeFilter();
                    }}
                  />
                </EuiFlexItem>
              )}
              <EuiFlexItem grow={false}>
                <DocViewTableRowBtnFilterExists
                  disabled={!fieldMapping || !fieldMapping.filterable}
                  onClick={() => {
                    onFilter('_exists_', field, '+');
                    closeFilter();
                  }}
                  scripted={fieldMapping && fieldMapping.scripted}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPopover>
        </td>
      )}
      <td className="osdDocViewer__field" data-test-subj="osdDocViewerField">
        <FastTooltip text={field}>
          <span className="osdDocViewer__fieldInner">
            <FieldName
              fieldName={field}
              fieldType={fieldType}
              fieldIconProps={{ fill: 'none', color: 'gray' }}
              scripted={Boolean(fieldMapping?.scripted)}
            />
          </span>
        </FastTooltip>
        <EuiCopy textToCopy={field}>
          {(copy) => (
            <EuiButtonIcon
              aria-label={`Copy field name`}
              iconType="copy"
              iconSize="s"
              size="xs"
              color="text"
              className="osdDocViewer__copyBtn"
              onClick={copy}
            />
          )}
        </EuiCopy>
      </td>
      <td>
        {isCollapsible && (
          <EuiButtonIcon
            aria-expanded={!isCollapsed}
            aria-label={i18n.translate('discover.docViews.table.toggleFieldDetails', {
              defaultMessage: 'Toggle field details',
            })}
            data-test-subj="collapseBtn"
            onClick={() => onToggleCollapse()}
            iconType={isCollapsed ? 'arrowRight' : 'arrowDown'}
            iconSize="s"
            size="xs"
            color="text"
            className="osdDocViewer__actionButton"
          />
        )}
        {displayUnderscoreWarning && <DocViewTableRowIconUnderscore />}
        {displayNoMappingWarning && <DocViewTableRowIconNoMapping />}
        <FastTooltip text={displayText}>
          <div
            className={valueClassName}
            data-test-subj={`tableDocViewRow-${field}-value`}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(value as string),
            }}
          />
        </FastTooltip>
        <EuiCopy textToCopy={rawText}>
          {(copy) => (
            <EuiButtonIcon
              aria-label={`Copy value`}
              iconType="copy"
              iconSize="s"
              size="xs"
              color="text"
              className="osdDocViewer__copyBtn"
              onClick={copy}
            />
          )}
        </EuiCopy>
      </td>
    </tr>
  );
}
