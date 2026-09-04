/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import classNames from 'classnames';
import { ReactNode } from 'react';
import DOMPurify from 'dompurify';
import { FieldMapping, DocViewFilterFn } from '../../../../types/doc_views_types';
import { DocViewTableRowBtnFilterAdd } from './table_row_btn_filter_add';
import { DocViewTableRowBtnFilterRemove } from './table_row_btn_filter_remove';
import { DocViewTableRowBtnToggleColumn } from './table_row_btn_toggle_column';
import { DocViewTableRowBtnCollapse } from './table_row_btn_collapse';
import { DocViewTableRowIconNoMapping } from './table_row_icon_no_mapping';
import { DocViewTableRowIconUnderscore } from './table_row_icon_underscore';
import { FieldName } from './field_name/field_name';

export interface Props {
  field: string;
  fieldMapping?: FieldMapping;
  fieldType: string;
  // True when this field is the dataset's configured time field. Used, together with
  // the date-typed check, to suppress value filters (see below).
  isTimeField?: boolean;
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

export function DocViewTableRow({
  field,
  fieldMapping,
  fieldType,
  isTimeField,
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
  const valueClassName = classNames({
    exploreDocViewer__value: true,
    'truncate-by-height': isCollapsible && isCollapsed,
  });

  // No value filters on date/time fields: PPL exact-equality on a timestamp is broken
  // (the timezone-formatted display differs from the raw value, and it effectively never
  // matches). Time filtering is owned by the time picker. Still show the column toggle.
  // Mirrors the data-table gate (table_row_content.tsx): suppress on any date-typed field
  // AND on the configured time field regardless of its mapped type (some time fields, e.g.
  // OTEL startTime, are not date-typed).
  const isDateField = fieldType === 'date' || fieldType === 'date_nanos';
  const disableValueFilter = isTimeField || isDateField;

  return (
    <tr key={field} data-test-subj={`tableDocViewRow-${field}`}>
      {typeof onFilter === 'function' && (
        <td className="exploreDocViewer__buttons" data-test-subj="osdDocViewerButtons">
          {!disableValueFilter && (
            <>
              <DocViewTableRowBtnFilterAdd
                disabled={!fieldMapping || !fieldMapping.filterable}
                onClick={() => onFilter(fieldMapping, valueRaw, '+')}
              />
              <DocViewTableRowBtnFilterRemove
                disabled={!fieldMapping || !fieldMapping.filterable}
                onClick={() => onFilter(fieldMapping, valueRaw, '-')}
              />
            </>
          )}
          {typeof onToggleColumn === 'function' && (
            <DocViewTableRowBtnToggleColumn active={isColumnActive} onClick={onToggleColumn} />
          )}
        </td>
      )}
      <td className="exploreDocViewer__field" data-test-subj="osdDocViewerField">
        <FieldName
          fieldName={field}
          fieldType={fieldType}
          fieldIconProps={{ fill: 'none', color: 'gray' }}
          scripted={Boolean(fieldMapping?.scripted)}
        />
      </td>
      <td>
        {isCollapsible && (
          <DocViewTableRowBtnCollapse onClick={onToggleCollapse} isCollapsed={isCollapsed} />
        )}
        {displayUnderscoreWarning && <DocViewTableRowIconUnderscore />}
        {displayNoMappingWarning && <DocViewTableRowIconNoMapping />}
        <div
          className={valueClassName}
          data-test-subj={`tableDocViewRow-${field}-value`}
          /*
           * Justification for dangerouslySetInnerHTML:
           * We just use values encoded by our field formatters. The output is
           * additionally passed through DOMPurify to defend against any unsafe
           * HTML that may slip through the formatters.
           */
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value as string) }}
        />
      </td>
    </tr>
  );
}
